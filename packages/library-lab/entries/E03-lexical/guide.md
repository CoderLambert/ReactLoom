# Lexical 0.52：从编辑器状态到可迁移的内容模型

## 工程定位和安装

Lexical 用不可变 `EditorState`、命令、节点和扩展实现可组合编辑器。适合新闻 CMS、富文本协作、AI 编辑器；只有纯文本输入时优先原生 `textarea`，要开箱即用块级编辑器应比较 BlockNote，要复用 ProseMirror 扩展应比较 Tiptap。它不是 HTML 安全净化器，也不会替业务提供上传、权限或持久化后端。

```bash
pnpm add lexical@0.52.0 @lexical/react@0.52.0
```

演示使用官方现存的 `LexicalComposer` + `RichTextPlugin`、`HistoryPlugin`、`OnChangePlugin`，文件 `examples/example.tsx` 直接用于应用运行及源码展示。v0.52 也提供现代 `LexicalExtensionComposer`，新项目应按官方扩展指南评估迁移；不要直接混用两套 composer 或跨版本复制插件配置。

## 理解数据流

输入/选区 → Lexical 命令与同步 `editor.update` → pending state → 批量 reconciliation → 不可变的已提交 EditorState → update listener / React onChange。带 `$` 的 `$getRoot`、`$getSelection` 等必须在 Lexical 的 read/update 上下文中调用。不要在 React render 中直接调用，更不要在 `editor.update(async ()=>{})` 内等待 HTTP 请求。

### basic：真实输入与节点结构

打开 Demo → 入门 → 运行。输入并查看文本长度，通过 `OnChangePlugin` + `editorState.read` 提取文本；按钮使用 `editor.update` 修改当前文档，不直接操纵 contentEditable.innerHTML。

### business：新闻草稿序列化

演示仅将 `editor.getEditorState().toJSON()` 序列化到条目专属 sessionStorage，限制 100KB；恢复调用 `parseEditorState` + `setEditorState`，失败不得用损坏内容覆盖编辑器。真实产品还必须提供文档ID、版本迁移、保存失败提示、用户权限和服务端 Schema 验证。

### advanced：命令与边界

`FORMAT_TEXT_COMMAND` 对**选中的文本**应用 bold；无选区的行为不同于“选中段落”。用中文 IME、撤销、粘贴和键盘测试。处理选区浮层时不要假定命令回调中的 DOM 已完成 reconciliation。

## 生产最佳实践

1. **EditorState 是内容事实源**，不要存 DOM HTML 作为唯一主格式；若发布 HTML，独立进行内容净化和可信 URL/图片策略。
2. **实例所有权**由 Composer 负责，React 状态只管理应用侧状态；不要每次输入重建 composer 和所有 nodes。
3. **节点向后兼容**：升级之前为已保存 JSON 做回放测试；自定义节点类型、版本和迁移策略要明确。
4. **输入安全**：粘贴的 HTML、图片、外部资源均不可信；Demo 未提供 HTML 粘贴净化或远端协作保证。
5. **性能和可访问性**：大文档按节点/业务拆分；验证真实中文输入法、移动浏览器、屏幕阅读器和撤销语义，而非只依赖 jsdom。
6. **权限**：编辑器禁用按钮≠服务端鉴权；真正保存要带用户授权和审计，不能跨文档恢复缓存。

## 易犯错误对照

- 在 render 中调用 `$getRoot()` → 使用 `editorState.read`。
- 保存 `innerHTML`、回填 `dangerouslySetInnerHTML` → 保存结构化 JSON，输出 HTML 时另外净化。
- 每次 keystroke 重新创建 Editor → 保持 composer 配置稳定。
- 只跑英文输入单测 → 加上 IME / Mobile / 粘贴 / Undo 浏览器验收。
- 忽略历史文档兼容 → 对老版本 JSON 加迁移与回放测试。

## 检查与组合

先从 E04 CodeMirror 了解“编辑代码”与“编辑内容”的差别，再与 E01 Tiptap / E02 BlockNote 比较。目标 SDK 构建/浏览器尚待执行，`verification.json` 不得根据旧研究的单测结果写 PASS。

官方：[React 组件](https://lexical.dev/docs/react/plugins) · [序列化](https://lexical.dev/docs/concepts/serialization) · [GitHub](https://github.com/facebook/lexical) · [v0.52.0 Release](https://github.com/facebook/lexical/releases/tag/v0.52.0)。核心 MIT；原创本地示例。

## EF 第十五批：安全恢复与场景独立性

`parseEditorState` 可以成功解析根为空的快照，而官方 `setEditorState` 对空根会拒绝或执行不同的恢复策略。迁移时先运行本条 `assertLexicalSnapshot`，只接受 root → paragraph → text/linebreak/tab 的基础节点、至少一个段落、最多400节点、8层深度及100KB快照；再验证 `restored.isEmpty()` 为 false，最后真正调用 SDK 的 `setEditorState`。该保守验证仅覆盖本实验没有注册自定义节点的 Composer；若接入表格/列表/图像，需要明确更新节点 Schema 和迁移脚本。

React `LexicalComposer` 绑定 `key={level}`，场景切换后不再意外复用旧草稿、HistoryPlugin 历史与选区。无需也不允许把 JSON 直接作为 `innerHTML`。新建 `tests/policy.test.mjs` 为不依赖 Lexical 的负例；必须另跑真实 SDK、TypeScript 和 Chromium。
