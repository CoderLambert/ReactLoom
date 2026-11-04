# F06 PDF.js — 工程手册

## 适用

在 Canvas 上阅读已有 PDF。生成用 F08，修改字节用 F09，React 组件用 F07。不要拉远程 URL。

## 版本

`pdfjs-dist@6.3.289`，Apache-2.0。Worker 入口是 `pdfjs-dist/build/pdf.worker.min.mjs?url`，与 F07 同一声明。没有浏览器收据就不要说 Worker 已加载。

## 迁移

带走 `examples/example.tsx`、`examples/fixture.ts`、`examples/render-gate.mjs`、`examples/render-budget.mjs` 和对应的 `.d.mts`。`getDocument` 只接收 `data` 的副本。绘制必须进 `withCanvas`。分配像素前调用 `boundedCanvasSize`。

## 不可删的清理

换 `bytes` 时 `destroy()` 加载任务。换页或缩放时 `cancel()` 渲染任务。`active` 阻止过期 `setState`。探测任务单独 destroy，finally 只清理仍属于自己的那次。卸载增加 `fileGeneration`。DPR 不超过 2，CSS 和背板边长不超过 4096，像素不超过 800 万。

## 反例

- CDN 上的另一版 Worker。
- 只升 F06 不升 F07。
- `cancel()` 后立刻再 `render` 同一 Canvas。
- 用 3 MiB 输入上限代替页面尺寸预算。
- 把 `getTextContent` 当成 OCR。
- `getDocument({ url })` 打开用户粘贴的地址。
- 只改 CSS 尺寸导致高分屏模糊。
- 一次画出全部页面的高分辨率位图。

## 测试断言

- 队列在拒绝后仍接受下一次操作，过期操作不再写结果。
- 非有限尺寸、超长边、超 800 万像素被拒绝。
- F06 与 F07 的声明版本都是 6.3.289。
- 损坏字节的探测不替换当前 `bytes`。
- 上述 Node 测试不 import `pdfjs-dist`。

## 真实限制

默认夹具只有两页。没有 CMap、加密或表单验收。文本层不是阅读顺序保证。Worker 脚本是否被浏览器取得，要看网络面板和收据，源码赋值不够。探测用的五字节不能写进当前文档的 state。

## 证据

sdk 与 browser 在缺少 `docs/library-lab/evidence/runs/` 收据时保持 NOT_RUN。版本字符串测试不是 Worker 收据。Actions 41779873259 不是 F06 PASS。

`render-budget` 与 `render-gate` 的 Node 测试同样不加载 pdfjs-dist。
