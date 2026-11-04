# Tiptap 3.32.0｜Headless 富文本：Schema、事务和 JSON 草稿

`@tiptap/react`、`@tiptap/pm`、`@tiptap/starter-kit` 在 `library.json` 里都钉在 **3.32.0**，许可 MIT。Tiptap 是建在 ProseMirror 上的 Headless 编辑器：它管 Schema、事务、命令、撤销和扩展。工具栏皮肤、权限、上传和云端保存仍由产品设计。核心开源不等于 Tiptap Platform 的协作、AI 或版本服务已经授权。

一行备注用原生 textarea。想要现成的 Notion 块界面先看 E02。编辑器状态要自己拆命令时看 E03。代码用 E04 或 E05。只读展示用 E06 / E09。

## Lab 当前示例

真实组件是 [`examples/example.tsx`](examples/example.tsx)。[`examples/demo.tsx`](examples/demo.tsx) 只做 `export { default } from './example'`。恢复边界在 [`examples/snapshot-policy.mjs`](examples/snapshot-policy.mjs)，和 React 恢复按钮共用。Lab 宿主在用户点开 Demo 之后才挂载这一层；离开页签时组件卸载。

三层都走同一个 `TiptapSession`，用 `key={level}` 拆掉旧编辑器再创建，撤销栈和统计不会串层。

| 层 | 页面上有什么 | 没有挂上的生产教学 |
| --- | --- | --- |
| basic | `useEditor` + StarterKit、`immediatelyRender: false`、加粗 / 斜体 / 列表 / 撤销、`EditorContent`、字符数 | `useEditorState`、浮动菜单、自动保存 |
| business | 同上，外加按钮把 `editor.getJSON()` 写入本标签页 `sessionStorage` | 650ms debounce、schemaVersion 信封、后端 ETag |
| advanced | 截断的 JSON 预览、重置当前示例正文 | 异步文章切换、AbortSignal、链接按钮 |

挂载细节：

- 初始 HTML 只是创建时的 `content`。之后正文权威在编辑器里，不把每次按键同步成整页 React state。
- `editor.on('update')` 只更新字符数；effect 清理调用同一个 `editor.off('update', update)`。`useEditor` 负责销毁实例，示例不再手动 `destroy` 第二次。
- 保存键是 `reactloom.lab.E01.tiptap.draft.v1`。超过 `MAX_SNAPSHOT`（20_000）拒绝写入。
- 恢复先走 `parseTiptapSnapshot`：根节点必须是 `doc`，节点种类限于当前 StarterKit 文本集合，深度 12、访问节点不超过 500，拒绝 `__proto__` / `src` / `style` / `on*`。`href` 只接受无用户名密码的 `https:`。通过后再 `setContent(parsed, { errorOnInvalidContent: true })`。失败时不清空当前文档。
- JSON 预览放在 `<pre>` 文本节点里，不把 `getHTML()` 送进另一个宿主。

下面几节里的 debounce、`shouldRerenderOnTransaction`、Uppy、Yjs、React Hook Form 是生产教学，**当前示例没有挂载**。

## 1. 什么时候用

| 需求 | 判断 |
| --- | --- |
| 评论、知识库正文、后台文章，要自己的视觉 | 适合。先用 StarterKit，再加扩展 |
| 自定义节点、粘贴规则、以后要协作扩展 | 适合，但要预算 Schema 和事务 |
| 一行标题或纯文本备注 | 通常用原生控件 |
| 直接要斜杠菜单、拖拽块、现成工具栏 | 先比较 E02 |
| 产品核心是代码、JSON、SQL | E04 / E05 |
| 只要只读 Markdown | E06，不要为了展示加载编辑器 |

不能用 Star 数代替输入法、移动端和 Schema 迁移的验收。

## 2. 版本与 v3 表面

三个包必须同一主版本。不要把 v2 教程和 v3 调用混在一个文件里。官方安装要求这三个包一起出现：[React 安装](https://tiptap.dev/docs/editor/getting-started/install/react)。

Lab 已经按 v3 写了这些调用：

- `useEditor({ extensions: [StarterKit], content, immediatelyRender: false })`
- `editor.chain().focus().toggleBold().run()`，不用 `document.execCommand`
- `setContent(json, { errorOnInvalidContent: true })`，选项是对象

生产里还要单独核对、但本示例没有打开的点：

- StarterKit v3 默认带 Link、Underline、ListKeymap。不要再注册同名扩展。[StarterKit](https://tiptap.dev/docs/editor/extensions/functionality/starterkit)
- `setContent` 的第二参是选项对象。v3 默认 `emitUpdate: true`。切换整篇文档时若不想触发保存，要显式 `emitUpdate: false`。[setContent](https://tiptap.dev/docs/editor/api/commands/content/set-content)
- `BubbleMenu` / `FloatingMenu` 的 React 入口在 `@tiptap/react/menus`。旧的 `tippyOptions` 不能照搬。[v2 升级](https://tiptap.dev/docs/guides/upgrade-tiptap-v2)
- 大工具栏可用 `shouldRerenderOnTransaction: false` 加 `useEditorState`，只订阅 `isActive('bold')` 这类字段。[性能](https://tiptap.dev/docs/guides/performance)
- 还有 Composable `Tiptap` API。本示例选择 Hook，是为了生命周期好追踪，不是说另一种 API 错误。

许可边界：编辑器核心 MIT。平台上的云文档、托管协作、部分 Pro 扩展是另一套合同。见 [功能对比](https://tiptap.dev/feature-comparison) 和 [开源与平台](https://tiptap.dev/open-source-to-platform)。

## 3. 工作模型

文档不是 HTML 字符串。Schema 约束节点（`doc`、`paragraph`、`heading`、列表）和 mark（`bold`、`italic`、`link`）。State 里有文档、选区和插件状态。一次编辑是 Transaction。EditorView 负责 DOM 和输入。Tiptap 的 `Editor` 把这些包成命令、扩展和 React 适配。

```text
键盘 / 中文输入法 / 粘贴
        │
        ▼
ProseMirror EditorView → Transaction
        │
        ▼
EditorState + Schema + StarterKit
        ├─ DOM 更新（不要用 React value 逐键覆盖）
        ├─ 工具栏读 isActive / can()（本示例未订阅，按钮不显示按下态）
        └─ update → 本示例只记字符数
                 生产才 debounce → getJSON() → 你们的 API
```

三条后果：

1. 编辑器是有内部状态的命令式对象，不是 `<textarea value onChange>`。
2. 正文每次击键不必重渲染侧栏。本示例只把纯文本长度放进 state。
3. 「切换整篇文档」和「正在输入」不是同一件事。前者才 `setContent`。把每次 `getJSON()` 再灌回 `setContent` 会打乱选区、撤销和输入法。

模型入口：[Editor](https://tiptap.dev/docs/editor/api/editor)、[Schema](https://tiptap.dev/docs/editor/core-concepts/schema)、[Events](https://tiptap.dev/docs/editor/api/events)、[持久化](https://tiptap.dev/docs/editor/core-concepts/persistence)。

## 4. 三层怎么看

在 Library Lab 里选 E01，点运行后再切换 basic / business / advanced。不要到独立的 `localhost:5173` 或 `src/App.tsx` 里找这个示例。

### 基本：可编辑正文

选中文字，点加粗、斜体、列表、撤销。预期是 ProseMirror 文档变了，而不是父组件改 `innerHTML`。按钮在 `editor` 仍为 null 时禁用。命令链先 `focus()`，避免点按钮丢掉选区。

```tsx
const editor = useEditor({
  extensions: [StarterKit],
  content: START,
  immediatelyRender: false,
})
return <EditorContent editor={editor} />
```

这段就是 Lab 的最小边界。它没有 `aria-pressed` 与选区同步；那是 `useEditorState` 的生产做法，没有挂在本文件里。

### 业务：本标签页 JSON

点「保存草稿」才 `JSON.stringify(editor.getJSON())`。超限或 `sessionStorage` 抛错时只改状态文案，不假装已经持久化。点「恢复草稿」走白名单，再交给 SDK。生产应再加上 `schemaVersion`、文档 id、服务端校验和版本冲突。本示例没有这些字段，sessionStorage 也不是跨设备存储。

### 进阶：导出与重置

「查看 JSON 结构」把格式化 JSON 截到 2400 字符放进 `<pre>`。更长的真实输出不上传。「重置示例」只对当前编辑器 `setContent(START)`。损坏草稿失败时文案写明当前文档未被主动清空。

中文输入法、组合输入期间工具栏是否吞候选、列表回车后的节点，都要在真实浏览器里看。这里没有把 IME 标成已通过。

## 5. 反例（带代码）

### 反例 1：每次 render 把正文写回去

```tsx
useEffect(() => {
  editor?.commands.setContent(serverDoc)
}, [serverDoc, editor])
```

选区、撤销和输入法会被打断。只在切换文档、用户确认采用服务端版本、或本示例的重置按钮时设置内容。回填若不应触发保存，选项里写 `emitUpdate: false`。

### 反例 2：把 getHTML() 当成可信 HTML

```tsx
<div dangerouslySetInnerHTML={{ __html: remoteHTML }} />
```

Schema 限制了可编辑结构，不等于导出的 HTML 可以进另一个宿主。本示例把 JSON 当文本展示。发布页若必须出 HTML，在独立边界做允许列表（E08 或 E10），并再查 URL。

### 反例 3：每个字母塞进全局 state

```tsx
onUpdate: ({ editor }) => setGlobalDocument(editor.getJSON())
```

长文会拖着侧栏一起渲染。编辑器自己留着文档；React 只拿字符数或节流后的草稿。本示例连自动保存都没有，只有按钮。

### 反例 4：订阅了 update 却不解除

```ts
editor.on('update', handler)
```

在 effect 里绑定，清理函数调用 `editor.off('update', handler)`，函数身份要相同。不要再和 `useEditor` 抢着 `destroy`。

### 反例 5：v2 位置参数和重复扩展

```ts
editor.commands.setContent(doc, false)
```

v3 写成 `setContent(doc, { emitUpdate: false })`。不要在 StarterKit 之外再注册一份 Link / Underline。

### 反例 6：链接不看协议

```ts
editor.chain().focus().setLink({ href: userInput }).run()
```

`javascript:`、带账号密码的 URL、明文 `http:` 都不应进 mark。Lab 的 `parseTiptapSnapshot` 在恢复路径上只收无凭据 `https:`。这不是 StarterKit Link 的 `isAllowedUri`；粘贴链接的运行时策略没有挂上，生产要在扩展和保存接口各做一次。

### 反例 7：把粘贴文件当成已经上传

`FileHandler` 只是粘贴或拖入的钩子，不会把文件送到对象存储。成功拿到稳定 URL 之后再插节点。本示例没有 FileHandler，也没有上传。

### 反例 8：一个 editor 实例跨路由缓存

详情页切换、Strict Mode 重挂载会留下快捷键和观察者。实例属于这次挂载。Lab 用 `key={level}` 换层，而不是把编辑器藏进 `display: none`。

## 6. 性能、SSR、输入法

先用 Profiler 看是不是编辑器外面的树在跟着 transaction 重渲染，再考虑 `shouldRerenderOnTransaction: false`。没有测量数字就不要写「快了百分之多少」。大批量 React NodeView 有挂载成本。

`immediatelyRender: false` 避免服务端和客户端各初始化一次 DOM。阅读页用静态渲染，不要在服务器上跑完整编辑器。[Static Renderer](https://tiptap.dev/docs/editor/api/utilities/static-renderer)。Next.js 把编辑器放在客户端组件里。

组合输入期间不要重建 Editor，不要吞掉全部 `beforeinput`。自定义 keymap 要让出输入法的 Enter / Escape。移动端软键盘和浮动菜单需要真机，本示例没有宣称适配。

localStorage 容量和同步写入都不在本示例里；这里只用 sessionStorage，并且失败可见。多标签页冲突没有解决。

## 7. 组合（未挂载）

**React Hook Form + Zod。** 表单拥有标题和发布选项，Tiptap 拥有正文。提交时再 `getJSON()`。不要每个 transaction `setValue`。校验失败不要 `reset` 掉正文。

**TanStack Query。** Query 拥有加载和 mutation。编辑器拥有未提交草稿。过期响应不能 `setContent` 盖住本地修改。409 给人看对照，而不是静默覆盖。

**Uppy。** 上传队列归 Uppy。编辑器只在授权 URL 返回后插入节点。取消上传不应留下断链。本次没有这个 Demo。

**Yjs / Hocuspocus。** 多人协作是另一条所有权：连接、房间权限、离线合并、光标身份。`model.dispose` 式的编辑器卸载不等于协作会话结束。不要把平台托管协作说成 StarterKit 自带。

## 8. 替代

| 候选 | 何时 |
| --- | --- |
| Tiptap | 要 ProseMirror 结构，UI 自己画 |
| E02 BlockNote | 要现成块交互，接受它的块模型和 Mantine |
| E03 Lexical | 编辑命令和 EditorState 要按 React 插件拆 |
| textarea | 纯文本 |
| E04 / E05 | 代码 |
| E06 | 只读 Markdown |

## 9. 升级核对

从 v2 到 3.32.0 时逐项看 [升级指南](https://tiptap.dev/docs/guides/upgrade-tiptap-v2)：

- `setContent` 第二参改为对象。
- 菜单包路径改为 `@tiptap/react/menus`。
- StarterKit 已包含的扩展不要注册第二次。
- 自定义节点的 `parseHTML` / `renderHTML` 和 JSON 形状一起回归。
- 三个包版本号保持 3.32.0，不要只升 `@tiptap/react`。

业务新增图片、表格或自定义 mark 时，必须同时改 `snapshot-policy.mjs` 的白名单和负例。现在的策略只覆盖这份文本 StarterKit，不能原样放到带媒体的产品上。

## 10. 故障清单

- SSR hydration 警告：确认 `immediatelyRender: false`，阅读页不要挂编辑器。
- 光标跳回开头：搜索无条件 `setContent` 和每次 render 新建 editor。
- 工具栏不知道当前是否加粗：本示例本来就没有订阅；生产用 `useEditorState`。
- 粘贴丢样式：Schema 里没有的节点不会留下。导入策略单独做。
- 恢复失败：先看是超限、未知节点，还是 `errorOnInvalidContent`。不要在 catch 里清空正文。
- 包体积：用分析器看 StarterKit 里用不到的扩展，不要凭扩展个数估算。

## 11. 验收

动手看这些，不要把文档写成已经通过：

1. basic：选区加粗、撤销，字符数跟着变。点运行之前网络里不应出现编辑器 chunk。
2. business：保存后只在本标签页恢复；超长 JSON 被拒绝；坏 JSON 留下原文档。
3. advanced：预览是文本；重置不删 sessionStorage 里另一层的键（键是共享的，重置按钮本身不调用 `removeItem`）。
4. 换层后旧的 update 监听不再 `setState`。
5. 中文输入法组合期间正文不被 effect 重写。此项没有浏览器收据。

`tests/policy.test.mjs` 只检查 `parseTiptapSnapshot`。它不加载 Tiptap，不能代替 SDK。

sdk、build、browser 保持 **NOT_RUN**。没有 `docs/library-lab/evidence/runs/` 里对 E01 的收据，就不能写 PASS。Actions `41779873259` 是仓库级运行，不是本条目的编辑器验收。

## 12. 练习（生产，未挂载）

1. 把按钮保存换成带 `AbortSignal` 的 API。后到的旧请求不能覆盖新文档。409 不得自动 `setContent`。
2. 做一个引用 mark，只接受已确认的 `sourceId`，并给粘贴、撤销、未知版本各留一条负例。

## 13. 资料

- https://tiptap.dev/docs/editor/getting-started/install/react
- https://tiptap.dev/docs/editor/api/editor
- https://tiptap.dev/docs/editor/api/commands
- https://tiptap.dev/docs/editor/extensions/functionality/starterkit
- https://tiptap.dev/docs/editor/api/commands/content/set-content
- https://tiptap.dev/docs/guides/upgrade-tiptap-v2
- https://tiptap.dev/docs/guides/performance
- https://tiptap.dev/docs/editor/core-concepts/schema
- https://tiptap.dev/docs/editor/core-concepts/persistence
- https://tiptap.dev/docs/editor/api/events
- https://tiptap.dev/docs/editor/extensions/marks/link
- https://tiptap.dev/docs/editor/extensions/functionality/filehandler
- https://tiptap.dev/open-source-to-platform
- https://www.npmjs.com/package/@tiptap/react
