// One source of defaults and validation for the popup and every content script.
globalThis.BionicSettings = (() => {
    const defaults = Object.freeze({
        bionicEnabled: true,
        boldRatio: 50,
        fontSize: 110,
        fontWeight: 700,
        colorMode: 'single',
        singleColor: '#3366ff',
        customColors: Object.freeze(['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3']),
        rainbowColors: Object.freeze(['#ff6b6b', '#ffa726', '#66bb6a', '#42a5f5', '#ab47bc', '#ef5350']),
        colorIntensity: 70
    });
    const isColor = value => typeof value === 'string' && /^#[\da-f]{6}$/i.test(value);
    const number = (value, fallback, min, max, step = 1) =>
        typeof value === 'number' && Number.isFinite(value)
            ? Math.round(Math.min(max, Math.max(min, value)) / step) * step : fallback;
    const palette = (value, fallback) => {
        const colors = Array.isArray(value) ? value.filter(isColor).slice(0, 8) : [];
        return colors.length ? [...colors] : [...fallback];
    };

    function normalize(value = {}) {
        const input = value && typeof value === 'object' ? value : {};
        return {
            bionicEnabled: typeof input.bionicEnabled === 'boolean' ? input.bionicEnabled : defaults.bionicEnabled,
            boldRatio: number(input.boldRatio, defaults.boldRatio, 20, 80),
            fontSize: number(input.fontSize, defaults.fontSize, 80, 150),
            fontWeight: number(input.fontWeight, defaults.fontWeight, 400, 900, 100),
            colorMode: ['single', 'rainbow', 'custom'].includes(input.colorMode) ? input.colorMode : defaults.colorMode,
            singleColor: isColor(input.singleColor) ? input.singleColor : defaults.singleColor,
            customColors: palette(input.customColors, defaults.customColors),
            rainbowColors: palette(input.rainbowColors, defaults.rainbowColors),
            colorIntensity: number(input.colorIntensity, defaults.colorIntensity, 30, 100)
        };
    }

    async function load() {
        const local = await chrome.storage.local.get('settings');
        if (local.settings) return normalize(local.settings);
        // Version 1.0 stored individual keys in sync. Preserve that user's choices.
        const legacy = await chrome.storage.sync.get(Object.keys(defaults));
        const latest = await chrome.storage.local.get('settings');
        return normalize(latest.settings || legacy);
    }

    function save(value) {
        // Start immediately: popup timers are lost when the popup closes.
        // Local storage avoids sync's per-minute quota while dragging sliders.
        return chrome.storage.local.set({ settings: normalize(value) });
    }

    return { defaults, normalize, load, save };
})();
