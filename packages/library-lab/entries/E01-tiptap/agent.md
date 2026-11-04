# E01 Tiptap — 工程手册

## 适用

自定义富文本、Schema 扩展、受控工具栏、结构化 JSON 文档。开箱块界面先评估 E02。代码编辑用 E04 或 E05。只读 Markdown 用 E06。一行备注用 textarea。

## 版本

`library.json` 将 `@tiptap/react`、`@tiptap/pm`、`@tiptap/starter-kit` 都钉在 3.32.0，MIT。三包同版本。不要把 v2 的 `setContent(doc, false)` 抄进 v3。StarterKit v3 已含 Link、Underline、ListKeymap，不要再注册同名扩展。

## 迁移

从 `examples/example.tsx` 带走 `useEditor`、`immediatelyRender: false`、`EditorContent`、`editor.chain().focus()`、`update` 的成对 `on`/`off`。`examples/demo.tsx` 只是再导出。恢复逻辑必须继续调用 `examples/snapshot-policy.mjs` 的 `parseTiptapSnapshot`，再 `setContent(json, { errorOnInvalidContent: true })`。用产品 API 替换 sessionStorage 时带上 schema 版本和权限。不要复制 Lab 容器样式。

## 不可删的清理

`useEditor` 拥有编辑器实例，卸载时由 Hook 销毁，不要再手动 destroy 一次。`editor.on('update', update)` 的清理函数必须 `editor.off('update', update)`，函数身份相同。`key={level}` 让三层各自挂载，不要用 CSS 把编辑器藏起来继续收事件。恢复失败不得清空当前文档。

## 反例

- 在 render 里 `new Editor()`，或每次击键 `setContent`。
- `document.execCommand` 代替 `chain().focus()`。
- `onUpdate` 把整篇 `getJSON()` 写入全局 state 或每个字母写存储。
- `getHTML()` 直接 `dangerouslySetInnerHTML`。
- 固定一个 editor 跨路由复用。
- 恢复时只看 `type === 'doc'`，不跑节点白名单。
- 新增图片或自定义 mark 却不改 `snapshot-policy.mjs`。
- 把 Node 策略测试写成 Tiptap SDK 已通过。

## 测试断言

- 超过 20_000 字符、未知节点、过深、`javascript:` 或带凭据的 href 都被 `parseTiptapSnapshot` 拒绝。
- 合法 StarterKit JSON 才能交给 `setContent(..., { errorOnInvalidContent: true })`。
- 浏览器里：选区加粗和撤销改变文档；坏草稿留下原文；离开 Demo 后不再 `setState`。
- 中文输入法组合期间正文不被 effect 重写。没有收据就不要写成已测。

## 真实限制

策略只覆盖这份文本 StarterKit。`errorOnInvalidContent` 拒绝未知 schema，不是 HTML 净化器。示例没有 debounce、没有 `useEditorState`、没有上传、没有协作。`sessionStorage` 可被同源脚本改写。

## 证据

没有 `docs/library-lab/evidence/runs/` 里 E01 的收据时，sdk、build、browser 保持 NOT_RUN。Actions `41779873259` 是仓库级运行，不是本条目 PASS。`node --test packages/library-lab/entries/E01-tiptap/tests/policy.test.mjs` 只证明策略函数。

资料：https://tiptap.dev/docs/editor/getting-started/install/react 与 https://tiptap.dev/docs/editor/api/editor 。
