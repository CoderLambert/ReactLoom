# PDF.js 6.3.289｜本地字节、Canvas 预算和同模块 Worker 路径

Lab 锁定 `pdfjs-dist@6.3.289`（Apache-2.0）。它解析并画出已有 PDF。它不生成报表（那是 F08），也不改字节（那是 F09）。React 包装看 F07，两边必须同一版 Worker。

显式启动后，Demo 页挂载 [`examples/demo.tsx`](examples/demo.tsx) → [`examples/example.tsx`](examples/example.tsx)。源码把 `GlobalWorkerOptions.workerSrc` 设成 Vite 解析的 `pdfjs-dist/build/pdf.worker.min.mjs?url`。这只是构建期的同路径约定。没有浏览器收据之前，不要写成「Worker 已经在页面里加载成功」。

没有 `docs/library-lab/evidence/runs/` 收据时 sdk、build、browser 保持 NOT_RUN。Actions 41779873259 是仓库级安装、类型检查、构建、52 个 SDK 文件 / 153 项测试和 45 项 Playwright，不是本条目 PASS。

## Lab 当前示例

| 文件 | 作用 |
| --- | --- |
| `examples/fixture.ts` | 本地生成的两页 PDF 字节，不下载第三方文件 |
| `examples/example.tsx` | `getDocument`、`getPage`、`render`、`getTextContent` |
| `examples/render-gate.mjs` | 同一 Canvas 上的绘制串行化 |
| `examples/render-budget.mjs` | CSS 边长、背板边长和 800 万像素上限 |
| `examples/render-gate.test.mjs` | 队列策略，不 import pdfjs |
| `examples/render-budget.test.mjs` | 尺寸策略，不 import pdfjs |
| `examples/worker-version.test.mjs` | 仓库里 F06/F07 声明的版本字符串 |

输入上限 3 MiB。默认文档来自 `createWorkshopPdf()`。advanced 才允许选择本地 `.pdf` 和探测损坏字节。选择文件只读到内存，不上传。

CMap、标准字体、WASM 和加密文档是生产教学，本页没有挂这些资源。

## 1. 什么时候用

合同、报表、文章附件要在浏览器里看一页。扫描件没有文字层时，`getTextContent` 会空，那是 OCR 的工作，不是 PDF.js 的失败。要改页、盖章、合并，用 F09，画完再决定要不要回到这里预览。

不要把任意 URL 丢给 `getDocument({ url })`。本页只传 `data`。

## 2. 模型

```text
bytes.slice() → getDocument({ data }).promise
  → getPage(pageNum)
  → getViewport({ scale: 1.15 * scale })
  → boundedCanvasSize
  → withCanvas(() => page.render(...).promise)
  → getTextContent（非 basic）
```

加载 effect 依赖 `bytes`。清理时 `active = false` 并 `task.destroy()`。迟到的 promise 看到 `active` 就不再 `setPdf`。

绘制 effect 依赖 `pdf`、页码和缩放。清理时 `renderTask.cancel()`。`cancel()` 不会同步放开 Canvas。`createRenderGate` 把下一次绘制排到上一次 settled 之后。取消或抛错不会把队列卡死：失败被吞进下一次的链，调用方自己的 promise 仍会 reject。过期任务在进门时看到 `active === false` 就返回。

`RenderingCancelledException` 不覆盖状态文案。其它渲染错误会写到 `role="status"`。

`boundedCanvasSize` 要求 viewport 和 devicePixelRatio 是有限正数。CSS 宽高向上取整后各不超过 4096。背板倍率夹在 1 和 2 之间。像素宽高不超过 4096，乘积不超过 8 000 000。检查发生在给 `canvas.width` 赋值之前。

损坏探测用单独的 `probeTask`。新的探测或卸载会 `destroy` 上一次。`finally` 只销毁仍挂在 ref 上的那一个任务，避免清掉新任务。

文件读取有 `fileGeneration`。超限或非 `.pdf` 后缀直接返回。后缀只是提示，内容仍由解析器判断。

## 3. 三层

### 基本

画第 1 页。没有翻页控件。文案应变成已加载页数，并写明没有访问远程 URL。Canvas 有 `role="img"` 和页码标签。这是解析结果，不是一张事先画好的图片。

### 业务

上一页 / 下一页，范围是 `1..numPages`。翻页会取消旧的 render。文本层用 `getTextContent` 把带 `str` 的 item 拼起来。缺字体映射时文本可能空或乱，要在产品里说明，不能当成 OCR。

### 进阶

缩放下拉 80%–200%，再乘内部的 1.15。本地文件超过 3 MiB 不读。按钮用五字节 `{1,2,3,4,5}` 做探测：失败文案是「已正确捕获损坏 PDF，不覆盖当前已加载文档」。成功反而要当成异常。当前画布上的文档不被这五字节替换。

## 4. 反例

### 反例 1：主线程和 Worker 不同版

```ts
GlobalWorkerOptions.workerSrc = 'https://cdn.example/pdf.worker.min.mjs'
```

F06 和 F07 都从锁文件里的 `pdfjs-dist@6.3.289` 取 `pdf.worker.min.mjs`。不要只升一边，也不要换 CDN。源码这样写，仍然不是浏览器已经收到 Worker 脚本的收据。

### 反例 2：换文件不 destroy

每次 `getDocument` 都留下 Worker 和文档。effect 的清理函数要 `destroy()`，包括 promise 还没完成的那次。

### 反例 3：取消后立刻再用同一 Canvas

```ts
task.cancel()
page.render({ canvas, canvasContext, viewport })
```

可能抛出同一 Canvas 正在使用。先经过 `render-gate`，再在任务里检查 `active`。

### 反例 4：3 MiB 输入等于安全画布

恶意页可以声明巨大的 MediaBox。要在 `render` 前跑 `boundedCanvasSize`。拒绝分配，不要先把 `canvas.width` 设成几十万。

### 反例 5：文本提取当成表格或 OCR

`getTextContent` 只看文字层。扫描件、复杂版面、阅读顺序都要另做。不要把空字符串显示成「文档是空的」。

### 反例 6：公网 URL 和无限大小

```ts
getDocument({ url: userPaste })
```

这会遇到跨域、SSRF 和内存峰值。Lab 只用 `Uint8Array`，并且在客户端先卡 3 MiB。服务端若接收 PDF，还要自己的配额和隔离，不要把用户文件上传到教学接口。

### 反例 7：只改 CSS 不改像素

高分屏要设 canvas 的像素尺寸，再用 transform 对齐 viewport。预算函数把 DPR 限制在 2。不要一次把上百页都画成位图。

## 5. 组合

**react-pdf（F07）**：同一 `pdfjs-dist` 版本。它用 Document/Page。这里直接 `getDocument`。两边同时升级。

**pdf-lib（F09）**：改完字节再送回 `data`。不要在 PDF.js 里画批注冒充已写进文件。

**@react-pdf/renderer（F08）**：生成新 PDF 的库。包名相近，职责相反。

## 6. 清单

- `data: bytes.slice()`，不把 React state 的 buffer 直接交出去。
- 卸载同时取消 render 和 destroy loading task。
- 探测任务单独持有，finally 不误伤新任务。
- 分配 Canvas 前检查 4096 与 800 万像素。
- 取消异常不刷成失败文案。
- 本地文件先看大小，再看代号。
- 不从第三方域名拉 PDF。
- CSP 的 `worker-src` 要在真实部署里看。本页没有那份浏览器记录。

## 7. 升级

升 `pdfjs-dist` 时 F07 的 `react-pdf@11.0.0` 必须一起核对。`worker-version.test.mjs` 只比较仓库里的版本声明，不解析 node_modules，也不发 Worker 请求。

`getDocument` 的参数和 `page.render` 的 canvas 字段以 6.3.289 为准。不要把多年前示例里的全局 `PDFJS.workerSrc` 写回来。

## 8. 验收

```bash
node --test packages/library-lab/entries/F06-pdfjs/examples/render-gate.test.mjs
node --test packages/library-lab/entries/F06-pdfjs/examples/render-budget.test.mjs
node --test packages/library-lab/entries/F06-pdfjs/examples/worker-version.test.mjs
```

三条都不加载 PDF.js，不是 SDK PASS，更不是 Worker 收据。

浏览器还要看：两页内容不同、文本里有夹具关键词、快速缩放不出现同一 Canvas 错误、坏字节不换掉当前文档、离开页签后不再画。这些观察要有收据。`destroy()` 会等传输清理，不等于脚本还没加载时 Worker 已同步消失。

## 9. 故障对照

| 现象 | 先看 |
| --- | --- |
| 画布空白 | Demo 是否已启动；`getDocument` 是否抛错并写进状态 |
| 同一 Canvas 报错 | `cancel()` 之后没有等 gate。快速改缩放最容易出现 |
| 坏字节把当前页换掉 | 那是探测路径写进了 `setBytes`。本页的探测不应这么做 |
| 文本为空 | 文字层缺失或字体映射不够。不是 OCR 失败 |
| 巨大页面把标签卡死 | `boundedCanvasSize` 被挪到 `canvas.width` 赋值之后 |
| Worker 地址是 CDN | 源码应是 `pdf.worker.min.mjs?url`。即便如此也没有加载收据 |
| 和 F07 各用一版 | 声明必须同时是 6.3.289。静态测试不读取已安装文件 |

键盘：翻页按钮可禁用在两端。Canvas 是 `role="img"`，不能代替可选文字。缩放在 advanced 的 select 里，不用滚轮改 scale。移动端宽度靠外层 overflow，不把 CSS 像素设成超过 4096。

离开页签必须同时停掉加载任务和渲染任务。只清 React state 会留下 Worker 侧的文档。

## 10. 资料

- https://github.com/mozilla/pdf.js
- https://mozilla.github.io/pdf.js/api/
- https://github.com/mozilla/pdf.js/blob/master/examples/learning/helloworld.html
- https://www.npmjs.com/package/pdfjs-dist

## 11. 还没挂上的能力

CMap、标准字体、WASM、加密口令和注释层都没有配置。两页夹具能画出来，只说明这条 `getDocument({ data })` 路径能解析自己生成的字节。

`workerSrc` 指向构建期的本地 URL。浏览器是否发出了 Worker 请求、CSP 是否拦截、脚本版本是否和主线程一致，都要有一次带页面的记录。静态 `worker-version.test.mjs` 只比较仓库里的版本字符串。

不要把用户文件发到教学接口。advanced 的选择器读完就留在内存里，离开页签应销毁任务。3 MiB 是读取上限，不是画布安全上限。
