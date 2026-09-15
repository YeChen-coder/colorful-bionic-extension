// Real unpacked-extension tests, including native Chrome storage and a browser restart.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const root = path.join(__dirname, '..');
const output = path.join(root, 'test-results');
fs.mkdirSync(output, { recursive: true });
const profile = fs.mkdtempSync(path.join(output, 'browser-profile-'));
const errors = [];
const server = http.createServer((request, response) => {
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.end(`<!doctype html><html><head><title>Reading fixture</title><style>body{font:18px/1.7 Arial;max-width:740px;margin:48px auto}a{color:#222}</style></head><body>
        <h1>A comfortable reading experience</h1>
        <p id="article">Before words <a id="link" href="#">Clickable reading link</a> after words. Literal &lt;img src=x&gt; &amp; café naïve.</p>
        <p id="dynamic">Dynamic text will appear below.</p>
        <textarea id="editor">Editable text stays unchanged.</textarea>
        <pre><code>const untouched = 'code sample';</code></pre>
        <script>window.clicks=0;window.originalLink=document.getElementById('link');originalLink.addEventListener('click',e=>{e.preventDefault();window.clicks++})</script>
    </body></html>`);
});

async function launch() {
    const context = await chromium.launchPersistentContext(profile, {
        channel: 'chromium',
        executablePath: process.env.BIONIC_CHROMIUM_PATH || undefined,
        headless: true,
        args: [`--disable-extensions-except=${root}`, `--load-extension=${root}`],
        viewport: { width: 1100, height: 850 }
    });
    context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
    return context;
}

async function setInput(page, id, value) {
    await page.locator(`#${id}`).evaluate((input, value) => {
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }, value);
}

(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${server.address().port}`;
    let context;
    try {
        context = await launch();
        const extensions = await context.newPage();
        await extensions.goto('chrome://extensions/');
        const item = extensions.locator('extensions-item').filter({ hasText: 'Colorful Bionic Reading' });
        await item.waitFor();
        const extensionId = await item.getAttribute('id');
        assert.match(extensionId, /^[a-p]{32}$/);
        const popupUrl = `chrome-extension://${extensionId}/popup.html`;
        let popup = await context.newPage();
        await popup.goto(popupUrl);
        await popup.waitForFunction(() => !document.getElementById('controls').disabled);
        assert.equal(await popup.locator('.mode-tab.active').getAttribute('data-mode'), 'single');
        await popup.setViewportSize({ width: 340, height: 650 });
        await popup.screenshot({ path: path.join(output, 'popup-single.png'), fullPage: true, animations: 'disabled' });
        const pages = [await context.newPage(), await context.newPage()];
        for (const page of pages) {
            await page.goto(url);
            await page.locator('#article .bionic-bold').first().waitFor();
            assert.equal(await page.locator('textarea span, code span, img').count(), 0);
        }

        await setInput(popup, 'fontWeight', '500');
        await setInput(popup, 'singleColor', '#125634');
        await setInput(popup, 'fontSize', '130');
        await popup.close(); // Close immediately after the input handler, without waiting for Saved.
        popup = await context.newPage();
        await popup.goto(popupUrl);
        await popup.waitForFunction(() => document.getElementById('fontSize').value === '130');
        for (const page of pages) {
            await page.waitForFunction(() => {
                const element = document.querySelector('#article .bionic-bold');
                return element && getComputedStyle(element).fontWeight === '500' && element.style.fontSize === '1.3em';
            });
            assert.match(await page.locator('#article .bionic-bold').first().evaluate(el => getComputedStyle(el).color), /18, 86, 52/);
        }

        await popup.locator('.toggle-switch').click();
        assert.equal(await popup.locator('#bionicEnabled').isChecked(), false);
        for (const page of pages) {
            await page.waitForFunction(() => !document.querySelector('[data-colorful-bionic]'));
            assert.equal(await page.evaluate(() => originalLink === document.getElementById('link')), true);
            await page.locator('#link').click();
            assert.equal(await page.evaluate(() => clicks), 1);
        }
        await popup.locator('.toggle-switch').click();
        assert.equal(await popup.locator('#bionicEnabled').isChecked(), true);
        await pages[0].locator('#article .bionic-bold').first().waitFor();
        await pages[0].evaluate(() => {
            const paragraph = document.createElement('p');
            paragraph.id = 'added';
            paragraph.textContent = 'Freshly loaded content';
            document.body.append(paragraph);
        });
        await pages[0].locator('#added .bionic-bold').first().waitFor();
        await pages[0].screenshot({ path: path.join(output, 'reading-page.png'), fullPage: true });
        await pages[0].reload();
        await pages[0].waitForFunction(() => document.querySelector('#article .bionic-bold')?.style.fontWeight === '500');

        // Migrate an existing 1.0 installation's choices without overwriting them.
        await popup.evaluate(async () => {
            await chrome.storage.sync.set({ colorMode: 'custom', customColors: ['#654321'], fontWeight: 800, bionicEnabled: false });
            await chrome.storage.local.clear();
        });
        await popup.reload();
        await popup.waitForFunction(() => document.querySelector('.mode-tab.active')?.dataset.mode === 'custom');
        assert.equal(await popup.locator('#bionicEnabled').isChecked(), false);
        await popup.locator('.toggle-switch').click();
        await popup.waitForFunction(() => document.getElementById('saveStatus').dataset.state === 'saved');
        await context.close();

        context = await launch();
        popup = await context.newPage();
        await popup.goto(popupUrl);
        await popup.waitForFunction(() => !document.getElementById('controls').disabled);
        assert.equal(await popup.locator('.mode-tab.active').getAttribute('data-mode'), 'custom');
        assert.equal(await popup.locator('#fontWeight').inputValue(), '800');
        const restartedPage = await context.newPage();
        await restartedPage.goto(url);
        await restartedPage.waitForFunction(() => document.querySelector('#article .bionic-bold')?.style.fontWeight === '800');
        popup.once('dialog', dialog => dialog.accept());
        await popup.locator('#resetBtn').click();
        await popup.waitForFunction(() => document.getElementById('saveStatus').dataset.state === 'saved');
        assert.equal(await popup.locator('.mode-tab.active').getAttribute('data-mode'), 'single');
        assert.deepEqual(errors, []);
        console.log('PASS: native extension defaults, immediate save/close, multi-tab updates, computed styles, toggle/DOM identity, dynamic content, reload, legacy migration, browser restart and reset.');
    } finally {
        if (context) await context.close();
        await new Promise(resolve => server.close(resolve));
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
