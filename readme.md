可以从 Edge 的 Extension Store 去下载。这样起码过了平台的检测，大家用起来也放心一点。下载链接：https://microsoftedge.microsoft.com/addons/detail/colorful-bionic-reading/camgbnhlhdempnekobebpmdhechifjni

这个插件是给患有 ADHD 的阅读者使用的，主要通过对文字改颜色、突出和放大，来提升阅读速度与注意力。因为我也不知道什么样的颜色搭配最合适，而且最适合自己的阅读样式还是自己调更自由，所以我尽可能把所有选项都放上去了：无论是单色、七八九十种颜色，还是你想自由组合两三种颜色都行，字体放大加粗都能调，使用者可以根据自己的喜好随意设置。不登陆，不联网，仅装在自己浏览器上，开箱即用。
不过需要注意一下：对于类似维基百科那种满篇全是文字的页面，插件可能会导致比较卡顿。这确实没办法，因为它是通过前端 CSS 和 DOM element 去处理的，受制于作者技术实现原因，还请大家见谅。

另外，非常感谢之前一位使用者给我发的邮件，谢谢你。虽然这是一个很久之前的项目了，但那封邮件对我来说真的很重要。在经历一些不确定、不安稳的时期时，我总会想起那封邮件，它让我觉得学计算机还是有用的、自己还是能帮到一些人的。
<img width="780" height="257" alt="emailpic-edited" src="https://github.com/user-attachments/assets/0ff4e769-eade-47df-a337-b39f45f2ba0a" />
希望各位 ADHD 的病友们生活顺利吧。虽然我知道估计没什么人看，但还是想在这儿稍微吐槽两句。

作为一名 ADHD 患者，我脑子里总是有很多点子，想出 idea 对我来说并不是难事， 甚至是信手拈来一堆鬼点子的程度。在 vibe coding 的帮助下，用技术去实现它们也变得非常简单。

但每次做完之后，我都很容易陷入一种自我否定。不管开发过程中有多折磨，比如去知道某些功能在代码框架上它就是没有现成的轮子，去反复调试输出、从用户体验的角度做各种优化，也不管中间过程有多繁琐，只要一做完，我就会觉得它的含金量变得很低-我会觉得这不过是任何人去跟 Claude Code 或其他 AI 工具随口要一下就能做出来的东西。

这就导致我在生活中不断遇到困难、自然而然地想出 idea 并用技术解决它，但解决完之后又觉得它的含金量就那么一点，完全不值得当作一个积累发布出来。我自认是处于开发者和一个产品经理之间的一个角色，但是我在这两件事情上都是个半吊子。这个定位并不能保证说把二者的优势都发挥出来，但是可以肯定的是，它一定是会让二者的劣势互相叠加、互相攻击的。

正因如此，反馈对我真的很重要。就拿这个项目来说，虽然我觉得它非常一般，技术上很常规，界面很AI，但既然它能真实地帮助到其他人（哪怕只是帮大家节省一些 Token），我还是想把它以及之前做过的一些小东西发布出来。哪怕只是从给大家提供更多选择的角度来看，我也会觉得做这些事情是有意义的。
真的很感谢给我发邮件的人，谢谢你。

Colorful Bionic Reading transforms any webpage by highlighting the first part of each word in vibrant colors, helping you read faster with better comprehension and less eye strain.

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
