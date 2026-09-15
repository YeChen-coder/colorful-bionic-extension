(() => {
    if (globalThis.__colorfulBionicLoaded) return;
    globalThis.__colorfulBionicLoaded = true;

    const excluded = 'script, style, noscript, textarea, input, select, option, button, code, pre, kbd, samp, svg, math, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [hidden], [inert]';
    const wrapperSelector = '[data-colorful-bionic]';
    const originals = new Map();
    const roots = new Set();
    const colorState = { colorIndex: 0 };
    let settings;
    let timer;
    let walker;
    let rootText;
    let revision = 0;
    let disposed = false;

    function eligible(node) {
        const parent = node.parentElement;
        return node.isConnected && parent && parent.namespaceURI === 'http://www.w3.org/1999/xhtml' &&
            !parent.closest(`${excluded}, ${wrapperSelector}`) && BionicRenderer.hasWords(node.data);
    }

    function restore(wrapper, original) {
        if (wrapper.parentNode) {
            // Preserve text changed by the site while the extension was active.
            original.data = wrapper.textContent;
            wrapper.replaceWith(original);
        }
        originals.delete(wrapper);
    }

    function collectMutations(records) {
        for (const record of records) {
            const parent = record.target.nodeType === Node.ELEMENT_NODE ? record.target : record.target.parentElement;
            const wrapper = parent?.closest(wrapperSelector);
            if (wrapper && originals.has(wrapper)) {
                const container = wrapper.parentNode;
                restore(wrapper, originals.get(wrapper));
                if (container) roots.add(container);
            } else if (record.type === 'characterData') {
                roots.add(record.target);
            } else {
                // If a site removes the walker's current node between batches,
                // revisit its container so later siblings are still reached.
                if (record.removedNodes.length) roots.add(record.target);
                record.addedNodes.forEach(node => {
                    if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE) roots.add(node);
                });
            }
        }
        for (const wrapper of originals.keys()) {
            if (!wrapper.isConnected) originals.delete(wrapper);
        }
    }

    const observer = new MutationObserver(records => {
        observer.disconnect();
        collectMutations(records);
        observe();
        schedule();
    });

    function observe() {
        if (settings?.bionicEnabled && document.body) {
            observer.observe(document.body, { childList: true, characterData: true, subtree: true });
        }
    }

    function schedule() {
        if (!timer && settings?.bionicEnabled && (roots.size || walker || rootText)) {
            timer = setTimeout(processBatch, 16);
        }
    }

    function nextNode() {
        while (true) {
            if (rootText) {
                const node = rootText;
                rootText = null;
                return node;
            }
            if (walker) {
                const node = walker.nextNode();
                if (node) return node;
                walker = null;
            }
            if (!roots.size) return null;
            const root = roots.values().next().value;
            roots.delete(root);
            if (!root.isConnected) continue;
            if (root.nodeType === Node.TEXT_NODE) rootText = root;
            else walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
                acceptNode: node => eligible(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
            });
        }
    }

    function processBatch() {
        timer = null;
        collectMutations(observer.takeRecords());
        observer.disconnect();
        // Gather before replacing text so traversal cannot descend into our spans.
        const batch = [];
        const started = performance.now();
        let node;
        while (batch.length < 80 && performance.now() - started < 8 && (node = nextNode())) {
            if (eligible(node)) batch.push(node);
        }
        for (const text of batch) {
            if (!eligible(text)) continue;
            const wrapper = document.createElement('span');
            wrapper.className = 'bionic-processed';
            wrapper.dataset.colorfulBionic = '';
            wrapper.append(BionicRenderer.fragment(document, text.data, settings, colorState));
            if (walker?.currentNode === text) walker.currentNode = wrapper;
            text.replaceWith(wrapper);
            originals.set(wrapper, text);
        }
        observe();
        schedule();
    }

    function apply(value) {
        revision++;
        const next = BionicSettings.normalize(value);
        if (JSON.stringify(next) === JSON.stringify(settings)) return;
        settings = next;
        clearTimeout(timer);
        timer = null;
        observer.disconnect();
        walker = null;
        rootText = null;
        roots.clear();
        for (const [wrapper, original] of originals) restore(wrapper, original);
        colorState.colorIndex = 0;
        if (settings.bionicEnabled && document.body) roots.add(document.body);
        observe();
        schedule();
    }

    function settingsChanged(changes, area) {
        if (area === 'local' && changes.settings) apply(changes.settings.newValue);
    }
    chrome.storage.onChanged.addListener(settingsChanged);
    window.addEventListener('pagehide', event => {
        if (event.persisted) return; // Back/forward cache keeps this page alive.
        disposed = true;
        clearTimeout(timer);
        observer.disconnect();
        chrome.storage.onChanged.removeListener(settingsChanged);
        originals.clear();
        roots.clear();
    });

    const initialRevision = revision;
    BionicSettings.load().then(value => {
        if (!disposed && revision === initialRevision) apply(value);
    }).catch(error => console.error('Unable to load Colorful Bionic settings:', error));
})();
