# BlockNote 0.56.0｜块文档、Mantine 视图和未验证的 peer

BlockNote 在 ProseMirror / Tiptap 之上提供块、斜杠菜单和现成视图。适合接近 Notion 的文章和知识库草稿。它不适合一行纯文本、代码 IDE、只读排版，也不适合拿 Markdown 当无损存储。

## Lab 当前示例

真实组件是 [`examples/example.tsx`](examples/example.tsx)。[`examples/demo.tsx`](examples/demo.tsx) 只再导出。块快照守卫在 [`examples/snapshot-policy.mjs`](examples/snapshot-policy.mjs)。用户点开 Demo 之后才挂载；`key={level}` 在换层时拆掉旧实例。

`library.json` 的包钉是：

| 包 | library.json |
| --- | --- |
| `@blocknote/core` | 0.56.0 |
| `@blocknote/react` | 0.56.0 |
| `@blocknote/mantine` | 0.56.0 |
| `@mantine/core` | `null` |
| `@mantine/hooks` | `null` |
| `@mantine/utils` | `null` |

条目元数据没有给出已解析的 Mantine 版本。Lab 的 `packages/library-lab/package.json` 另行声明 `@mantine/core@9.7.3`、`@mantine/hooks@9.7.3`、`@mantine/utils@6.0.22`。utils 6 和 core 9 是主版本错位。**不要把这个编辑器写成已验证。** sdk、build、browser 都还没有本条目收据。

页面实际做的事：

- `useCreateBlockNote({ initialContent })` 创建标题和段落。`initialContent` 只在创建时生效。
- `<BlockNoteView editor={editor} />`，并引入 `@blocknote/mantine/style.css` 与 `@blocknote/core/fonts/inter.css`。这些样式可能影响宿主，不是只作用在边框 div 里。
- `editor.onChange` 的返回值在 effect 清理时调用，用来更新顶层块数。
- business / advanced：按钮把 `editor.document` 写入 `reactloom.lab.E02.blocknote.blocks.v1`。上限 `MAX_SNAPSHOT` 60_000。恢复调用 `parseBlockSnapshot` 再 `replaceBlocks`。
- advanced：`insertBlocks` 在最后一块后面追加一段；另一按钮 `removeItem` 清本例草稿。

`parseBlockSnapshot` 只接受段落、标题、列表项、待办、折叠列表、引用、代码块。最多 100 个块、深度 8。拒绝图片、文件、视频。丢掉持久化的块 `id`，让新实例自己分配。`href` / `url` / `src` 只留无凭据 `https:`。这不是完整 BlockNote schema，也不是 HTML 净化器。`sessionStorage.getItem` 包在 try/catch 里。`replaceBlocks` 抛错时，指南不假设事务已经回滚。

没有挂载的生产教学：550ms 防抖、两篇文章的独立键、Markdown 导入按钮、`uploadFile`、Yjs、`dynamic(..., { ssr: false })`。

## 1. 什么时候用

| 任务 | 选择 |
| --- | --- |
| 斜杠菜单、拖拽、块嵌套、现成工具栏 | BlockNote，并接受 Mantine 与升级成本 |
| 完全自己画工具栏和节点 | E01 |
| 从命令和 EditorState 搭建 | E03 |
| 代码或 diff | E04 / E05 |
| 只读文章 | 渲染器，不要挂可编辑运行时 |

应用的事实源应是 BlockNote JSON。Markdown 只做导入导出，而且 `blocksToMarkdownLossy` 会丢自定义属性。不要用 `contentEditable` 从零仿一套块编辑器。

## 2. 许可与 0.56 行为

核心是 **MPL-2.0**。改过的 MPL 文件再分发时有文件级义务，以仓库许可证为准。`@blocknote/xl-*` 是 GPL-3.0 或商业许可，本示例没有引入，也不要把 XL 说成 MPL 已经覆盖。发布说明见 [v0.56.0](https://github.com/TypeCellOS/BlockNote/releases/tag/v0.56.0)，定价边界见 [pricing](https://www.blocknotejs.org/pricing)。

0.55 教程不能原样套 0.56.0：

- 侧栏 hover 范围变了，布局有外边距时看 `sideMenu.hoverMargin`。
- `blockTypeSelectItems` 改为接收 `editor`。
- `Mod+A` 默认先选当前块，再按一次选全文。旧行为要设 `selectAllBehavior: "document"`。
- 内置扩展和 `UniqueID` 改从 `@blocknote/core/extensions` 引入。
- 版本历史组件改到 `@blocknote/react/versioning`。
- `experimental_keyboard` 和布局块仍是预览，不要写进稳定契约。
- 嵌套块 Backspace 和无语言代码块的默认语言有行为变化，要单独回归。

React 只在浏览器里创建编辑器。Next.js 用客户端组件，并 `dynamic(..., { ssr: false })`，避免在服务器碰 `window`。[Next.js 说明](https://www.blocknotejs.org/docs/getting-started/nextjs)。

官方移动工具栏会跟键盘走，并建议 viewport 使用 `interactive-widget=resizes-content`。iOS 行为不同。本示例没有做这项验收。

## 3. 数据模型

顶层是 `Block`：`id`、`type`、`props`、`content`、`children`。权威状态是 `editor.document`，不是 DOM，也不是 Markdown。

```tsx
const editor = useCreateBlockNote({
  initialContent: [
    { type: 'heading', props: { level: 2 }, content: '阅读笔记' },
    { type: 'paragraph', content: '在这里编辑本地块文档。' },
  ],
})
return <BlockNoteView editor={editor} />
```

| API | 作用 | 边界 |
| --- | --- | --- |
| `useCreateBlockNote(options, deps)` | 创建并缓存实例 | deps 不能绑在每个字符上 |
| `BlockNoteView` | 渲染 | 不要把 `editor.document` 再当受控 value 灌回去 |
| `editor.document` | 当前块数组 | 延迟任务里存序列化快照，不存可变引用 |
| `editor.onChange` | 订阅 | 返回 unsubscribe |
| `editor.replaceBlocks` | 事务替换 | 失败时不要假设已回滚 |
| `editor.insertBlocks` | 在参照块旁插入 | Lab advanced 用最后一块当参照 |
| `tryParseMarkdownToBlocks` / `blocksToMarkdownLossy` | 有损交换 | 不能当唯一存储 |
| `tryParseHTMLToBlocks` / `blocksToFullHTML` | HTML 交换 | 导出 HTML 仍要净化 |
| `uploadFile` | 上传委托 | 本示例没有实现 |

```tsx
useEffect(() => {
  return editor.onChange(() => setCount(editor.document.length))
}, [editor])
```

换文章不能只改 `initialContent`。用 `key={documentId}` 重建，或显式 `replaceBlocks`。Lab 的 key 是 level，不是两篇业务文章。

## 4. 三层

在 Library Lab 打开 E02 再点运行。没有独立的 `src/Basic.tsx` 或 `localhost:5173`。

### 基本

编辑标题和段落，试斜杠菜单。示例故意不做受控 `value`。这一层不写 sessionStorage。预期是块结构在编辑器内部变化。

### 业务

保存和恢复只针对当前标签页的一份草稿。解析失败或超限时给出文案，不把无法识别的数据覆盖成空文档。这不是跨设备同步。生产还要身份、ETag、冲突和审计。Abort 只说明客户端不再等待，不能证明服务器没写入。

### 进阶

「插入审核段落块」调用真实 `insertBlocks`。顶层块数应增加。「清除本例草稿」只 `removeItem` 那个键。变更订阅在离开时解除。

教学验收可以做，但没有浏览器收据就不能写通过：输入 `/`、保存再恢复、中文选词时整篇不被重建、窗口变窄时按钮换行。软键盘要真机。

## 5. 反例（带代码）

### 反例 1：每个字符 setState 再当 value

```tsx
editor.onChange(() => setBlocks(editor.document))
return <BlockNoteView editor={editor} />
// 再在 effect 里 replaceBlocks(blocks)
```

光标会跳。视图保持非受控。只在按钮或防抖快照里序列化。

### 反例 2：用有损 Markdown 当唯一存储

```ts
const saved = await editor.blocksToMarkdownLossy(editor.document)
```

嵌套和自定义 props 会丢。事实源用块 JSON。Markdown 放在只读文本框里，不要 `dangerouslySetInnerHTML`。

### 反例 3：只改 initialContent

```tsx
useCreateBlockNote({ initialContent: articles[id] })
```

旧文章会留在已经创建的实例里。按文档 id 做 key，卸载前 flush。

### 反例 4：输入过程中整篇 replaceBlocks

导入 Markdown 或 HTML 必须是明确按钮，并且组合输入（`compositionstart` 到 `compositionend`）期间不要替换。Lab 没有这个导入按钮。

### 反例 5：onChange 不退订

Strict Mode 下监听会叠两份。使用返回的 unsubscribe。Lab 已经这么写。

### 反例 6：把 base64 当上传成功

```ts
uploadFile: async (file) => `data:${file.type};base64,${btoa(await file.text())}`
```

内存膨胀，也没有鉴权。真正上传走自己的 API、大小和 MIME 限制、可撤销的 URL。本示例不上传。

### 反例 7：导出 HTML 直接展示

```tsx
<div dangerouslySetInnerHTML={{ __html: await editor.blocksToFullHTML(editor.document) }} />
```

编辑过不等于可信。公开页用 E10 或 E08，并加 CSP。

### 反例 8：并发保存不带文档版本

后完成的旧请求会盖住新稿。每篇文档自己的队列，服务端 `If-Match`。本示例只有本地按钮，没有这条队列。

另外：存储被禁用时必须把异常显示出来，Lab 的 save/restore 已包 try/catch。超长文档的耗时要用真实硬件量，不要套不存在的毫秒数。

## 6. 安全、无障碍、样式

`parseBlockSnapshot` 不递归证明每一种自定义块合法。产品要用版本化 schema、深度和字段上限。不要允许任意脚本 URL。

Mantine 样式和 Inter 字体是全局 CSS。和 MUI、Ant Design 同页时要看层叠，必要时独立 frame。已有 Mantine 基础样式时，按文档区分 `style.css` 和 `blocknoteStyles.css`，避免导入两次基础样式。[Mantine UI](https://www.blocknotejs.org/docs/getting-started/mantine)。

`prefers-reduced-motion` 只能约束你们自己的 CSS，不能证明 BlockNote 内部动画都服从系统设置。

无障碍要看键盘、焦点回到触发器、工具栏 portal。axe 只能发现一部分。0.56 改过部分块和工具栏的可访问行为，升级要回归。

## 7. 组合（未挂载）

**TanStack Query + Zod。** BlockNote 拥有正在编辑的块。Query 拥有服务器副本和取消。Zod 校验信封。`queryKey` 含文章 id。保存带 `If-Match`。冲突时对照，不默认覆盖。不要三个 store 互相写。

**Yjs + Hocuspocus。** CRDT 合并操作，不提供权限。服务端仍要校验房间和身份。评论、历史、XL 许可分开验收。

还可以把上传交给 Uppy，把公开 HTML 交给 DOMPurify，把只读 Markdown 交给 react-markdown。有损导出不能再写回权威 JSON。

## 8. 故障

| 现象 | 先看 |
| --- | --- |
| 刷新后变空 | 键、schema、存储是否抛错。失败原因要可见，不要覆盖认不出的旧数据 |
| 换文章内容不变 | `initialContent` 只初始化一次。用 key 重建 |
| 中文输入光标跳 | onChange 里是否整篇替换 |
| 斜杠菜单被裁切 | overflow、portal、滚动容器 |
| 找不到 CSS | 子路径和三包版本是否一致 |
| SSR 报 window | 客户端专用加载 |
| HTML 往返丢结构 | 有损转换。保留 JSON |
| 图片预览失败 | `uploadFile` 的 URL、CSP、`resolveFileUrl`。本示例没有图片块 |

## 9. 练习（未挂载）

1. 旧 Markdown 留只读副本，BlockNote JSON 成为新事实源。记录标题、链接、嵌套列表的损失。
2. 从 Tiptap JSON 迁移时做映射表。两种 JSON 不能互相当同一格式。
3. 用迟到响应和 HTTP 409 做演练。500 块的耗时必须实测，不写虚构毫秒。

## 10. 验收

不要把编辑器标成已验证。Mantine utils 6 与 core 9 的错位还在，`library.json` 里这三个 peer 仍是 `null`。

在有浏览器之前，只能把下面当成待查清单：初始块能编辑、斜杠菜单能开、保存恢复、坏 JSON 不覆盖、换层后监听解除、样式是否漏到 Lab 外壳。Node 策略测试不加载 BlockNote。

sdk、build、browser 保持 **NOT_RUN**。没有 `docs/library-lab/evidence/runs/` 的 E02 收据就不能写 PASS。Actions `41779873259` 是仓库级运行，不是本条目的编辑器通过。

## 11. 资料

- https://www.blocknotejs.org/docs
- https://www.blocknotejs.org/docs/getting-started
- https://www.blocknotejs.org/docs/react/overview
- https://www.blocknotejs.org/docs/reference/editor/events
- https://www.blocknotejs.org/docs/getting-started/editor-setup
- https://www.blocknotejs.org/docs/getting-started/mantine
- https://www.blocknotejs.org/docs/getting-started/nextjs
- https://www.blocknotejs.org/docs/foundations/supported-formats
- https://github.com/TypeCellOS/BlockNote/releases/tag/v0.56.0
- https://github.com/TypeCellOS/BlockNote
- https://www.blocknotejs.org/pricing
- https://www.npmjs.com/package/@blocknote/core
