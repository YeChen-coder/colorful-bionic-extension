const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8').replace(/^\uFEFF/, ''));
const output = path.join(root, 'dist', `colorful-bionic-${manifest.version}`);
fs.mkdirSync(output, { recursive: true });
for (const file of ['manifest.json', 'settings.js', 'renderer.js', 'content.js', 'bionic.css', 'popup.html', 'popup.css', 'popup.js']) {
    fs.copyFileSync(path.join(root, file), path.join(output, file));
}
console.log(`Load unpacked extension from: ${output}`);
