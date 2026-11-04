# A10 tldraw 5.5.2：Editor、文档快照和许可证边界

tldraw 是可编程的无限画布 SDK：形状、相机、撤销和 Store。它不是 MIT 组件。生产部署需要符合其许可证的 key。演示可以在本机 localhost 使用开发许可；不要伪造 key、不要去掉水印、不要用脚本改写「是否生产环境」的判断。

Library Lab 钉 `tldraw@5.5.2`。包名是 `tldraw`，不是旧的 `@tldraw/tldraw` 默认入口。Excalidraw 更适合手绘草图且嵌入包为 MIT；React Flow 适合端口约束；G6 适合关系布局；Mermaid 适合可 diff 文本。不要因为 UI 完整就拿 tldraw 画几千条关系边。

## Lab 当前示例

`examples/demo.tsx` 导出 `examples/example.tsx`。体积检查在 `examples/snapshot-policy.ts`。样式导入 `tldraw/tldraw.css` 和本地 `examples/styles.css`。

已挂载：

- 只有 localhost、127.0.0.1、::1，或存在 `VITE_TLDRAW_LICENSE_KEY` 时才渲染 `<Tldraw>`。其它主机显示说明，不挂画布。`licenseKey` 原样传入，没有占位假 key。
- `autoFocus={false}`。**没有** `persistenceKey`，因此不会把文档写进跨条目、跨标签的 IndexedDB。
- `onMount` 拿到 `Editor`。非 basic 会在挂载时 `createFlow`：四个 `geo` 矩形（RSS 获取、正文清洗、分类摘要、人工审核），文字用 `toRichText`，id 用 `createShapeId()`。若宿主切换 `level` 却不重挂载，`onMount` 不会再次执行，骨架只出现在首次挂载；按钮「追加4个流程节点」仍可调用同一函数。
- 程序化新增上限 `MAX_PROGRAMMATIC_SHAPES = 80`。手绘工具不受这个按钮限制。`editor.run` 把一批 `createShape` 收成一个事务。
- `store.listen` 的 scope 是 `document`。只有形状数量变化才 `setCount`，拖动不推动 React 渲染。cleanup 退订。
- 只读调用 `updateInstanceState({ isReadonly })`，并在点击前读 `getIsReadonly()`。这是实例状态，不是服务端 ACL。
- advanced 再批量最多 36 个，且不超过剩余容量，然后 `zoomToFit`。
- 「清空当前形状」只 `deleteShapes` 当前页，不清浏览器或其它 Lab 缓存。
- 下载使用 `getSnapshot(editor.store)` 的 **document** 部分，不含相机和选区。`serializeSnapshot` 拒绝超过 3 MB 的 UTF-8 JSON。Blob URL 约 1.5 秒后 revoke，卸载时清剩余 URL。

没有挂上：`editor.toImage`、`loadSnapshot`、`@tldraw/sync`、HTTP 409、`persistenceKey`、自定义 ShapeUtil、`screenToPage` 演示。研究稿的图片导出仍是生产路径：PNG 按形状边界而不是当前视口，空选择不要假设能出图，跨域资源和字体会失败，URL 必须释放。[image export](https://tldraw.dev/sdk-features/image-export)。

## 数据流

```text
指针 / 键盘 / 富文本
  -> Editor.run / createShape / updateShape
  -> Store（page、shape、binding、asset）
       document：可快照、可同步
       session：相机和选区，按标签页
  -> store.listen({ scope: 'document' })
业务服务拥有文档 id、revision 和权限
```

`Editor` 是命令入口。形状的 `x/y` 是页面坐标。`clientX` 不能直接写入。自定义落点用 `screenToPage` / `pageToScreen`，并处理缩放和平移。v5.5 的 `setCamera` 对非有限数会抛错，导入的相机值先做 `Number.isFinite`。[Editor](https://tldraw.dev/sdk-features/editor) [v5.5](https://tldraw.dev/releases/v5.5.0)。

`store.listen` 不是 DOM click 日志。保存队列用 `{ scope: 'document', source: 'user' }`，避免相机变化和远端补丁被当成用户编辑。Lab 只按数量刷新，连 source 都没筛选到 `'user'`，因为它不做自动保存。

## 三层

### 01 空白画布

工具栏由 SDK 提供。父容器必须有高度，组件自身是 100% 宽高。高度为 0 就是空白。没有本地持久化，刷新即失。

### 02 四个流程节点

`createShape` 的 `type: 'geo'`、`props.geo: 'rectangle'`、固定宽高和颜色。再次点击追加，直到程序化总数将超过 80。`zoomToFit` 把形状带进视口。列表式说明在画布下方用文字写出四步，供读屏使用。

### 03 只读和批量

只读后创建和清空按钮禁用，下载和缩放仍可用。批量按钮受 80 上限。状态文案写明没有做性能基准。3 MB 快照限制在下载前抛错，不会先造一个巨大的 Object URL。

## 反例

```tsx
// 错：render 里创建，StrictMode 会复制形状
function Bad() {
  const editor = useEditor();
  editor.createShape({ type: 'geo', x: 0, y: 0 });
  return null;
}

// 对：按钮或 onMount 里，并用 editor.run 包批量写入
editor.run(() => {
  editor.createShape({ id: createShapeId(), type: 'geo', x: 60, y: 50, props: { geo: 'rectangle', w: 195, h: 96, richText: toRichText('RSS 获取') } });
});
```

| 错误 | 正确 |
|---|---|
| 父容器高度 auto/0 | 稳定高度。Lab 用画布容器类 |
| `useState` 镜像全部形状 | Store 是文档事实；React 只留数量、只读和状态句 |
| `JSON.stringify(editor)` 或共用一个 `persistenceKey` | `getSnapshot` 只取 document；不同文档不同 key。Lab 干脆不用 key |
| 409 时用本地最后一次覆盖 | revision / If-Match，保留两份。Abort 不能撤销已提交的 PUT |
| 把 PNG 当源数据 | JSON 快照另存；限制 pixelRatio。Lab 只下载 JSON |
| 不 revoke Object URL | 定时 revoke，卸载再扫一遍。Lab 已做 |
| 外部 JSON 不校验就 `loadSnapshot` | 大小、来源和 schema。失败回滚。Lab 只限制导出字节 |
| 前端只读就当已授权 | 每个写接口按身份校验 |
| 伪造 license key 或摘掉水印 | 本机预览或合法 `VITE_TLDRAW_LICENSE_KEY` |
| 每个 pointermove `setState` | listen 里比较派生值。Lab 只比较数量 |
| 多页导出却只拿当前页 id | `getCurrentPageShapeIds` 不等于全部页 |

## 生命周期与性能

`onMount` 的返回函数退订。不要在 render 里调 `editor.*`，不要保留已卸载的 Editor。切换文档时用 `key` 重建，并为每个文档准备存储策略。Lab 的单实例没有 boardId。

大量形状用 `editor.run` 一次写入，不要为每个形状挂一个 React 订阅。导出前限制倍率。tldraw 的渲染路径是 DOM、SVG 和 2D，不是 Three 场景；图片解码仍可能吃光内存。没有在本条目测过帧时间。

导入阈值不能只有一个数字。生产按记录数、图片字节和 URL 协议分别限制，并在服务器重做。embed 会加载外网 iframe，内网要收紧允许列表。AI 生成形状只是数据操作，不能因此获得跨租户写权限。

## 无障碍与输入法

画布不能代替列表。Tab、Esc、焦点离开后不抢键，要在浏览器里看。中文拼音的 composition 与富文本撤销需要真机。官方支持不等于本 demo 已测。`autoFocus={false}` 避免进页面就抢走焦点。弹窗里还要处理焦点圈和卸载。`prefers-reduced-motion` 下不要加强制相机动画；Lab 的 `zoomToFit` 没有读取该媒体查询。

## 组合

**tldraw + Mermaid + Zustand。** Store 管手绘，Mermaid 管可 diff 文本，Zustand 只管面板开关和文档 id，不复制形状数组。`@tldraw/mermaid` 要单独核对版本。自由图形不能无损变回 DSL，更不能直接当可执行流程。

**tldraw + TanStack Query + Dexie。** Query 管目录和权限，Dexie 管离线队列，Store 管画布，服务端 CAS 管冲突。不要让 `persistenceKey` 和 Dexie 同时成为权威。多人实时再评估 `@tldraw/sync`，并在服务端做每文档鉴权。Lab 的内存快照不是 CRDT。

## 生产清单

1. 非本机必须有合法 key，否则不挂载。
2. CSS 和容器高度齐全，`autoFocus` 关闭。
3. 演示不设 `persistenceKey`；产品若开启，按文档隔离。
4. 创建形状只在事件或 onMount，批量用 `editor.run`。
5. listen 要退订，且不要在拖动时重渲染宿主。
6. 快照只含 document，并有字节上限。
7. 只读不等于授权。
8. Blob URL 释放。
9. 相机数值有限。
10. 不把水印和许可检查当成可选项。

## 升级与练习

从 `@tldraw/tldraw` 迁到 `tldraw`，删掉「这是 MIT」的归类，加上 key 缺失时的拒绝界面。用 `loadSnapshot` 读一份旧导出，记录 rich text 字段差异，而不是 `as any` 绕过校验。

练习：按 `userId/documentId` 生成 persistenceKey，清空当前 key 时不影响其它文档。侧栏列出 id 和标签，点击后移动相机，卸载退订。两个标签对同一 revision 保存，后者 409，并提供本地下载。这些都还没挂在 Lab 示例里。

## API 速查

| API | 用途 | Lab |
|---|---|---|
| `<Tldraw licenseKey onMount>` | 挂载并取得 Editor | 有 |
| `createShape` / `deleteShapes` | 页面坐标 | 有，受 80 上限的是按钮 |
| `Editor.run` | 一次撤销步 | 有 |
| `store.listen` | 文档变化 | 有，只看数量 |
| `getSnapshot` | document / session | 只下载 document |
| `updateInstanceState({isReadonly})` | 客户端锁 | 有 |
| `zoomToFit` | 视口 | 有 |
| `toImage` | PNG/SVG | 无 |
| `persistenceKey` | IndexedDB | 故意不加 |
| `useEditor` | 子树内 | 外部按钮用 onMount 注入的实例 |

空白：CSS、高度、是否被许可门挡住。刷新丢图：没有 persistenceKey，这是预期。导入报错：schema 与 5.5.2 不符。协作丢写：先分清本地 key、CAS 和 `@tldraw/sync`，三者保证不同。

## 官方链接

- [安装](https://tldraw.dev/installation)
- [Editor](https://tldraw.dev/sdk-features/editor)
- [只读](https://tldraw.dev/sdk-features/readonly)
- [License key](https://tldraw.dev/sdk-features/license-key)
- [持久化](https://tldraw.dev/sdk-features/persistence)
- [导出图片](https://tldraw.dev/sdk-features/image-export)
- [v5.5.0](https://tldraw.dev/releases/v5.5.0)
- [npm tldraw](https://www.npmjs.com/package/tldraw)

## 证据

sdk、build、browser 在 `docs/library-lab/evidence/runs/` 有本条目收据之前为 **NOT_RUN**。`serializeSnapshot` 只证明 JSON 字节上限。Actions run `41779873259` 是仓库级 install、typecheck、build、52 个 SDK 文件（153 个测试）和 45 个 Playwright，不是 A10 的 PASS，不要写入 `verification.json`。研究稿的 HTTP 契约测试也不是本仓库的 SDK 验收。
