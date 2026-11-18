# react-pdf：React 中阅读已有 PDF

锁定 react-pdf 11.0.0（MIT）和 pdfjs-dist 6.3.289（Apache-2.0）。Document 管加载，Page 管当前页 Canvas 与文字层；生成文档看 F08，直接控制 PDF.js 看 F06。这里的两页 ASCII PDF 是原创 fixture，不是通用字体、密码或复杂文档兼容性证明。

## 三个实验

| 目标 | 操作与预期观察 |
| --- | --- |
| basic：首屏组件 | 启动后看到第一页 Canvas，不启用文字层 |
| business：逐页阅读 | 下一页看到 Page Two，文字层包含可选择文本，边界按钮禁用 |
| advanced：缩放与错误恢复 | 75–150% 改变实际画布；本地 PDF 替换文档；损坏字节显示错误，恢复样例重新加载 |

只有当前页挂载。三个实验共享真实 SDK，区别是阅读任务，不是换数据量。本地 Chromium 验证了真实 Worker、Canvas、文字层和文件生命周期。

## 完整迁入

复制 examples/example.tsx、fixture.ts、worker-payload.mjs/.d.mts、render-budget.mjs/.d.mts 六个原件。demo.tsx 只是 Lab 适配，不必迁入。安装上述固定依赖及 React 19，Vite 需支持 `?url`，TypeScript 引入 vite/client。保留 `react-pdf/dist/Page/TextLayer.css`。批注层关闭，无需批注 CSS。

Worker URL 从 `pdfjs-dist/build/pdf.worker.min.mjs?url` 导入，在渲染 Document/Page 的同一模块设置 `pdfjs.GlobalWorkerOptions.workerSrc`，避免模块执行顺序覆盖。实际安装依赖必须保证主线程与 Worker 同版。该 import 是打包配置，不是 Worker 已运行的证据。CSP 必须容许本地 Worker；本例不使用 CDN。

`file` 对象 memo，并把 new Uint8Array(source) 副本交给 SDK，因为 Worker 可以 transfer 并 detach buffer。不要交出 React 状态或 fixture 本体。换文档增加 key，卸载旧 Document。切换实验由 keyed session 卸载，清理读取代次；Document 内部加载任务的 destroy 与 Page 渲染任务 cancel 由 SDK effect cleanup 完成，实际 Worker terminate 仍须浏览器观察。

## 几何与输入预算

3MiB 只限制输入字节，无法限制 PDF MediaBox。BoundedPage 首次 `renderMode="none"`，真实 Page.onLoadSuccess 获取 `getViewport({scale:1})`，自建 getPageGeometry 同时按宽720×zoom、高960×zoom拟合；通过有限正数校验后才允许 canvas 和文字层。DPR 明确固定1，最高1080×1440、1555200像素。不能只传 width/height：实装 Page 同时指定时 width 优先，不会同时限制两轴。页面/zoom/document key 切换重做门控；不按原始巨大尺寸分配 Canvas。预算不限制 PDF 解析、字体解码、对象数或 CPU，不是敌对 PDF 沙箱。

本地文件先检查非空、≤3MiB和 .pdf 文件名，再 arrayBuffer；后缀是 UX，不是内容认证。input.onClick 在打开新 picker 时立即增加 readTurn，因此原生取消无需依赖 change 也已作废旧读取；onChange 处理的新选择（包括无效输入）再次增加 readTurn，晚到成功和失败均不能覆盖新状态。重置、损坏操作与卸载也失效此前读取。这只是忽略迟到结果，不物理取消 File.arrayBuffer。文件不上传，不存储，不创建 Blob URL。

## 错误与资源

读取失败保留旧文档并显示原因；解析失败用 Document error 和 onLoadError，页数清零；页面几何或渲染失败单独显示 alert。恢复样例换 Document key、页码1、zoom1。没有配置密码回调、CMaps、标准字体与 WASM 资源路径；复杂 PDF 失败不能直接称文件损坏。若产品需要它们，按匹配版本官方 README 配置并验证实际资源，不擅自复制远程字体。

## 证据与官方来源

官方原文在 official/readme.md，固定 v11.0.0 commit ca2330bcb862dc27aa39849c74657ccf28c4e13f 的 packages/react-pdf/README.md；根 README 实为指向该文件的 symlink。该版本目录仅发现英文 README。LICENSE 原字节及源 package.json 保存于 official/，不把 monorepo 根1.0.0当包版本。主页实际 GET200，但未从 Lab origin 验证嵌入，因此 unknown，保留官网直达。

Node 测试只证明副本 transfer 和几何策略。正式 SDK/build/browser 仍 NOT_RUN。浏览器提案在 validation/browser.spec.ts，由主控运行；应观察实际 Canvas、文字层、Worker、迟到读取和卸载，不以 DOM 消失替代 Worker 清理。

显式设置 Document 与 Page 的 `suspense={false}`。v11默认true会在useSuspenseResource中use(resource.promise)，初挂载重试无法依赖尚未提交的session useMemo身份稳定，还会将错误交给宿主边界。本例选择SDK useResource的Effect加载路径：active拦截迟到结果，cleanup调用task.dispose（Document映射loadingTask.destroy），Page上下文传递false给Canvas，render effect cleanup取消实际任务；loading/error/onLoadError继续在阅读器局部处理。不能删掉这两个false后仍声称相同行为。主控candidate35曾稳定停宿主Suspense，此修复须由主控重建真实浏览器验证。
