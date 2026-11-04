# E03 Lexical — 工程手册

## 适用

需要自己掌握命令、选区和节点协议的富文本。开箱块 UI 用 E02。ProseMirror 扩展用 E01。代码用 E04 或 E05。只读页不要挂 Composer。

## 版本

`lexical@0.52.0` 与 `@lexical/react@0.52.0`，MIT。两个包一起锁定。序列化字段以这份 0.52 JSON 为准，不把 HTML 字符串交给 `parseEditorState`。

## 迁移

带走 `examples/example.tsx` 的 `useMemo` 配置、`LexicalComposer`、`RichTextPlugin`、`ContentEditable`、`HistoryPlugin`、`OnChangePlugin`、`LexicalErrorBoundary`。`examples/demo.tsx` 只是再导出。保存用 `getEditorState().toJSON()`。恢复必须先 `assertLexicalSnapshot`，拒绝空文档，再用 `parseEditorState` 和 `setEditorState`。加粗保持 `onMouseDown` 的 `preventDefault` 再派发 `FORMAT_TEXT_COMMAND`。

## 不可删的清理

Composer 拥有 editor，不要并行 `createEditor`。`key={level}` 或产品的 `key={documentId}` 用来换文档。`OnChangePlugin` 随卸载解除。恢复失败只提示，不清空根节点。`initialConfig` 保持稳定引用。

## 反例

- 每次渲染新建 `initialConfig` 或把草稿 JSON 放进会变的 config。
- 在 `onChange` 里 `setEditorState`。
- 渲染函数里直接调用 `$getRoot()`。
- 加粗按钮不阻止 mousedown，选区丢失。
- 损坏 JSON 时 `clear()`。
- 把 `toJSON()` 当净化后的 HTML。
- 增加 Link 或自定义节点却不改 `snapshot-policy.mjs`。
- `registerUpdateListener` 不保存 unregister。

## 测试断言

- 超过 100_000 字符、未知节点、过深、带 `href` / `url(` / `expression(` 的快照被拒绝。
- 只有 `root` / `paragraph` / `text` / `linebreak` / `tab` 能通过当前策略。
- 浏览器：输入改变长度；坏草稿不覆盖；有选区时加粗；换层后不再 setState。
- 策略测试不导入 Lexical，不能写成 SDK PASS。

## 真实限制

示例没有多文档键、没有粘贴净化、没有协作、没有服务端版本。空选区的加粗可能只影响下一次输入。中文输入法没有浏览器收据。

## 证据

sdk、build、browser 保持 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有 E03 收据。Actions `41779873259` 是仓库级运行，不是本条目 PASS。

资料：https://lexical.dev/docs/getting-started/react 与 https://lexical.dev/docs/concepts/serialization 。
