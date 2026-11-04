# Lexical 0.52.0｜EditorState、Composer 和有界 JSON

`lexical` 与 `@lexical/react` 在 `library.json` 里都是 **0.52.0**，MIT。Lexical 把文档放在 `EditorState` 里，DOM 只是视图。适合要自己拆命令、节点和 React 插件的编辑器。它不提供现成的 Notion 工具栏（看 E02），也不替代代码编辑器（E04 / E05）。

## Lab 当前示例

真实组件是 [`examples/example.tsx`](examples/example.tsx)。[`examples/demo.tsx`](examples/demo.tsx) 只再导出。JSON 边界在 [`examples/snapshot-policy.mjs`](examples/snapshot-policy.mjs)。用户点开 Demo 后才挂载。`LexicalComposer` 的 `key={level}` 让三层各有一份编辑器。

挂载的内容：

- `initialConfig` 用 `useMemo` 固定：`namespace: 'reactloom-library-lab-E03'`，`onError` 直接抛出，主题只给加粗和段落一个 class。配置对象不随按键重建。
- `RichTextPlugin` + `ContentEditable` + `LexicalErrorBoundary` + `HistoryPlugin`。
- `OnChangePlugin` 设了 `ignoreSelectionChange`，在 `state.read` 里取 `$getRoot().getTextContent()` 的长度。
- business / advanced：保存 `editor.getEditorState().toJSON()` 到 `reactloom:library-lab:E03:article:v1`。上限 `MAX_SNAPSHOT` 100_000。恢复先 `assertLexicalSnapshot`，再 `parseEditorState`；空文档拒绝；异常时不覆盖当前正文。
- advanced：加粗按钮在 `onMouseDown` 里 `preventDefault`，再 `dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')`。空选区可能只改下一次输入的格式。
- 重置在 `editor.update` 里 `clear` 根节点并写入一段纯文本。不清其他页面的存储。

策略只允许 `root`、`paragraph`、`text`、`linebreak`、`tab`。深度 8，访问节点不超过 400。拒绝 `href`、`src`、`url`、`on*`。`style` 若存在，长度不超过 256，并且不能出现 `url(` 或 `expression(`。这是段落文本演示的边界，不是通用 Lexical schema。

没有挂载：多篇文章互不污染的存储键、粘贴净化插件、自定义节点、Markdown 往返、协作、服务端保存。那些留在后面的生产教学里。

## 1. 什么时候用

已经确认的环境是 React 客户端。`library.json` 没有把 Lexical 写成已在本 Lab 跑过 SDK。

| 任务 | 判断 |
| --- | --- |
| 产品要控制命令、选区和节点协议 | 适合 Lexical |
| 要 ProseMirror 扩展生态 | E01 |
| 要开箱块 UI | E02 |
| 代码高亮和多光标语言 | E04 / E05 |
| 只读文章 | 不要挂 Composer |

## 2. EditorState 不是 DOM

```text
键盘 / 输入法 / 粘贴
        │
        ▼
ContentEditable（视图）
        │
        ▼
editor.update → EditorState（权威）
        ├─ HistoryPlugin 记录撤销
        ├─ OnChangePlugin 读纯文本长度（本示例）
        └─ toJSON() 只在按钮按下时写出
```

1. 不要把 `innerHTML` 当文档。保存的是 JSON。
2. 读节点用 `editor.read` / `state.read` 或 `editor.update`。在 React 渲染函数里直接调 `$getRoot()` 是非法的。
3. `setEditorState` 会换掉当前状态。只在用户确认恢复时调用。每个字符把 JSON parse 回去会打断输入法。
4. Composer 拥有 editor。不要在外面再 `createEditor` 一份来抢销毁。

命令表（本示例只用了其中一部分）：

| API | Lab |
| --- | --- |
| `LexicalComposer` | 已挂载，配置 memo |
| `RichTextPlugin` / `ContentEditable` | 已挂载 |
| `HistoryPlugin` | 已挂载 |
| `OnChangePlugin` | 已挂载，忽略纯选区变化 |
| `FORMAT_TEXT_COMMAND` | 仅 advanced |
| `getEditorState().toJSON()` | 保存按钮 |
| `parseEditorState` + `setEditorState` | 恢复按钮 |
| `editor.registerUpdateListener` | 未使用；若使用必须返回的 unregister |
| 自定义 Node / Paste 插件 | 未挂载 |

官方模型：[React 入门](https://lexical.dev/docs/getting-started/react)、[序列化](https://lexical.dev/docs/concepts/serialization)。

## 3. 三层

在 Library Lab 打开 E03 再运行。没有 `src/App.tsx`，也没有单独的 Vite 端口。

### 基本

在带边框的编辑区输入。占位「输入新闻摘要…」是绝对定位的段落，`pointerEvents: none`，不是第二个编辑器。长度输出跟着纯文本变。撤销由 `HistoryPlugin` 提供，示例没有单独的撤销按钮。

### 业务

保存和恢复都是按钮。超限、存储被禁用、JSON 损坏或节点不在白名单时，状态文案说明未覆盖。键是固定的一份草稿，不是三篇知识库文章。生产若要多文档，每篇独立键，并用 `key={documentId}` 重建 Composer。

### 进阶

选中文字再点加粗。按钮阻止 `mousedown` 的默认行为，是为了点击时不丢掉选区。再用中文输入法、撤销和粘贴看选区。示例没有实现粘贴净化；不可信 HTML 不能靠这段 JSON 白名单在粘贴瞬间滤掉。导出若要 HTML，另走 E10。

## 4. 反例（带代码）

### 反例 1：按键重建 initialConfig

```tsx
<LexicalComposer initialConfig={{ namespace: 'x', editorState: json, onError }} />
```

`initialConfig` 在每次渲染新建时，编辑器可能被重置。Lab 用 `useMemo` 配空依赖，初始文档交给用户输入和重置按钮，而不是把 JSON 放进会变的 config。

### 反例 2：用 HTML 字符串恢复

```tsx
editor.setEditorState(editor.parseEditorState(htmlString))
```

`parseEditorState` 要的是 EditorState JSON。把 HTML 塞进去会失败或产生意外节点。Lab 只在 `assertLexicalSnapshot` 通过后解析。

### 反例 3：OnChange 里 setEditorState

```tsx
<OnChangePlugin onChange={(state) => {
  editor.setEditorState(editor.parseEditorState(JSON.stringify(state.toJSON())))
}} />
```

这会在每次更新时重入。监听只读文本长度。

### 反例 4：加粗按钮吃掉选区

```tsx
<button onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}>加粗</button>
```

点击按钮会让 ContentEditable 失焦，选区消失，命令作用在空选区。Lab 在 `onMouseDown` 里 `preventDefault`。

### 反例 5：恢复失败后清空

```tsx
try { editor.setEditorState(next) } catch { editor.update(() => $getRoot().clear()) }
```

损坏草稿应留下正在编辑的内容。Lab 的 catch 只改文案。

### 反例 6：把 toJSON() 当已净化 HTML

JSON 里仍可能有你们以后加上的链接和样式。当前白名单拒绝 `href`，是因为这份演示没有链接节点。加上 LinkNode 却不改策略，等于把检查废掉。

### 反例 7：监听不注销

```ts
editor.registerUpdateListener(() => setState(...))
```

返回值必须在卸载时调用。离开 Demo 后不能再 `setState`。本示例的长度订阅走 `OnChangePlugin`，随 Composer 一起卸下。

### 反例 8：在渲染期间调用 $ 函数

```tsx
function View() {
  const text = $getRoot().getTextContent()
}
```

`$` 函数只能在 read 或 update 里调用。否则会在开发环境直接抛错。

## 5. 输入法、粘贴、SSR

组合输入期间不要 `setEditorState`，不要在 `onChange` 里根据半成品拼音改文档。验收要用真实中文输入法。本示例没有这项收据。

粘贴的生产做法是独立插件：按节点类型接收，拒绝脚本和未知元素，而不是正则替换 HTML。Lab 没有这个插件。

Lexical 的 Composer 需要 DOM。服务端渲染阅读页应输出你们自己的安全 HTML 或纯文本，不要在服务器 `createEditor` 去模拟选区。

## 6. 组合（未挂载）

**TanStack Query。** Query 拥有已发布文章。Composer 拥有未保存的 EditorState。加载完成后只在文档 id 变化时 `setEditorState`。409 显示对照。

**Zod。** 在 `assertLexicalSnapshot` 之外再做产品 schema。节点种类变了就要同时改策略和 schema。

**E10。** 若阅读页要 HTML，在 sink 之前净化。不要把 `toJSON()` 当成净化结果。

**E01 / E02。** 三者的 JSON 不能互相 `JSON.parse` 后直接设回去。迁移要有映射表。

## 7. 升级核对

锁定 0.52.0 的两个包一起升，不要只升 `lexical`。看 [v0.52.0](https://github.com/facebook/lexical/releases/tag/v0.52.0)。自定义节点的序列化字段变了，旧草稿会被 `assertLexicalSnapshot` 拒绝，这是预期，不要在 catch 里放宽白名单。

从 DOM `contentEditable` 迁过来时，先把旧 HTML 转成已知节点再 `editor.update` 插入，并保留原文备份。

## 8. 故障清单

- 一输入就光标跳：config 是否每次渲染新建，或 onChange 里是否 `setEditorState`。
- 加粗无效：是否有选区；空选区只影响后续输入。
- 恢复总失败：节点是否超出段落 / 文本，或超过 100_000 字符。
- 长度不更新：是否只改了选区。插件忽略了纯选区变化，这是故意的。
- 卸载后控制台警告：监听里还有 `setState`。

## 9. 验收

1. basic：输入改变长度，撤销可用。
2. business：保存、刷新标签页内恢复；坏 JSON 留下原文；超限不写入。
3. advanced：有选区时加粗；按钮按下不丢掉选区。
4. 换层后旧 Composer 不再更新长度。
5. 中文输入法与粘贴仍是待浏览器验收的项。

`tests/policy.test.mjs` 不导入 `lexical`。sdk、build、browser 保持 **NOT_RUN**。没有 `docs/library-lab/evidence/runs/` 的 E03 收据就不能写 PASS。Actions `41779873259` 是仓库级运行，不是本条目通过。

## 10. 资料

- https://lexical.dev/docs/getting-started/react
- https://lexical.dev/docs/concepts/serialization
- https://github.com/facebook/lexical
- https://github.com/facebook/lexical/releases/tag/v0.52.0
