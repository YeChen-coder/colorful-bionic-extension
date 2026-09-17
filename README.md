# Colorful Bionic Reading Extension

[Chinese version](README_zh.md)

Download the extension from the [Microsoft Edge Add-ons store](https://microsoftedge.microsoft.com/addons/detail/colorful-bionic-reading/camgbnhlhdempnekobebpmdhechifjni). The store review gives users an additional level of confidence before installing it.

**Update — September 14, 2026:** Version 1.1.0 fixes the bug that prevented the default setting from working correctly. I also replaced the intensely multicolored initial view with a calmer single-color default so that the first impression is less overwhelming. The updated package has been submitted to the Microsoft Add-ons platform and will become available after review.

This extension is designed for readers with ADHD. It helps improve reading speed and attention by changing text colors, emphasizing portions of words, and adjusting font size and weight. Because there is no single color combination that works best for everyone—and because each person should be free to create a comfortable reading style—I included as many options as possible. You can use one color, cycle through many colors, or build a custom palette of two or three colors. Font size and weight are also adjustable. The extension requires no account or network connection, runs only in your own browser, and works immediately after installation.

Text-heavy pages such as Wikipedia contain many DOM text nodes for the extension to process. Version 1.1.0 processes those nodes in batches and supports dynamically loaded content, although exceptionally long pages may still take a little time.

I also want to thank the user who once sent me an email. Although this is an old project, that message meant a great deal to me. During uncertain or unstable periods, I often think about it. It reminds me that studying computer science is useful and that I can still help someone through the things I build.

<img width="780" height="257" alt="Edited screenshot of user feedback email" src="https://github.com/user-attachments/assets/0ff4e769-eade-47df-a337-b39f45f2ba0a" />

I hope life goes well for everyone else living with ADHD. I know few people may read this, but I still want to share a personal reflection.

As someone with ADHD, I constantly have ideas. Coming up with them is not difficult for me; I can produce all kinds of strange ideas almost effortlessly. With the help of vibe coding, turning those ideas into working technology has also become much easier. The process can certainly still be painful, but compared with starting from scratch and writing every line by hand, it is easier by more than an order of magnitude.

Yet whenever I finish something, I tend to fall into self-doubt. No matter how difficult development was—discovering that a framework simply has no ready-made solution for a feature, repeatedly debugging output, or making countless user-experience improvements—as soon as the work is complete, I begin to feel that it has little value. I tell myself that anyone could ask Claude Code or another AI tool for the same thing and receive it immediately.

This creates a recurring pattern: I encounter a problem in daily life, naturally think of a technical solution, build it, and then decide that the result is too trivial to publish as part of my body of work. I see myself as occupying a role somewhere between developer and product manager, while still being only partly proficient at each. That position does not guarantee that the strengths of both roles will reinforce each other; it can just as easily cause their weaknesses to compound and attack one another.

That is why feedback matters so much to me. I consider this project fairly ordinary: its technology is conventional and its interface looks AI-generated. But if it genuinely helps another person—even if it only saves someone a few tokens—I still want to publish it and some of the other small tools I have built. Providing people with more choices is enough to make the work meaningful.

To the person who emailed me: thank you, truly.

## Features

🌈 **Three Color Modes:**

- Rainbow Mode - Cycles through 6 vibrant colors automatically
- Single Color - Choose one consistent color for focus
- Custom Palette - Create your own collection of up to 8 colors

⚙️ **Complete Customization:**

- Font Size Control (80% - 150%)
- Bold Weight Selection (6 levels from normal to ultra-bold)
- Color Intensity Adjustment (30% - 100%)
- Word Highlighting Ratio (20% - 80%)

## Installation

The extension uses the standard unpacked-extension installation process:

1. Download or clone this repository
2. Open Edge browser
3. Go to `edge://extensions/`
4. Enable Developer mode
5. Click "Load unpacked" and select the extension folder

## Version 1.1.0: Single-Color Default and Persistent Settings

- On first use and after selecting **Reset to Default**, the extension now defaults to **Single** mode. Existing users keep their previously saved Rainbow, Custom, and other preferences.
- Changes to the enable switch, colors, fonts, or ratios are saved immediately. They persist when the popup is reopened, the page is refreshed, or the browser restarts. The popup reports both successful saves and failures.
- Settings are stored in `chrome.storage.local` for the current browser profile and require no account. Version 1.1.0 can read settings from version 1.0's `chrome.storage.sync`; after the first change, it converts them to local storage. Version 1.1.0 does not sync settings across devices. Uninstalling the extension removes the saved settings.
- Ordinary pages that are already open respond to setting changes. Turning the extension off restores the original text, and preferences can still be adjusted while it is disabled.
- Fixed several issues: CSS overriding the selected font weight, the UI failing to refresh after colors were added to or removed from a custom palette, and reset actions mutating the palette's default value.
- Web pages and the preview now share the same text-rendering logic. Highlights are built from text nodes, so characters such as `<` and `>` are not executed as HTML. Restoring a page preserves its original links, elements, and event listeners.
- The extension skips inputs, editable regions, code blocks, SVG elements, and mathematical content. It supports Latin-script words, including accented characters; Chinese and other scripts remain unchanged.
- Long pages are processed in batches rather than being truncated after the first 2,000 text nodes. Content added or updated later is supported without creating nested duplicate highlights.
- The only permission retained is `storage`; page injection is performed through declarative content scripts.

### Updating a Local Installation

1. Pull the latest code or extract the packaged extension folder.
2. Find the loaded extension at `edge://extensions/` or `chrome://extensions/` and click **Reload**.
3. Refresh any pages that were already open so that the new script takes effect. Do not uninstall the extension first, because uninstalling it deletes the settings stored by the browser.

Protected pages, including built-in browser pages and extension stores, cannot be modified. Updates to the GitHub source do not automatically update the Edge store release; each store release must be submitted separately.

### Development and Testing

Running the extension requires no build step or npm dependencies. Tests require Node.js 22.12 or later:

```sh
npm ci
npm test
npx playwright install chromium
npm run test:browser
npm run package
```

`npm test` covers defaults, compatibility with older settings, immediate saves before the popup closes, save failures, palette management and reset behavior, the enable switch, synchronization across multiple pages, safe text handling, preservation of the original DOM and event listeners, dynamic content, and cancellation on long pages.

`npm run test:browser` loads the extension in a real Chromium instance and verifies native storage, computed font styles, page refreshes, and state restoration after a browser restart. Screenshots are written to `test-results/`. Set `BIONIC_CHROMIUM_PATH` to select an installed Chromium-compatible test executable that supports loading extensions.

`npm run package` copies the runtime files to `dist/colorful-bionic-1.1.0/` without test dependencies. GitHub Actions runs both test suites and retains the packaged extension as a build artifact.
