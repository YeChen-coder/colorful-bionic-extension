可以从 Edge 的 Extension Store 去下载。这样起码过了平台的检测，大家用起来也放心一点。下载链接：https://microsoftedge.microsoft.com/addons/detail/colorful-bionic-reading/camgbnhlhdempnekobebpmdhechifjni -2026 年 9 月 14 日补充：更新了一下，把之前那个设置 default 不行的 bug 改了。另外，也把原来那个一进去就是五颜六色的页面改了，还是尽可能不要太一下子太 OP 了。现在进去，看到的是单色的。更新的包刚传到 Microsoft Add-on Platform 去做审核了，等审核完就能看到了。

这个插件是给患有 ADHD 的阅读者使用的，主要通过对文字改颜色、突出和放大，来提升阅读速度与注意力。因为我也不知道什么样的颜色搭配最合适，而且最适合自己的阅读样式还是自己调更自由，所以我尽可能把所有选项都放上去了：无论是单色、七八九十种颜色，还是你想自由组合两三种颜色都行，字体放大加粗都能调，使用者可以根据自己的喜好随意设置。不登陆，不联网，仅装在自己浏览器上，开箱即用。
对于类似维基百科那种满篇全是文字的页面，插件需要处理较多 DOM 文本节点。1.1.0 改为分批处理，并支持动态加载的正文；特别长的页面仍可能需要等待一会儿。

另外，非常感谢之前一位使用者给我发的邮件，谢谢你。虽然这是一个很久之前的项目了，但那封邮件对我来说真的很重要。在经历一些不确定、不安稳的时期时，我总会想起那封邮件，它让我觉得学计算机还是有用的、自己还是能帮到一些人的。
<img width="780" height="257" alt="emailpic-edited" src="https://github.com/user-attachments/assets/0ff4e769-eade-47df-a337-b39f45f2ba0a" />


希望各位 ADHD 的病友们生活顺利吧。虽然我知道估计没什么人看，但还是想在这儿稍微吐槽两句。

作为一名 ADHD 患者，我脑子里总是有很多点子，想出 idea 对我来说并不是难事， 甚至是信手拈来一堆鬼点子的程度。在 vibe coding 的帮助下，用技术去实现它们也变得非常简单。(不可否认的是，过程确实很折磨。但是相比起那些 start from scratch（从零开始自己一行一行写代码），那简直简单了不止一个量级)

但每次做完之后，我都很容易陷入一种自我否定。不管开发过程中有多折磨，比如去知道某些功能在代码框架上它就是没有现成的轮子，去反复调试输出、从用户体验的角度做各种优化，也不管中间过程有多繁琐，只要一做完，我就会觉得它的含金量变得很低-我会觉得这不过是任何人去跟 Claude Code 或其他 AI 工具随口要一下就能做出来的东西。

这就导致我在生活中不断遇到困难、自然而然地想出 idea 并用技术解决它，但解决完之后又觉得它的含金量就那么一点，完全不值得当作一个积累发布出来。我自认是处于开发者和一个产品经理之间的一个角色，但是我在这两件事情上都是个半吊子。这个定位并不能保证说把二者的优势都发挥出来，但是可以肯定的是，它一定是会让二者的劣势互相叠加、互相攻击的。

正因如此，反馈对我真的很重要。就拿这个项目来说，虽然我觉得它非常一般，技术上很常规，界面很AI，但既然它能真实地帮助到其他人（哪怕只是帮大家节省一些 Token），我还是想把它以及之前做过的一些小东西发布出来。哪怕只是从给大家提供更多选择的角度来看，我也会觉得做这些事情是有意义的。

真的很感谢给我发邮件的人，谢谢你。

🌈 **Three Color Modes:** - 三种模式，随便选颜色
- Rainbow Mode - Cycles through 6 vibrant colors automatically
- Single Color - Choose one consistent color for focus
- Custom Palette - Create your own collection of up to 8 colors

⚙️ **Complete Customization:** - 字体放大啊，缩小啊，加粗啊，这个那个的，反正对文字的一些操作选项都给了，怎么看顺眼怎么调。
- Font Size Control (80% - 150%)
- Bold Weight Selection (6 levels from normal to ultra-bold)
- Color Intensity Adjustment (30% - 100%)
- Word Highlighting Ratio (20% - 80%)

## Installation - 通用的装extention的流程，没什么特别的
1. Download or clone this repository
2. Open Edge browser
3. Go to `edge://extensions/`
4. Enable Developer mode
5. Click "Load unpacked" and select the extension folder

## 1.1.0 更新：默认 Single，自动记住设置

- 首次使用及点击 **Reset to Default** 时默认选择 **Single**；已有用户之前保存的 Rainbow / Custom 等偏好会保留。
- 修改开关、颜色、字体或比例后立即保存，下次打开弹窗、刷新网页或重启浏览器都会沿用。弹窗会显示保存状态和失败提示。
- 设置保存在当前浏览器配置的 `chrome.storage.local` 中，不需要登录。兼容读取 1.0 的 `chrome.storage.sync` 设置，第一次修改后转为本地保存；1.1.0 不进行跨设备同步。卸载扩展会删除设置。
- 已打开的普通网页也会响应设置变更，关闭开关会恢复原文；关闭期间仍可调整偏好。
- 修复字体粗细被 CSS 强制覆盖、自定义色板增删后界面不更新、重置时色板默认值被修改等问题。
- 网页与预览使用同一份文本渲染逻辑。通过文本节点构建高亮，网页中的 `<`、`>` 等字符不会被当作 HTML 执行；恢复时保留原有链接、元素及事件监听器。
- 跳过输入框、可编辑区域、代码块、SVG 和数学内容。支持拉丁字母单词（包括重音字符）；中文等其他文字保持原样。
- 长页面分批处理，不再截断到前 2,000 个文本节点；支持后来添加或更新的正文，避免重复嵌套高亮。
- 只保留 `storage` 权限，网页注入由声明式 content scripts 完成。

### 更新本地安装

1. 拉取最新代码，或解压打包后的扩展文件夹。
2. 在 `edge://extensions/` 或 `chrome://extensions/` 中找到已加载的扩展，点击重新加载。
3. 刷新之前已经打开的网页，让新版本脚本生效。不要先卸载扩展，否则会丢失浏览器保存的设置。

浏览器内置页面、扩展商店等受保护页面无法修改。GitHub 源码更新不会自动更新 Edge 商店版本，商店发布需要单独提交。

### 开发与测试

运行扩展无需构建或安装 npm 依赖。测试需要 Node.js 22.12+：

```sh
npm ci
npm test
npx playwright install chromium
npm run test:browser
npm run package
```

`npm test` 覆盖默认值、旧设置兼容、关闭弹窗前立即保存、保存失败、色板与重置、开关、多页面同步、文本安全、原有 DOM/事件保留、动态内容及长页面取消。`npm run test:browser` 在实际 Chromium 中加载扩展，验证原生存储、计算后的字体样式、刷新和浏览器重启后的恢复；截图写入 `test-results/`。可通过 `BIONIC_CHROMIUM_PATH` 指定已安装的支持加载扩展的 Chromium 测试程序。

`npm run package` 将运行所需文件复制到 `dist/colorful-bionic-1.1.0/`，不包含测试依赖。GitHub Actions 会运行两组测试并保留扩展文件作为构建产物。
