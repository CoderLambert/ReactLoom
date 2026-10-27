# E11 Streamdown — Agent 工程使用规则

**用途**：不完整 Markdown 的实时展示；不是模型服务、状态管理器或用户输入净化系统。原研究为 SUMMARY_ONLY，此次源码标记 recreated。
**版本**：2.6.0 是已查证发行基线；PLATFORM 在安装前重新核对 package peer 和锁文件，不从历史摘要推断2.7.1存在。
**迁移**：先读 `examples/example.tsx`。在目标项目按 messageId 累加 chunk 后将**累计 Markdown**传入 `<Streamdown isAnimating={loading}>`；请求取消必须停止累积。代码同源，没有额外手写展示版本。
**保留**：用户可见的暂停/取消、Effect 清理、外链与远程图片安全政策、对不可信 HTML 禁止执行、长会话重绘预算。
**禁止**：把动态HTML当安全 Markdown；为历史测试记录PASS；每个delta作为整个消息覆盖；默认加载所有媒体/插件。
**验证命令**：目标项目 typecheck/build/Chromium，未安装的本库 SDK 不得记为已验证。重点覆盖不完整代码围栏、协议型链接、重挂与Abort、键盘和移动端。
**关系**：E12 assistant-ui用于消息状态；E06 react-markdown用于静态文章；E09 Shiki仅在需要时添加高亮。
**来源**：https://github.com/vercel/streamdown 和 https://streamdown.ai 。
