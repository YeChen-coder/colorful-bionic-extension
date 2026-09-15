// Shared DOM renderer: webpage text is never interpreted as HTML.
globalThis.BionicRenderer = (() => {
    const wordPattern = /[\p{Script=Latin}][\p{Script=Latin}\p{M}]*/gu;

    function hasWords(text) {
        for (const match of text.matchAll(wordPattern)) {
            if ([...match[0]].length >= 2) return true;
        }
        return false;
    }

    function fragment(document, text, settings, state = { colorIndex: 0 }) {
        const result = document.createDocumentFragment();
        let offset = 0;
        for (const match of text.matchAll(wordPattern)) {
            const letters = [...match[0]];
            if (letters.length < 2) continue;
            result.append(document.createTextNode(text.slice(offset, match.index)));
            const length = Math.ceil(letters.length * settings.boldRatio / 100);
            const bold = document.createElement('span');
            bold.className = 'bionic-bold';
            const colors = settings.colorMode === 'custom' ? settings.customColors : settings.rainbowColors;
            const color = settings.colorMode === 'single' ? settings.singleColor : colors[state.colorIndex % colors.length];
            state.colorIndex++;
            const rgb = [1, 3, 5].map(start => parseInt(color.slice(start, start + 2), 16));
            bold.style.setProperty('color', `rgba(${rgb.join(', ')}, ${settings.colorIntensity / 100})`, 'important');
            bold.style.setProperty('font-size', `${settings.fontSize / 100}em`, 'important');
            bold.style.setProperty('font-weight', String(settings.fontWeight), 'important');
            bold.textContent = letters.slice(0, length).join('');
            result.append(bold, document.createTextNode(letters.slice(length).join('')));
            offset = match.index + match[0].length;
        }
        result.append(document.createTextNode(text.slice(offset)));
        return result;
    }

    return { hasWords, fragment };
})();
