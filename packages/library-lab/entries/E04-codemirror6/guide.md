# CodeMirror 6｜一个 EditorView 对应一块 DOM

`library.json` 钉住 `codemirror@6.0.2`、`@codemirror/state@6.7.6`、`@codemirror/lang-javascript@6.2.5`，MIT。CodeMirror 6 用 `EditorState` 描述文档，用 `EditorView` 画到 DOM。适合嵌入式源码、配置和 Markdown 原文。只读着色用 E09。完整语言服务用 E05。富文本用 E01 或 E03。

## Lab 当前示例

真实组件是 [`examples/example.tsx`](examples/example.tsx)。[`examples/demo.tsx`](examples/demo.tsx) 只再导出。草稿边界在 [`examples/draft-policy.mjs`](examples/draft-policy.mjs)：`assertDraftText` 拒绝非字符串、超过 50_000 个 UTF-16 码元、以及含 NUL 的文本。它不执行 TypeScript。

用户点开 Demo 后，effect 才 `new EditorView`。依赖是 `level`，换层会 `destroy` 再创建。不要到 `localhost:5173` 或 `src/App.tsx` 找这个文件。

挂载的内容：

- `basicSetup`、`javascript({ typescript: true })`、`tabSize` 2、一个 `Compartment` 包着 `EditorState.readOnly`。
- `EditorView.updateListener` 只在 `docChanged` 时更新长度。
- 容器高度 260px。主题是示例自己的，不是产品皮肤。
- business：创建前尝试读 `reactloom:library-lab:E04:config-draft:v1`。坏草稿或超限被忽略，加载默认文档，并在文案里说明。保存和恢复都是按钮，失败时当前文档保持不变。
- advanced：复选框通过 `compartment.reconfigure(EditorState.readOnly.of(...))` 切换只读，不新建 View。
- 清理函数把 `viewRef` 清空并 `view.destroy()`。

没有挂载：语言 Worker、诊断面板、多标签文档模型、自动保存 debounce、把内容 POST 到服务器、CSP 实验页。

## 1. 选型

| 任务 | 选择 |
| --- | --- |
| 配置、脚本、Markdown 源码，要光标和撤销 | CodeMirror 6 |
| 补全、跨文件诊断、接近 IDE | E05，并单独管理 Worker |
| 文章里的只读代码块 | E09 |
| 富文本 | E01 / E02 / E03 |
| 单行输入 | 原生 input |

预览 Markdown 时，编辑器拥有源码，E06 拥有安全渲染。不要两套同时改同一块 DOM。

## 2. 对象模型

```text
React effect（level 变化才运行）
        │
        ▼
EditorState.create({ doc, extensions })
        │
        ▼
new EditorView({ state, parent })
        ├─ updateListener → 长度
        ├─ Compartment.reconfigure → 只读
        └─ destroy() 在 effect 清理
```

State 不可变。改文档用 `view.dispatch({ changes })`，不要改 `state.doc` 的内部结构，也不要在每次 React 渲染时 `new EditorView`。

| 对象 | Lab 里谁拥有 |
| --- | --- |
| `EditorState` | 这一次 View |
| `EditorView` | effect，卸载时 destroy |
| `Compartment` | `useRef`，活过只读切换 |
| 草稿字符串 | 按钮 + `assertDraftText` |
| React `length` | 给页面看的副本，不是权威文档 |

权威文本是 `view.state.doc`。重置用 `dispatch` 替换全文再 `focus()`，不卸载组件。

## 3. 三层

### 基本

默认是一段 `const greeting`。输入或粘贴后长度变化。视图在文档变化时不被重建。点运行前不应加载编辑器包；宿主点击之后才挂载。

### 业务

默认是一份 `settings` 对象文本。保存把 `assertDraftText` 的结果写入 sessionStorage。恢复失败时文案带上错误，文档不改。这是本标签页草稿，不是项目的配置服务。

### 进阶

默认函数草稿，外加只读复选框。只读走 Compartment。中文输入法、软键盘、辅助技术没有在本条目里验收。

## 4. 反例（带代码）

### 反例 1：每次按键新建 View

```tsx
return <EditorView parent={el} state={EditorState.create({ doc: text })} />
```

选区会丢，DOM 主机上会叠多个视图。Lab 只在 effect 里创建一次，按键只 `dispatch`。

### 反例 2：用 React state 当受控 value

```tsx
onChange={value => setText(value)}
useEffect(() => view.dispatch({ changes: { from: 0, to: len, insert: text } }), [text])
```

输入法组合期间整篇替换会吞候选。React 只存长度。文档留在 View 里。

### 反例 3：切换只读时 destroy 再 new

```tsx
useEffect(() => { const v = new EditorView(...); return () => v.destroy() }, [readOnly])
```

滚动位置和撤销历史会没。用 `Compartment.reconfigure`。

### 反例 4：不 destroy

离开页签后监听还在，下一次挂载又往同一 parent 加一个 View。清理函数必须 `view.destroy()`，并且只清自己放进 ref 的那一个实例。

### 反例 5：恢复时不检查边界

```ts
view.dispatch({ changes: { from: 0, to: len, insert: sessionStorage.getItem(KEY) } })
```

`getItem` 可能是超长字符串或含 NUL。先 `assertDraftText`。异常时不要改文档。Lab 在创建 business 视图时也忽略坏草稿，避免毒化初始 State。

### 反例 6：把编辑器内容 eval

```ts
eval(view.state.doc.toString())
```

不可信文本不要执行，也不要在 `updateListener` 里自动上传。保存若要提交，走你们的 API，并可以取消。

### 反例 7：语言包和状态版本拆开升

`codemirror@6.0.2` 是集成包。`@codemirror/state` 在条目里是 6.7.6，语言包是 6.2.5。不要从旧教程复制不匹配的 `EditorState` API。只读示例见官方 [readonly](https://codemirror.net/examples/readonly/)。

### 反例 8：用 Node 策略测试代替视图已销毁

`assertDraftText` 不创建 EditorView。浏览器里要看离开 Demo 后 parent 里没有残留 `.cm-editor`。

## 5. 输入法、粘贴、可访问性

不要在 `compositionupdate` 里整篇 `dispatch`。粘贴大段文本仍应是一次 transaction，而不是按字符 setState。容器需要非零高度，否则滚动和命中都不可用。只读模式仍应能选择和复制，除非产品明确禁止。

本示例没有单独的 aria 实时播报文档内容。状态文案在 `<p role="status">`。真正的读屏验收未做。

## 6. 扩展与调试

新能力用 `Extension` 和 `Compartment`，不要改库文件。主题用 `EditorView.theme`，避免全局 CSS 误伤 `.cm-content`。调试时看 transaction 的 `docChanged` 和 `selectionSet`，不要假设每次 update 都改了文档。Lab 的监听已经区分了这一点。

Worker 语言服务是另一条 CSP：`worker-src` 要允许脚本。本示例的 JavaScript 高亮在主线程语法包里，没有启动 Worker。不要把「没有 Worker 报错」说成 CSP 已通过。

## 7. 组合（未挂载）

**E06。** CodeMirror 编辑 Markdown 源码，react-markdown 在另一块预览里渲染，并自带净化。预览不要把编辑器 DOM 挪走。

**E05。** 需要诊断和补全时换 Monaco，并接受 Worker 租约。不要两个编辑器包住同一 parent。

**TanStack Query。** 打开文件时创建 View，保存按钮读 `doc.toString()`。过期响应不能 `dispatch` 覆盖未保存的修改。

## 8. 升级核对

对照 [更新日志](https://codemirror.net/docs/changelog/) 和 [指南](https://codemirror.net/docs/guide/)：

- 状态、视图、语言包装版本一起看，不单升一个包。
- `Compartment` 仍是运行时切换扩展的方式。
- 从 CodeMirror 5 迁来时，没有 `fromTextArea` 这一条老路径。本示例直接把 View 挂到 div。
- `basicSetup` 含历史、搜索和快捷键。产品若要删减，显式列扩展，不要假设 setup 永远不变。

## 9. 练习与验收

1. basic：输入后长度变，撤销可用，视图节点只有一个。
2. business：保存、恢复、写入超长字符串后恢复失败且原文还在。
3. advanced：只读后不能输入，取消只读后撤销栈还在（因为没有销毁 View）。
4. 换层后旧 View 已 destroy。
5. 中文输入法组合期间文档不被 React effect 整篇替换。

sdk、build、browser 保持 **NOT_RUN**。没有 `docs/library-lab/evidence/runs/` 的 E04 收据就不能写 PASS。Actions `41779873259` 是仓库级运行，不是本条目通过。

## 10. 资料

- https://codemirror.net/docs/guide/
- https://codemirror.net/docs/ref/
- https://codemirror.net/examples/readonly/
- https://codemirror.net/docs/changelog/
- https://www.npmjs.com/package/codemirror
