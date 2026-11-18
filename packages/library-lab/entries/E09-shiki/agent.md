# E09 Shiki 工程复用

只读源码着色，不是编辑器/编译器/净化器。固定shiki4.5.0，实装package与固定LICENSE为MIT，内置语法/主题等资产许可随依赖保留。

已有React/TSX ESM项目运行`pnpm add shiki@4.5.0`。复制example.tsx、highlight.mjs/.d.mts、highlight-session.mjs/.d.mts；demo只转发。TS Bundler，动态import/WASM支持；无Provider/env/CSS/账号/Worker。github-light固定主题，只有TS/JSON/HTML选择，fontStyle保留未绘制。

UI真实runtime从shiki/bundle/web调用codeToTokens，同源SDK测试。4.5 bundle是createSingletonShorthands共享highlighter，不能声称每次新建；语言/主题本地动态import与shiki/wasm需由打包器/CSP支持，不接用户grammar URL，不dispose他人的singleton。

160ms自建scheduleHighlight cleanup清pending timer并live=false，无法取消已开始token化；迟到成功/失败不写回。code/lang变化清行与状态，level重置输入，卸载清自有调度；不全局清缓存。maxLength3000仅UTF16 UI限制，生产自己限额。

渲染token.content为React文本，颜色来自主题，禁止innerHTML/codeToHtml注入。HTML语法不执行源码。真实IME/浏览器无请求无执行必须独立验收，Node token通过不等于DOM安全PASS。无上传/持久化/流式/Markdown接线。

SDK真实token与调度policy分计；browser proposal交主控，formal sdk/build/browser无匹配receipt仍NOT_RUN。官方固定package README与LICENSE在official，主页unknown不是允许嵌入。
