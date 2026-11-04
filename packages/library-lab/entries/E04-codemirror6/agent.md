# E04 CodeMirror 6 — 工程手册

## 适用

嵌入式源码、配置和 Markdown 原文，需要光标、撤销和语法包。只读代码块用 E09。语言服务和 Worker 用 E05。富文本不要用 EditorView 硬做。

## 版本

`codemirror@6.0.2`、`@codemirror/state@6.7.6`、`@codemirror/lang-javascript@6.2.5`，MIT。不要拆开升级后混用旧教程里的 State API。高亮是主线程语言包，不是语言服务器。

## 迁移

复制 `examples/example.tsx` 的 effect 创建、`basicSetup`、`javascript({ typescript: true })`、只读 `Compartment` 和 `view.destroy()`。`examples/demo.tsx` 只是再导出。凡是进入 `EditorState.create` 或 `dispatch` 的存储文本都先过 `assertDraftText`。产品保存改为 API 时仍从 `view.state.doc.toString()` 读取，不要从 React state 读权威正文。

## 不可删的清理

一个 parent 只有一个 `EditorView`。effect 清理必须 `destroy()`，且只销毁这次创建的实例。换 `level` 会重建；切换只读不准把 `readOnly` 放进 effect 依赖去销毁视图。`updateListener` 在 destroy 之后不能再 `setLength`。取消过期的 dispatch：恢复失败时不要改文档。

## 反例

- 渲染路径里 `new EditorView`。
- 受控 React 字符串在每次 onChange 后整篇替换，打断输入法。
- 切换只读时销毁视图。
- 卸载不 `destroy`。
- `sessionStorage` 原样 `insert`，不查 50_000 和 NUL。
- `eval` 文档或在监听器里自动上传。
- 用策略单测代替「DOM 上已没有 `.cm-editor`」。
- 声称语法包已经满足 CSP Worker 要求。本示例没有 Worker。

## 测试断言

- 非字符串、超长、含 NUL 的草稿被 `assertDraftText` 拒绝。
- 浏览器：按键不新增 View；只读不丢撤销栈；坏草稿不覆盖；离开 Demo 后 parent 清空。
- business 启动时坏草稿被忽略并提示，不抛到视图外面。
- Node 测试不创建 EditorView。

## 真实限制

50_000 只保护会话恢复，不证明语法正确，也不执行代码。示例没有诊断、没有多文件、没有自动保存。中文输入法和读屏没有收据。

## 证据

sdk、build、browser 保持 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有 E04 收据。Actions `41779873259` 是仓库级运行，不是本条目 PASS。

资料：https://codemirror.net/docs/guide/ 与 https://codemirror.net/examples/readonly/ 。
