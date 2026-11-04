# A09 Excalidraw 0.18.1：场景数据、导入边界和键盘隔离

Excalidraw 是手绘白板：图形、文字、箭头、缩放和撤销。它不执行 DAG，也不做自动布局。强端口约束用 React Flow，关系探索用 G6，可 diff 的流程文本用 Mermaid，自研图元用 Konva，地图用 Leaflet 或 MapLibre。更强调可编程形状时再评估 tldraw，并单独看授权。

Library Lab 钉 `@excalidraw/excalidraw@0.18.1`。不要使用 0.18.0：官方说明该版本的 Mermaid 序列图标签有 XSS 风险，0.18.1 才是修复版。[GHSA-39h7-pwv7-rc3x](https://github.com/advisories/GHSA-39h7-pwv7-rc3x)。npm 上的嵌入包是 MIT。Excalidraw+ 的云协作、账号和共享后端不是这份 MIT 自动附带的。

## Lab 当前示例

`examples/demo.tsx` 导出 `examples/example.tsx`。样式在 `examples/styles.css`，并导入 `@excalidraw/excalidraw/index.css`。导入规则在 `examples/scene-policy.ts`。

已挂载：

- `<Excalidraw langCode="zh-CN" autoFocus={false} handleKeyboardGlobally={false} />`。全局快捷键关掉，避免抢页面按钮和输入法。
- basic 的 `initialData` 是 `undefined`（空画布）。business / advanced 用 `convertToExcalidrawElements` 生成三块矩形（RSS 获取、清洗 / 分类、人工审核）和两支箭头，背景 `#fffdf7`。
- `initialData` **不是受控属性**。`seed` 随 `level` 用 `useMemo` 变化，但若宿主不重挂载组件，切换层级不会自动换场景。恢复要靠按钮里的 `updateScene({ elements: initialWorkflow() })`。
- `excalidrawAPI` 写入 ref。0.17 已去掉 `readyPromise` 和把 API 当 `ref` 的旧写法。
- `onChange` 防抖 160ms，只数未删除元素，避免每个指针事件都重渲染。
- advanced：只读 `viewModeEnabled`、PNG、`.excalidraw`/`.json` 导入。「忽略当前导入或导出」递增 `operationId`，让进行中的 `loadFromBlob` / `exportToBlob` 不能再 `updateScene` 或触发下载。SDK 内部工作可能还在跑。
- PNG 用 `exportToBlob`，带上 `getSceneElements()`、`getFiles()`、`getAppState()`，`maxWidthOrHeight: 2048`，空场景直接拒绝。Blob URL 约 2 秒后 `revoke`，卸载时清掉剩余 URL 和定时器。
- 导入先看扩展名、1.5 MB 上限、最多 200 个元素、链接必须是无用户名密码的 `https:`、拒绝任何二进制附件。通过后才 `updateScene`。失败保持原画布。
- `onLinkOpen` 对不安全链接 `preventDefault`。
- 文案写明数据只在页面内存里。离开或换场景会释放。字体默认仍可能请求官方 CDN；自托管要在加载模块前设置 `window.EXCALIDRAW_ASSET_PATH` 并复制 `dist/prod/fonts`。本示例没有做这一步。

没有挂上：服务端 revision、409、503、`scrollToContent`、协作、把 `appState` 白名单进磁盘。元素上限 200 和 1.5 MB 是教学阈值，不是官方极限，也不是性能数字。

## 对象与坐标

- **elements。** 稳定 id、类型、场景坐标和样式。`isDeleted` 的项仍可能留在数组里，计数时要滤掉。Lab 的导入检查不是完整 schema 校验器。
- **appState。** 工具、选区和面板是瞬时状态。长期保存只留业务真正需要的字段，例如背景色。不要把整份 appState 当文档。
- **files。** 图片常以 data URL 挂在 fileId 上。只存 elements 会丢图。Lab 的教学导入直接拒绝附件，避免在浏览器里接收未审查的二进制。
- **坐标。** `x/y` 是场景坐标，不是 `clientX`。缩放和滚动之后要用官方换算，不能只减容器偏移。
- **更新。** 首次用 `initialData`。之后用 `updateScene` 或换 `key` 重挂载。远程协作要选 `captureUpdate`：`IMMEDIATELY`、`EVENTUALLY` 或 `NEVER`。不要把别人的每次远端变更都推进本地撤销栈。[updateScene](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/props/excalidraw-api)。

```text
initialData 只在挂载时进入编辑器
onChange -> 防抖计数（不写回 initialData）
按钮 -> updateScene / resetScene / exportToBlob / loadFromBlob
operationId 使迟到的异步结果失效
```

## 三层

### 01 空画布

画矩形、文字、撤销，都由官方编辑器完成，不是模拟 SVG。容器在 CSS 里必须有非零高度，库会撑满父盒。高度为 0 时看起来像库坏了。

### 02 流程草图

三块矩形和箭头是骨架，不是可执行的 RSS 任务。箭头不是 React Flow 的合法边。按钮可以重新 `updateScene` 这份骨架。保存到服务器不在本文件里。

### 03 只读、PNG、受限导入

只读只改 `viewModeEnabled`，不是后端授权。PNG 限制 2048。导入拒绝 javascript:、带凭据的 URL、超大文件和图片附件。重置会 `resetScene` 并作废进行中的操作。

研究稿里的双标签 409、PUT `baseRevision`、模拟 503，仍是生产要做的事：编辑器不解决文档冲突。Abort 也不能撤回已经写上的版本。

## 反例

把 onChange 写回 initialData：

```tsx
// 错：每次变更都当成“受控初始值”，触发混乱重挂载
<Excalidraw initialData={{ elements }} onChange={(elements) => setElements(elements)} />

// 对：ref 保存最新快照；外部更换用 updateScene
onChange={(elements) => { latest.current = elements; }}
apiRef.current?.updateScene({ elements: next });
```

| 错误 | 正确 |
|---|---|
| 父级没有高度 | 明确高度，移动端再量溢出 |
| 忘了 `index.css`，或在服务端直接执行 | 客户端导入；Next 用 `ssr: false` 动态加载 |
| 全量持久化 appState | 白名单 |
| 只 `JSON.stringify(elements)` | 需要图片时连同 files；Lab 教学路径则拒绝附件 |
| 用点击坐标当元素 x/y | 场景坐标 API |
| 停留在 0.18.0 | 至少 0.18.1，并继续看安全公告 |
| 每个 pointermove 都 PUT | ref + 手动保存或去抖，带 revision |
| PNG 不限制像素、URL 不释放 | `maxWidthOrHeight`，卸载 revoke。Lab 2048 与 2 秒延迟 |
| 共享 JSON 就当多人协作 | 409 只是文档冲突；实时协作要协议、权限和合并 |
| `handleKeyboardGlobally` 默认开着 | 嵌入页关掉，需要时再聚焦。Lab 已关 |
| `onLinkOpen` 不检查协议 | 只允许无凭据 https。Lab 用 `isSafeSceneLink` |
| 任意 Mermaid 贴进画布 | 转换模块单独审核；0.18.1 修的是特定序列图标签，不是所有 HTML |

## 生命周期

| 阶段 | 做法 |
|---|---|
| 挂载 | CSS、非零高度、初始数据。StrictMode 下请求不能残留 |
| 编辑 | onChange 只写 ref 或防抖派生值，不要在回调里同步 `updateScene` 造成递归 |
| 异步 | `operationId` 加挂载标志。Lab 用它代替 AbortController，因为导入导出没有 fetch |
| 卸载 | 清定时器、revoke URL、丢掉 API ref |

自由画笔点数、图片字节、字体和 DPR 决定内存，不要引用没有测过的 FPS。

## 安全与输入法

0.18.1 不表示可以执行任意 SVG、iframe 或链接。导出的 `.excalidraw` 含原始文本和结构，权限和加密在服务端。CSP 按实际字体和图片来源收紧，不要用 `*` 或无条件 `unsafe-eval`。

中文输入由编辑器处理。宿主不要在 `compositionstart` 到 `compositionend` 之间提交。Lab 没有单独的 DOM 输入框。触控和画布滚动手势要在设备上看。图形列表不能只靠画布：示例用有序列表写出三步 RSS。`prefers-reduced-motion` 管不到库内部的全部缩放动画。

## 组合

**Mermaid + Excalidraw。** DSL 是可 diff 的语义；白板是批注。不要从自由元素反推语法。转换器单独引入并保持安全补丁。

**Excalidraw + React Flow + TanStack Query。** 人工确认后才映射成带业务 id 和端口的 nodes/edges。两种编辑器不要同时写同一份状态。Query 处理 409。

**Excalidraw + PDF。** 用受限 PNG 或经过净化的 SVG 当插图。位图失去可选文本。不要先放任超大导出再嵌进 PDF。

## 生产清单

1. 0.18.1 或更新的修复版，CSS 和高度齐全。
2. 全局键盘关闭，直到用户进入画布。
3. `initialData` 只做首次；更新走 API。
4. onChange 去抖，不递归 updateScene。
5. 导入限制扩展名、大小、元素数、链接和附件。
6. 异步结果带代数，卸载作废。
7. PNG 有像素上限，URL 释放。
8. 只读不是授权。
9. 字体自托管策略写进部署，而不是假设 CDN 可用。
10. 场景 JSON 与后端 revision 分开。

## 升级与练习

练习：画四步中文草稿，导出 JSON，在新页面用同一套 `sceneImportError` 导入；故意放入 `javascript:` 链接，确认前端拒绝。两标签同时改同一 revision 时，后保存的得到 409，本地草稿还在。Chrome 与移动 Safari 上看 IME、2048 PNG 和焦点。没有这些记录就仍是 NOT_RUN。

从旧教程迁移时删掉 `readyPromise`，API 只从 `excalidrawAPI` 回调拿。

## 故障排查

空白：高度和 CSS。图片导入后不见：files 没加回，或被 Lab 规则拒绝。保存覆盖了别人：把 initialData 当成受控了。快捷键乱飞：`handleKeyboardGlobally`。字体仍打 CDN：资源路径设置晚于模块求值。卸载后仍 setState：缺 `mounted` 或代数。多端不一致：进程内状态不是数据库。

## 官方链接

- [安装与字体](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/installation)
- [集成与 SSR](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/integration)
- [Props](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/props)
- [excalidrawAPI](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/props/excalidraw-api)
- [元素骨架](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/excalidraw-element-skeleton)
- [工具函数与导出](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/utils)
- [0.18.1 发布](https://github.com/excalidraw/excalidraw/releases/tag/v0.18.1)
- [npm](https://www.npmjs.com/package/@excalidraw/excalidraw)

## 证据

sdk、build、browser 在 `docs/library-lab/evidence/runs/` 有本条目收据之前为 **NOT_RUN**。`scene-policy` 测试只证明扩展名、体积、元素数、链接和附件拒绝，不证明画布或 PNG。Actions run `41779873259` 是仓库级 install、typecheck、build、52 个 SDK 文件（153 个测试）和 45 个 Playwright，不是 A09 的 PASS，不要写入 `verification.json`。
