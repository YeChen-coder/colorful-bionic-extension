document.addEventListener('DOMContentLoaded', async () => {
    const byId = id => document.getElementById(id);
    const panel = byId('settingsPanel');
    const status = byId('saveStatus');
    const preview = byId('previewText');
    const sample = preview.textContent.trim();
    const modeTabs = document.querySelectorAll('.mode-tab');
    const ranges = ['boldRatio', 'fontSize', 'fontWeight', 'colorIntensity'];
    const weights = { 400: 'Normal', 500: 'Medium', 600: 'Semi-bold', 700: 'Bold', 800: 'Extra-bold', 900: 'Ultra-bold' };
    let settings;
    let saveRevision = 0;

    function renderPreview() {
        preview.replaceChildren(settings.bionicEnabled
            ? BionicRenderer.fragment(document, sample, settings)
            : document.createTextNode(sample));
    }

    function renderPalette() {
        const palette = byId('customColorPalette');
        palette.replaceChildren();
        settings.customColors.forEach((color, index) => {
            const item = document.createElement('div');
            item.className = 'color-item';
            const input = document.createElement('input');
            input.type = 'color';
            input.value = color;
            input.setAttribute('aria-label', `Palette color ${index + 1}`);
            input.addEventListener('input', () => {
                settings.customColors[index] = input.value;
                save();
            });
            const remove = document.createElement('button');
            remove.className = 'remove-color';
            remove.textContent = '×';
            remove.title = `Remove color ${index + 1}`;
            remove.setAttribute('aria-label', remove.title);
            remove.disabled = settings.customColors.length === 1;
            remove.addEventListener('click', () => {
                settings.customColors.splice(index, 1);
                renderPalette();
                save();
            });
            item.append(input, remove);
            palette.append(item);
        });
        byId('addColorBtn').disabled = settings.customColors.length >= 8;
    }

    function render() {
        byId('bionicEnabled').checked = settings.bionicEnabled;
        panel.classList.toggle('disabled', !settings.bionicEnabled);
        ranges.forEach(key => {
            byId(key).value = settings[key];
            byId(`${key}Value`).textContent = key === 'fontWeight' ? weights[settings[key]] : `${settings[key]}%`;
        });
        modeTabs.forEach(tab => {
            const selected = tab.dataset.mode === settings.colorMode;
            tab.classList.toggle('active', selected);
            tab.setAttribute('aria-pressed', String(selected));
        });
        byId('singleColorSetting').hidden = settings.colorMode !== 'single';
        byId('customColorSetting').hidden = settings.colorMode !== 'custom';
        byId('singleColor').value = settings.singleColor;
        byId('singleColorPreview').style.backgroundColor = settings.singleColor;
        renderPreview();
    }

    function save() {
        const thisSave = ++saveRevision;
        status.textContent = 'Saving…';
        status.dataset.state = 'saving';
        // Start persistence before rendering; no popup timer can lose this edit.
        const pending = BionicSettings.save(settings);
        render();
        pending.then(() => {
            if (thisSave !== saveRevision) return;
            status.textContent = 'Saved · used automatically on webpages';
            status.dataset.state = 'saved';
        }).catch(error => {
            if (thisSave !== saveRevision) return;
            status.textContent = 'Could not save. Please try changing the setting again.';
            status.dataset.state = 'error';
            console.error('Unable to save settings:', error);
        });
    }

    try {
        settings = await BionicSettings.load();
    } catch (error) {
        status.textContent = 'Could not load settings. Please reopen the popup.';
        status.dataset.state = 'error';
        console.error('Unable to load settings:', error);
        return;
    }
    byId('controls').disabled = false;
    byId('version').textContent = `v${chrome.runtime.getManifest().version}`;
    render();
    renderPalette();
    status.textContent = 'Changes are saved automatically in this browser';

    byId('bionicEnabled').addEventListener('change', event => {
        settings.bionicEnabled = event.target.checked;
        save();
    });
    ranges.forEach(key => byId(key).addEventListener('input', event => {
        settings[key] = Number(event.target.value);
        save();
    }));
    modeTabs.forEach(tab => tab.addEventListener('click', () => {
        settings.colorMode = tab.dataset.mode;
        save();
    }));
    byId('singleColor').addEventListener('input', event => {
        settings.singleColor = event.target.value;
        save();
    });
    byId('addColorBtn').addEventListener('click', () => {
        if (settings.customColors.length >= 8) return;
        settings.customColors.push(BionicSettings.defaults.customColors[settings.customColors.length % BionicSettings.defaults.customColors.length]);
        renderPalette();
        save();
    });
    byId('resetBtn').addEventListener('click', () => {
        if (!confirm('Reset all settings to Single color and the original defaults?')) return;
        settings = BionicSettings.normalize();
        renderPalette();
        save();
    });
});
