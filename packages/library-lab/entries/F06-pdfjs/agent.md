# F06 PDF.js — Agent 实施要点

用于已有PDF可视化读取，不用于生成/编辑PDF；与F07 React-PDF（封装阅读）、F08 @react-pdf/renderer（生成）、F09 pdf-lib（编辑）按职责比较。基线pdfjs-dist 6.3.289（Apache-2.0），浏览器必须核验API和Worker真实构建。

## 可复用源码
- `examples/fixture.ts` 为原创测试PDF生成器，提供无需第三方PDF的E2E样本；不是生产PDF创建方案。
- `examples/example.tsx` 为真实 Worker + getDocument + page.render + getTextContent 运行源码；`examples/demo.tsx` 为Lab出口。
- Worker使用 `pdfjs-dist/build/pdf.worker.min.mjs?url` 本地构建并匹配SDK版本，切忌混用CDN不一致Worker。
- 页码/缩放改变必须先取消旧renderTask；文件变化/卸载销毁loadingTask，持续会话可缓存PDFDocumentProxy但别泄漏旧实例。
- 每页DPR与Canvas像素上限必须有预算；长文档虚拟页/缩略图和异步加载另行设计。
- 业务文件入口需校验类型、大小和权限，所有SVG/HTML附件与任意远程URL按不可信输入处理；本地演示限制3MiB且无网络上传。
- 真实PDF扫描件可能没有文本层：getTextContent成功不等于OCR成功。

## 验证
`pnpm --filter @reactloom/library-lab typecheck`、`build`、真实Chromium加载/分页/缩放/损坏文件/卸载；检查Worker资产路径、CSP与版本；记录源码fingerprint+命令+日志才可PASS。当前待执行。官方：https://mozilla.github.io/pdf.js/api/

## 跨库接入和并发绘制

Lab 与 F07 react-pdf 11 使用同一 `pdfjs-dist@6.3.289` 及本地 Worker；实际锁文件/hoist 由 PLATFORM 检查。若升级 react-pdf，先核对其 PDF.js 精确依赖并同步 F06/F07，不能只改一个 Worker URL。单个 Canvas 的渲染需复用 `examples/render-gate.mjs`，在 cleanup 调用 `task.cancel()`，并等待旧 promise 结算后再 `render`；过期页不得设置新状态。测试 `render-gate.test.mjs` 和 `worker-version.test.mjs` 为纯 Node 逻辑/静态合同，不代表浏览器 PDF SDK 已验证。
