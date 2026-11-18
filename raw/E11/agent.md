# E11 Streamdown 工程使用指南

适用于 React 中持续追加的 Markdown 消息。Streamdown 2.6.0 负责块级解析、未闭合语法的显示修复、GFM 和 React 渲染；模型请求、消息 ID、存储、取消与限流由应用管理。静态文章可选 E06；聊天运行时可与 E12 组合，避免创建第二份消息状态。

## 读取与迁移

先读 `library.json`、`guide.md`、`examples/example.tsx`、`examples/stream-session.mjs`、`examples/markdown-policy.mjs` 和 `verification.json`。复制 examples 下实现、fixture、样式及 `.d.mts`；`demo.tsx` 只是适配出口。安装 `streamdown@2.6.0`，使用匹配的 React/React DOM，按目标 CSS 位置调整 Tailwind v4 的 `@source`。

生产接入按 messageId 保存累计全文；每个 delta 追加到已有正文，然后传给 `<Streamdown mode="streaming">`。`isAnimating` 表示接收阶段，`parseIncompleteMarkdown` 控制语法修复，两者不是同一开关。接收暂停不会清空正文；提前结束保留部分内容。定时器和请求按拥有者清理；接真实服务必须另外接入 AbortController。

2.6.0 的顶层 memo comparator 没有比较 `parseIncompleteMarkdown`。本例保留随修复开关变化的 renderer key，使同一累计正文上的选项切换生效；只重建 Streamdown，不能连同输入会话重置。单次 SSR 的开启/关闭对照不代替 React 实例更新的浏览器回归。

## 输出策略与边界

本例保留默认 remark/rehype 链，使用 `skipHtml`，禁用图片节点，只允许 `https://streamdown.ai` origin 且无 URL 用户名/密码的链接。自定义 `a` 替代默认链接组件及其确认弹窗；这是应用白名单，不是库的默认安全保证。自定义 `rehypePlugins` 会替换默认数组，不能在迁移时漏掉 sanitize。不要开启任意自定义标签或直接拼接 HTML。

没有安装 code/math/mermaid/cjk 插件。普通代码块不等于 Shiki 高亮；本地 fixture 不等于真实模型流，也不覆盖网络错误、重连或服务器持久化。

## 断言与证据

- basic 第 2 段，源文保留 `**流式`；开启修复可见 `span[data-streamdown="strong"]`，关闭后此节点消失且源文不变。第 6 段代码已可见，第 7 段完成。
- business 完成后有两数据行表格、两个 disabled 任务 checkbox、官方 HTTPS 链接。未知外站/危险协议不生成链接，远程图片无 img，原始脚本无执行节点。
- 播放后暂停/提前结束/重置，等待超过 700ms 不再追加。自然完成和离开 Demo 后清除本例 interval；重进段数为 0，仍需实际 timer instrumentation 才能证明卸载清理。
- Node SDK 测试真实 import Streamdown 并调用 react-dom/server。状态测试只验证本例 reducer；两类证据分开记录。浏览器/构建与正式收据状态以 `local-validation.md` / `verification.json` 为准。

来源固定到 tag `streamdown@2.6.0` 的提交 `8a2ac221a878a0fc5839f2035c1e16575cfa3440`；README 原文见 `official/readme.md`。原研究仅摘要，始终保留 `SUMMARY_ONLY` / `recreated`，不得改称原件恢复。
