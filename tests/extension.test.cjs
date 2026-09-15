const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.join(__dirname, '..');
const source = file => fs.readFileSync(path.join(root, file), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));

function makeStore(legacy = {}, local = {}) {
    const listeners = new Set();
    const store = { local, legacy, writes: 0, failSave: false };
    store.chrome = {
        runtime: { getManifest: () => ({ version: '1.1.0' }) },
        storage: {
            local: {
                get: async () => plain(local),
                set: values => {
                    store.writes++;
                    if (store.failSave) return Promise.reject(new Error('Storage unavailable'));
                    const oldValue = local.settings;
                    Object.assign(local, plain(values));
                    const newValue = plain(local.settings);
                    queueMicrotask(() => listeners.forEach(fn => fn({ settings: { oldValue, newValue } }, 'local')));
                    return Promise.resolve();
                }
            },
            sync: { get: async () => plain(legacy) },
            onChanged: { addListener: fn => listeners.add(fn), removeListener: fn => listeners.delete(fn) }
        }
    };
    return store;
}

async function environment(t, store, html = '<p>Hello reading world</p>', popup = false) {
    const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://example.test/' });
    t.after(() => {
        if (!dom.window.document) return;
        dom.window.dispatchEvent(new dom.window.PageTransitionEvent('pagehide', { persisted: false }));
        dom.window.close();
    });
    const win = dom.window;
    win.chrome = store.chrome;
    win.console.error = () => {};
    win.eval(source('settings.js'));
    win.eval(source('renderer.js'));
    if (popup) {
        if (win.document.readyState === 'loading') await new Promise(resolve => win.document.addEventListener('DOMContentLoaded', resolve, { once: true }));
        win.eval(source('popup.js'));
        win.document.dispatchEvent(new win.Event('DOMContentLoaded'));
        await until(() => !win.document.getElementById('controls').disabled);
    }
    return win;
}

async function until(condition, timeout = 8000) {
    const start = Date.now();
    while (!condition()) {
        if (Date.now() - start > timeout) throw new Error('Timed out waiting for expected DOM');
        await new Promise(resolve => setTimeout(resolve, 20));
    }
}
const wrappers = win => win.document.querySelectorAll('[data-colorful-bionic]');
const content = win => win.eval(source('content.js'));

test('fresh defaults are Single; updates retain legacy preferences and disabled state', async t => {
    const fresh = await environment(t, makeStore());
    assert.equal((await fresh.BionicSettings.load()).colorMode, 'single');
    const store = makeStore({ colorMode: 'custom', customColors: ['#123456'], bionicEnabled: false, fontWeight: 500 });
    const first = await environment(t, store);
    const before = plain(await first.BionicSettings.load());
    assert.equal(before.colorMode, 'custom');
    assert.equal(before.bionicEnabled, false);
    const updated = await environment(t, store);
    assert.deepEqual(plain(await updated.BionicSettings.load()), before);
    assert.equal(store.writes, 0, 'loading or updating must never reset settings');
});

test('validation clamps ranges, rejects invalid palettes, and isolates defaults', async t => {
    const win = await environment(t, makeStore());
    const value = win.BionicSettings.normalize({ fontSize: 999, boldRatio: -1, colorIntensity: NaN, colorMode: 'bad', singleColor: '<img>', customColors: [], fontWeight: 551 });
    assert.equal(value.fontSize, 150);
    assert.equal(value.boldRatio, 20);
    assert.equal(value.colorIntensity, 70);
    assert.equal(value.colorMode, 'single');
    assert.equal(value.fontWeight, 600);
    value.customColors[0] = '#000000';
    assert.equal(win.BionicSettings.normalize().customColors[0], '#ff6b6b');
});

test('popup saves immediately, survives closing, and loads all preferences on reopen', async t => {
    const store = makeStore();
    const win = await environment(t, store, source('popup.html'), true);
    const slider = win.document.getElementById('fontWeight');
    slider.value = '500';
    slider.dispatchEvent(new win.Event('input'));
    assert.equal(store.writes, 1, 'write starts in the input handler, without a timeout');
    win.document.querySelector('[data-mode="custom"]').click();
    win.close();
    const reopened = await environment(t, store, source('popup.html'), true);
    assert.equal(reopened.document.getElementById('fontWeight').value, '500');
    assert.equal(reopened.document.querySelector('.mode-tab.active').dataset.mode, 'custom');
    assert.equal(reopened.document.getElementById('customColorSetting').hidden, false);
});

test('palette additions/removals update immediately and reset restores pristine Single defaults', async t => {
    const store = makeStore();
    const win = await environment(t, store, source('popup.html'), true);
    const doc = win.document;
    doc.querySelector('[data-mode="custom"]').click();
    doc.getElementById('addColorBtn').click();
    doc.getElementById('addColorBtn').click();
    assert.equal(doc.querySelectorAll('.color-item').length, 8);
    assert.equal(doc.getElementById('addColorBtn').disabled, true);
    for (let i = 0; i < 7; i++) doc.querySelector('.remove-color').click();
    assert.equal(doc.querySelectorAll('.color-item').length, 1);
    assert.equal(doc.querySelector('.remove-color').disabled, true);
    const color = doc.querySelector('.color-item input');
    color.value = '#000000';
    color.dispatchEvent(new win.Event('input'));
    win.confirm = () => true;
    doc.getElementById('resetBtn').click();
    assert.equal(store.local.settings.colorMode, 'single');
    assert.equal(store.local.settings.customColors[0], '#ff6b6b');
    assert.equal(doc.querySelectorAll('.color-item').length, 6);
});

test('saving failure is visible instead of falsely claiming success', async t => {
    const store = makeStore();
    const win = await environment(t, store, source('popup.html'), true);
    store.failSave = true;
    win.document.querySelector('[data-mode="rainbow"]').click();
    await until(() => win.document.getElementById('saveStatus').dataset.state === 'error');
    assert.match(win.document.getElementById('saveStatus').textContent, /Could not save/);
});

test('startup uses the entire saved configuration; both open pages respond to changes', async t => {
    const store = makeStore({ colorMode: 'single', singleColor: '#123456', fontWeight: 500, fontSize: 130 });
    const pages = await Promise.all([environment(t, store), environment(t, store)]);
    pages.forEach(content);
    for (const win of pages) {
        await until(() => wrappers(win).length === 1);
        const bold = win.document.querySelector('.bionic-bold');
        assert.equal(bold.style.fontWeight, '500');
        assert.equal(bold.style.fontSize, '1.3em');
        assert.match(bold.style.color, /18, 52, 86/);
    }
    const settings = await pages[0].BionicSettings.load();
    await pages[0].BionicSettings.save({ ...settings, bionicEnabled: false });
    for (const win of pages) await until(() => wrappers(win).length === 0);
    await pages[0].BionicSettings.save({ ...settings, fontWeight: 900 });
    for (const win of pages) {
        await until(() => wrappers(win).length === 1);
        assert.equal(win.document.querySelector('.bionic-bold').style.fontWeight, '900');
    }
});

test('literal markup stays text; form controls, code and editors are untouched', async t => {
    const html = '<p id="text">Literal &lt;img src=x onerror=alert(1)&gt; &amp; café naïve</p><textarea>Hello editor</textarea><div contenteditable><p>Edit here please</p></div><pre><code>const value = 123;</code></pre><svg><text>vector words</text></svg>';
    const win = await environment(t, makeStore(), html);
    const original = win.document.body.textContent;
    content(win);
    await until(() => wrappers(win).length === 1);
    assert.equal(win.document.body.textContent, original);
    assert.equal(win.document.querySelectorAll('img').length, 0);
    assert.equal(win.document.querySelectorAll('textarea span, [contenteditable] span, code span, svg span').length, 0);
});

test('restoration preserves element identity, event listeners, sibling text and site edits', async t => {
    const store = makeStore();
    const win = await environment(t, store, '<p>Before words <a href="#">Clickable link</a> after words <em>more text</em> final words.</p>');
    const doc = win.document;
    const link = doc.querySelector('a');
    const originalTextNode = doc.querySelector('p').firstChild;
    let clicks = 0;
    link.addEventListener('click', event => { event.preventDefault(); clicks++; });
    content(win);
    await until(() => wrappers(win).length === 5);
    const dynamic = doc.createElement('button');
    dynamic.textContent = 'Site added button';
    doc.querySelector('p').append(dynamic);
    await win.BionicSettings.save({ ...(await win.BionicSettings.load()), bionicEnabled: false });
    await until(() => wrappers(win).length === 0);
    assert.equal(doc.querySelector('a'), link);
    assert.equal(doc.querySelector('p').firstChild, originalTextNode);
    assert.equal(doc.querySelector('button'), dynamic);
    link.click();
    assert.equal(clicks, 1);
});

test('dynamic paragraphs and changed text are processed without nesting', async t => {
    const win = await environment(t, makeStore());
    content(win);
    await until(() => wrappers(win).length === 1);
    const paragraph = win.document.createElement('p');
    paragraph.textContent = 'Newly loaded article';
    win.document.body.append(paragraph);
    await until(() => wrappers(win).length === 2);
    paragraph.querySelector('.bionic-bold').firstChild.data = 'Changed';
    await until(() => paragraph.textContent.startsWith('Changed') && paragraph.querySelector('.bionic-bold').textContent !== 'Changed');
    assert.equal(win.document.querySelectorAll('[data-colorful-bionic] [data-colorful-bionic]').length, 0);
    content(win);
    assert.equal(wrappers(win).length, 2, 'duplicate injection is harmless');
});

test('long pages exceed the old 2000-node cutoff and disable cancels pending batches', async t => {
    const store = makeStore();
    const win = await environment(t, store, '<p>Long article words.</p>'.repeat(2105));
    content(win);
    await until(() => wrappers(win).length === 2105, 20000);
    const current = await win.BionicSettings.load();
    await win.BionicSettings.save({ ...current, fontSize: 140 });
    await until(() => wrappers(win).length > 0 && wrappers(win).length < 2105);
    await win.BionicSettings.save({ ...current, bionicEnabled: false });
    await until(() => wrappers(win).length === 0);
    await new Promise(resolve => setTimeout(resolve, 100));
    assert.equal(wrappers(win).length, 0);
});

test('an initially disabled extension can be enabled and uses the same preview rendering', async t => {
    const store = makeStore({ bionicEnabled: false });
    const win = await environment(t, store);
    content(win);
    await new Promise(resolve => setTimeout(resolve, 40));
    assert.equal(wrappers(win).length, 0);
    await win.BionicSettings.save({ ...(await win.BionicSettings.load()), bionicEnabled: true });
    await until(() => wrappers(win).length === 1);
    const expected = win.document.createElement('div');
    expected.append(win.BionicRenderer.fragment(win.document, 'Hello reading world', await win.BionicSettings.load()));
    assert.equal(wrappers(win)[0].innerHTML, expected.innerHTML);
});

test('removing the active traversal node does not skip the remaining article', async t => {
    const win = await environment(t, makeStore(), '<p>Article text here.</p>'.repeat(240));
    content(win);
    await until(() => wrappers(win).length > 0 && wrappers(win).length < 240);
    const processed = wrappers(win);
    processed[processed.length - 1].parentElement.remove();
    await until(() => wrappers(win).length === 239);
    assert.equal(win.document.querySelectorAll('[data-colorful-bionic] [data-colorful-bionic]').length, 0);
});
