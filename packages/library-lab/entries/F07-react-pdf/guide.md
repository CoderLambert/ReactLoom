# react-pdf 11.0.0｜Document / Page 阅读已有 PDF

Lab 锁定 `react-pdf@11.0.0`（MIT）和 `pdfjs-dist@6.3.289`。这个包在 React 里浏览 PDF。它不是 `@react-pdf/renderer`（F08），也不是 `pdf-lib`（F09）。底层仍是 PDF.js，精细控制 Canvas 时看 F06。

用户显式启动 Demo 后挂载 [`examples/demo.tsx`](examples/demo.tsx) → [`examples/example.tsx`](examples/example.tsx)。Worker 地址写在**同一个模块**：

```ts
import { Document, Page, pdfjs } from 'react-pdf'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
```

这是源码里的路径约定。没有浏览器收据时，不要说 Worker 已经被页面取到，也不要说 CSP 已放行。

没有 `docs/library-lab/evidence/runs/` 收据时 sdk、build、browser 保持 NOT_RUN。Actions 41779873259 是仓库级安装、类型检查、构建、52 个 SDK 文件 / 153 项测试和 45 项 Playwright，不是 F07 的 PASS。

## Lab 当前示例

| 文件 | 作用 |
| --- | --- |
| `examples/fixture.ts` | 原创两页 PDF 字节 |
| `examples/example.tsx` | `<Document>` / `<Page>`、分页、文字层、本地文件 |
| `examples/worker-payload.mjs` | 非空且 ≤ 3 MiB 的 `Uint8Array`，`slice()` 后再交给 Document |
| `examples/worker-payload.test.mjs` | 用 `structuredClone` 的 transfer 证明副本被拆、原件还在 |

`file` 用 `useMemo` 依赖 `bytes` 和 `documentGeneration`，避免每次渲染都换一份新对象。`Document` 的 `key` 也是这个 generation，重置和换文件会卸掉上一份。

`renderAnnotationLayer={false}`。文字层只在非 basic 打开，并引入 `react-pdf/dist/Page/TextLayer.css`。没有批注层样式，因为没有画批注。

CMap、标准字体、wasm、密码文档是生产教学，本页没有配置那些静态资源。不要把两页夹具的成功说成任意 PDF 都能开。

## 1. 什么时候用

产品要在 React 树里翻页、显示加载和错误，而不想自己管 `getDocument`。需要串行 Canvas、HiDPI 预算和文本提取细节时用 F06。要写出新的 PDF 用 F08。要盖章或合并用 F09，预览再回到这里。

v11 面向 React 19 和较新的 Node。Lab 的 Web 模板是 React 19.3，Node 是 22。这只说明 peer 对得上，不是已经在浏览器里跑通。

## 2. 模型

PDF.js 可能把传入的 buffer transfer 给 Worker。因此不能把 React state 或夹具本体交给 `<Document file={bytes}>`。`createPdfWorkerPayload` 检查类型、非空和 3 MiB，然后 `{ data: source.slice() }`。

```text
夹具或 File.arrayBuffer
  → 新的 Uint8Array
  → createPdfWorkerPayload
  → <Document key file onLoadSuccess onLoadError>
       → <Page pageNumber scale renderTextLayer />
```

`onLoadSuccess` 写入页数。`onLoadError` 把页数清零并展示 `error.message`。加载中和页面渲染中各有 `role="status"`。解析失败还有 `role="alert"`。

本地文件：空文件或大于 3 MiB 拒绝；后缀不是 `.pdf` 时提示，内容仍交给解析器。`readTurn` 在选择、重置、卸载时增加。晚到的 `arrayBuffer` 不能 `setBytes`。选完立刻清空 input，同一文件可以再选。

「载入损坏字节」把 state 设成五字节并增加 generation。这会替换当前文档，和 F06 的「探测但不覆盖」不同。恢复按钮回到 `builtIn`，并重置页码、缩放和 generation。

basic 固定第 1 页、缩放 1、不画文字层。business 打开文字层和翻页。advanced 再加 75%–150% 缩放、文件选择、损坏字节和恢复。

## 3. 三层

### 基本

标题是「入门：React PDF组件」。夹具不请求 CDN。成功时状态含页数。只有一页被挂上，没有翻页按钮。

### 业务

翻页按钮受 `page` 和 `pageCount` 约束。文字层打开后，文本应能被选择。这和 F06 的 `getTextContent` 字符串不是同一个 API。缺 CSS 时文字层会错位，所以本页引入了官方样式。

### 进阶

本地文件停在内存。损坏字节应走到 `onLoadError`，而不是留下旧页数。恢复后 generation 变化，Document 重新挂载。缩放只改 `Page` 的 `scale`，不重新创建整棵应用。

## 4. 反例

### 反例 1：Worker 配在另一个模块

```ts
import { pdfjs } from 'react-pdf'
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js'
```

官方要求和渲染 Document 的模块放在一起，否则执行顺序会盖掉。本页把赋值放在 `example.tsx` 顶层。即使如此，也没有浏览器网络记录可以引用。

### 反例 2：主线程 6.x，Worker 仍是旧构建

F06 与 F07 同时声明 `pdfjs-dist@6.3.289`。只升级其中一个，运行时和 Worker 会错位。`entries/F06-pdfjs/examples/worker-version.test.mjs` 只核对声明，不证明 lock 里的实际文件。

### 反例 3：把 state 的 buffer 直接交出去

```tsx
<Document file={bytes} />
```

Worker 可能 detach 这块内存。恢复夹具时再读就会失败。每次给 Document 的都是 `slice()` 副本。

### 反例 4：沿用 v10 的加载写法

v11 的加载 UI 走 `loading` / `error` 子节点。不要再找已经换掉的包装，也不要在本页发明第二套 spinner 把 `onLoadError` 盖住。

### 反例 5：一次挂上所有 Page

```tsx
{Array.from({ length: pageCount }, (_, i) => <Page pageNumber={i + 1} />)}
```

页数一多，Canvas 会占满内存。本页只挂当前页。生产若要滚动预览，只渲染附近页。

### 反例 6：文件选择当成上传

```tsx
await fetch('/api/upload', { body: file })
```

本页没有上传。扩展名检查不是内容校验。不要把用户 PDF 发到教学服务。

### 反例 7：base64 放进长期状态

大文档变成字符串会占更多内存，也更容易进日志。保持 `Uint8Array`，离开页签让组件卸载。

### 反例 8：打开批注层却不给样式和 CSP

`renderAnnotationLayer={true}` 会带链接和脚本相关行为。本页关掉。不可信 PDF 的自定义 HTML 渲染不要做。

## 5. 组合

**F06**：同一 Worker 版本。需要预算和串行 Canvas 时用原生 API。react-pdf 没有引用 F06 的 `render-budget.mjs`，所以本页没有那道 4096 像素检查。产品若在这里放大，要自己加预算。

**F09**：`pdf-lib` 写出的字节可以当 `data`。两边的大小上限不同（F09 输入 2 MiB，这里 3 MiB），接起来时取更严的那个。

**F08**：名字都带 react-pdf。一个读，一个写。不要互相替换 import。

## 6. 清单

- Worker 赋值与 Document 同模块，版本与 F06 一致。
- `createPdfWorkerPayload` 拒绝空和大于 3 MiB。
- `file` 对象在同一次文档上保持稳定。
- 换文档增加 generation，并清空页数。
- 只渲染当前页；非 basic 才开文字层。
- 批注层保持关闭。
- 异步读文件核对 `readTurn`。
- 不上传、不使用 blob URL、不把 PDF 放进 `localStorage`。
- 密码、字体、CMap 未配置，失败文案不能写成「文件一定损坏」。

## 7. 升级

从 v10 迁到 11 时核对加载属性、React peer 和内置的 PDF.js 版本。本仓库钉在 11.0.0 与 pdfjs-dist 6.3.289。不要单独把 Worker 升到 6 的下一个小版。

pnpm 的依赖布局可能让 Worker 文件和主包解析到不同位置。那是安装后的检查，不是这份源码能保证的。

## 8. 验收

```bash
node --test packages/library-lab/entries/F07-react-pdf/examples/worker-payload.test.mjs
```

它用平台的 `structuredClone` 模拟 transfer，不 import `react-pdf` 或 `pdfjs-dist`。不是 SDK PASS，也不是 Worker 收据。

浏览器还要看：两页夹具、文字层可选、翻页、超限文件、五字节错误、恢复后能再画、离开页签卸载。F06 的结构测试不能填到 F07。没有收据就保持 NOT_RUN。

## 9. 故障对照

| 现象 | 先看 |
| --- | --- |
| 一直停在「正在解析」 | Worker 路径或版本不一致。源码赋值不是加载收据 |
| 恢复样例后不能再画 | 原 buffer 被 transfer。应每次 `slice()` |
| 翻页仍显示旧页码总数 | 换文件时没有把 `pageCount` 清零或没有换 key |
| 文字层错位 | 没引入 `TextLayer.css`，或 basic 层本来就关着 |
| 五字节仍显示成功 | 没有走 `onLoadError`。本页的损坏按钮会替换文档，和 F06 的探测不同 |
| 选同一文件没反应 | input 没有在 onChange 末尾清空 |
| 缩放后整页应用重挂 | scale 不应放进 Document 的 key。key 只跟 generation |
| 密码 PDF 报成「文件坏了」 | 本页没有密码回调。文案不能写成内容一定损坏 |

一次只挂当前页。滚动窗口、虚拟列表和注释层都没有。高 DPI 下 Page 的 canvas 内存不受 F06 那道 800 万像素函数约束，放大到 150% 只是四档里的一档，不是预算证明。

焦点：翻页按钮在两端禁用。加载和错误分别用 status 和 alert。不要只靠「红框」。移动端靠外层 `overflow: auto`，不要一次把所有页排进横向条。

和 F08 的 import 不要放在同一个文件里试。两个包的 `Document` 不是一个组件。和 F09 对接时复制字节，输入取 2 MiB 与 3 MiB 里更小的那个。

## 10. 练习时不要做的事

不要把用户 PDF 传到教学接口。不要把 base64 放进 `localStorage`。不要在修复「Worker 跨域」时改成公共 CDN。不要用两页夹具的成功关闭密码、CMap 和字体问题。

若要把阅读器嵌进表单，页码状态留在阅读器，表单只保存服务端文件 id。本页没有表单。

## 11. 资料

- https://github.com/wojtekmaj/react-pdf
- https://www.npmjs.com/package/react-pdf
- https://mozilla.github.io/pdf.js/api/

## 12. 和原生 PDF.js 的分工

F06 自己调用 `getDocument`、串行化 Canvas，并在赋值 `canvas.width` 之前检查 4096 与 800 万像素。F07 把这些交给 `react-pdf` 的 `Page`。因此本页没有 `render-budget.mjs`。把缩放从 75% 拉到 150% 只是 prop，不是内存收据。

两边的 Worker 声明都是 `pdfjs-dist@6.3.289` 的 `pdf.worker.min.mjs?url`，并且必须写在渲染模块里。只改 F07 的 import、或只改 F06 的 import，都会让主线程和 Worker 错位。版本测试不打开浏览器。

本页的损坏按钮把五字节写进 state，Document 会换 key 并走 `onLoadError`。F06 的探测留着当前文档。迁移时不要把这两种失败模式合成一句「坏文件被拒绝」。

文字层需要官方 CSS。basic 关闭 `renderTextLayer`，所以那一层没有可选文字是预期。批注层保持 false，链接、表单和脚本不在这次渲染里。

密码、CMap、标准字体和 wasm 都没有路径。失败文案可以来自解析器，不要改写成「文件一定损坏」或「Worker 已经加载」。没有收据时 browser 仍是 NOT_RUN。

本地文件先卡 3 MiB，再 `arrayBuffer`，再 `slice()` 给 Document。原 state 不能交出去。选完清空 input。卸载增加 `readTurn`。这些步骤缺一，就会把过期字节或已 detach 的 buffer 画出来。

不要上传所选 PDF，也不要把字节变成 base64 放进存储。夹具由 `createSamplePdf` 在本地生成。

`onLoadSuccess` 只负责页数和一句状态。`onLoadError` 把页数清零。loading 与 error 子节点不要再用 v10 的另一套包装盖住。缩放四档是 75、100、125、150。key 只跟文档代际，不跟 scale。

pnpm 的依赖布局可能让 Worker 文件和主包不在同一物理目录。那是安装后的检查。源码里的 `?url` 不能代替那次检查，更不能写成浏览器已经收到脚本。

离开页签时 Document 卸载。

不要在 basic 打开文字层来「凑」可选文本。

不要一次映射出全部 Page。

文件名以 `.pdf` 结尾仍要靠解析器判断内容。

五字节失败后用恢复按钮回到夹具，并增加 generation。

状态文案放在 `role="status"`，解析失败另有 `role="alert"`。
