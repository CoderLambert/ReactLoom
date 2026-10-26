# E09 Shiki — Agent 实施手册

任务：面向静态 Markdown/RSS/AI 回答代码块的语法着色。不得把词法上色当代码执行、Lint 或类型验证。需要编辑时选 E04/E05。

**复用源码**：`examples/example.tsx` 从真实 `codeToTokens` 输出按 React 文本 token 映射；`examples/demo.tsx` 仅导出。使用时迁移 `codeToTokens` 和 token→文本组件，不复制 Lab 状态 UI；主题/语言白名单按产品调整。

**运行边界**：宿主只在需要时动态 import；输入限长，防抖，Effect 取消代次，异步错误反馈。中等以上文档量应共享 highlighter 或由服务端预处理，不要在列表页大批初始化 WASM。

**禁止**：不可信源码 `dangerouslySetInnerHTML` 直接插入；全量加载上百语言；凭颜色判断 TS 类型正确；未测浏览器就写 PASS。

**可验证断言**：真实 `shiki@4.5.0` import 成功；HTML 字符串的 script/onerror 仅作为文字显示；切换语言后无旧 token 覆盖；未启动 Demo 时无语法引擎资源下载。当前 SDK/build/browser 未在 EF 本轮执行。

资料：https://shiki.style/guide/install ，https://shiki.style/guide/best-performance 。许可 MIT，主题/grammar 需单独检查。
