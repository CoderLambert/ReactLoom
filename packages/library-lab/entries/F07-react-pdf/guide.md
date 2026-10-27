# react-pdf 11 — 从已有 PDF 中阅读、分页和抽取 UI

## 目标与选型边界

`react-pdf` 在 React 里渲染**已有 PDF**，提供 Document/Page 等组件；它不是将 React JSX 导出为 PDF 的 `@react-pdf/renderer`（F08），也不是直接改写 PDF 的 `pdf-lib`（F09）。底层使用 PDF.js，复杂布局/Worker/自定义 text/canvas 层可参考 F06 PDF.js 原生实现。

## 安装与 Worker 要求

```bash
pnpm --filter @reactloom/library-lab add react-pdf@11.0.0
# pdfjs-dist 由PLATFORM检查react-pdf依赖树并与 Worker 入口保持完全兼容
pnpm --filter @reactloom/library-lab dev
```

当前 Lab 与 F06 统一声明 `pdfjs-dist@6.3.289`，这是 `react-pdf@11.0.0` 对应的 PDF.js 版本基线。不能只把 F06 升级到更新的 PDF.js 而仍让 F07 使用旧运行时；静态版本检查由 `entries/F06-pdfjs/examples/worker-version.test.mjs` 执行，实际锁文件与 Worker 仍待真实安装和浏览器验证。

v11 需要 React19+、Node22.13+，适合当前 Lab 的 Node22/React19 主版本。官方特别指出 **Worker src 必须在使用 Document/Page 的同一模块设置**；示例 `examples/example.tsx` 用 Vite `pdfjs-dist/build/pdf.worker.min.mjs?url` 本地资源。pnpm 非扁平 node_modules 需要额外依赖解析/hoist，PLATFORM 要检查 Worker/SDK 是否同版，严禁默认借用 CDN 造成私有文档外传或不确定依赖。

## 三层示例与真实运行路径

1. **Basic**：`examples/fixture.ts` 在浏览器里由 ASCII 对象/xref 生成有效原创两页 PDF，`<Document file={bytes}><Page pageNumber={1}/></Document>`，不下载素材。
2. **Business**：Document `onLoadSuccess` 取得真实页数，按钮导航 `pageNumber`，开启 text layer（导入官方TextLayer CSS），演示阅读与文本可选择的区别。
3. **Advanced**：接受本地3MiB以内文件，以 File.arrayBuffer 读取，generation 防旧文件回写；非法 PDF 展示解析失败，恢复按钮重置当前示例；缩放 scale 不重新加载整个应用。

页面演示从 `examples/example.tsx` 动态加载，源码查看器读取同文件；`demo.tsx` 不包含第二套实现。

## 生命周期、安全与性能边界

Document 子树挂载负责 PDF.js 加载和渲染资源，切换文档时使用明确的 key 触发卸载；File读取的 generation 和 unload effect 阻止旧回调复写新文档状态。不使用 blob URL，避免忘记 revokeObjectURL。客户端文件名、扩展名只是提示，真正的内容由 PDF 解析器判断；生产服务端上传/下载仍需独立验证和权限。

对大量页的文档**不要一次渲染全部 Page**；应惰性渲染附近页并保留滚动定位。高 DPI/缩放可能扩大 Canvas 内存，需限制内存/像素尺寸。复杂字体、JPEG2000、JBIG2、CMaps 需准确放置静态资源；不能用一个成功两页 fixture 宣称任意PDF都可用。

## 典型反例

- 错将 `@react-pdf/renderer` 当阅读器，或把阅读器导出一份 JSX PDF。
- 在不相关的 entry 配置 workerSrc，因模块执行顺序被覆盖；或 Worker 版本与 PDF.js 主线程不一致。
- 将每个用户 PDF 转 base64 字符串放入长期状态/Storage，引发内存和数据泄露。
- 每次 page 变化都重新调用加载文档，无谓重复网络或解析。
- 用 `renderAnnotationLayer={true}` 但未提供关联样式/CSP策略。
- 不处理文档损坏/密码/跨域和旧请求，关闭后 UI 仍显示旧页面。

## 验收与集成

需要真实 Chromium：离线两页PDF渲染、text层与分页、文件选择大小限制、坏字节错误、修复/重进、Worker URL实际被请求、DevTools资源卸载和 CSP。当前SDK NOT_RUN、构建 BLOCKED、浏览器 NOT_RUN；此前 F06 的结构算法预检不作为本条目 SDK 运行证明。

官方：[React-PDF README](https://github.com/wojtekmaj/react-pdf)，[npm 11.0.0](https://www.npmjs.com/package/react-pdf)，[PDF.js](https://mozilla.github.io/pdf.js/api/)。

## Wave21：Worker Transfer与重置时的数据所有权

PDF.js可能将解析输入的Uint8Array buffer transfer到Worker；直接`<Document file={bytes}>`交出React状态/原创fixture可能使其成为detached buffer，恢复示例时再利用就失败。示例现在经 `examples/worker-payload.mjs` 对非空且<=3MiB字节创建 `slice()` 的独立副本，传给 `<Document file={{data}}>`。通过 `useMemo([bytes,documentGeneration])` 保持file对象在正常重渲染期间稳定，每次重置/切换才重新申请Worker专属数据。

`node --test entries/F07-react-pdf/examples/worker-payload.test.mjs` 使用原生Node structuredClone的transfer真实复现「Worker副本被detach，原字节不受影响」，但没有运行react-pdf或PDF.js。真实浏览器仍必须验证重复重置、页码导航、F06/F07交替Worker加载和CSP。
