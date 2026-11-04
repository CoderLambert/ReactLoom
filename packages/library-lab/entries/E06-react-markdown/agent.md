# E06 react-markdown — Agent 工程手册

## 决策入口

React 需要显示 Markdown：优先 react-markdown；需要编辑复杂块文档时选 Tiptap/BlockNote；需要执行 MDX JSX 属于另一条明确授信的渲染路径，不能把不可信 Markdown 当 MDX 执行。

## 可复用文件

`examples/example.tsx` 中的 `Markdown`、`remarkGfm`、`rehypeSanitize`、`skipHtml`、`render-policy.mjs` 中的 `safeMarkdownURL` 和 `markdownComponents` 是核心，`examples/demo.tsx` 是 Lab 的懒加载适配。包：react-markdown@10.1.0、remark-gfm@4.0.1、rehype-sanitize@6.0.0。锁文件与真实依赖安装由目标工程确认。

## 不可删除的保护

- 不支持任意执行 JSX；不把用户字符串直接交给 `innerHTML`。
- 不可信 HTML 默认跳过；若启用 rehype-raw，重新审计 sanitizer 插件链。
- 自定义链接组件不得放过 javascript/data/file 协议或不可信重定向。
- 外部图片默认禁止或由产品制定清晰允许域/代理；避免泄漏私密 URL。
- 动态编辑/长文档内容的高亮与解析可能开销大，需按需加载。

## 测试重点

basic：粗体与安全链接可访问。business：GFM table 和任务清单正确生成。advanced：script、事件处理器不进入 DOM；javascript 链接不能被点击执行；图像不触发外部资源下载。测试必须在真正安装包与浏览器时运行，不用静态语义判断假设安全。

## 相关

E07 remark / E08 rehype / E09 Shiki / E10 DOMPurify；当前SDK/浏览器状态未实测。官方：https://github.com/remarkjs/react-markdown

## 新增同源安全规则

复制 `examples/example.tsx` 时必须连同 `examples/render-policy.mjs`，否则会漏掉外链与跟踪图片策略。不随意增加相对 URL、图片或 MDX；变更后先运行真实 SDK SSR 套件，再在浏览器观察真实网络、CSP 与场景切换。尚无实际执行证据时保持SDK/Browser NOT_RUN。
