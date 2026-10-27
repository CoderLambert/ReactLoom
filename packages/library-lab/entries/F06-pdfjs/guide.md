# PDF.js：真实 PDF 页面读取、Canvas 和 Worker 生命周期

## 选型

Mozilla PDF.js / `pdfjs-dist` 负责解析和展示已有PDF，常用于报表、合同、论文预览及文章内嵌文档。它**不是**用React生成PDF的 `@react-pdf/renderer`，也不等于能安全修改签名/权限的PDF编辑器。若仅需要React组件封装，优先对比F07 react-pdf；需要修改PDF可比较F09 pdf-lib。

```bash
pnpm add pdfjs-dist@6.3.289
```

示例使用 `pdfjs-dist/build/pdf.worker.min.mjs?url` 引入与主线程SDK**相同发布版本**的Worker，`GlobalWorkerOptions.workerSrc` 由Vite构建成局部静态文件，避免硬编码外部CDN或把Worker加载视为天然跨源安全。

## 三层实战

**basic**：`examples/fixture.ts` 生成原创、两页、含正确xref偏移和Length的PDF字节；`getDocument({data:bytes})` 真实解析（绝不是绘制一张相似图片）。`getPage(1)` 和 `page.render(...)` 在 Canvas 上真正显示文档页。

**business**：页码增减触发取消旧 render task，再使用 `getTextContent()` 展示PDF实际文本层。文本提取不等于结构化表格识别或OCR；字体映射缺失可能让内容为空或错乱，应对用户说明限制。

**advanced**：缩放与 `window.devicePixelRatio` 上限2控制HiDPI。用户自行选择≤3MiB PDF，只在本地读取，切换内容时重置页码。按按钮使用损坏字节单独触发解析错误，捕获并保持原文档；资源释放避免中途旧渲染将画布重写。

## 关键生命周期

- `getDocument` 返回loadingTask，含Worker/数据流；页面卸载或文件改变时 `loadingTask.destroy()` 释放。
- `page.render()` 返回renderTask；参数变更/卸载调用 `renderTask.cancel()`，不能复用正在绘制的同一个Canvas。
- Canvas像素为 CSS尺寸×DPR，需要内存预算：600×800×2×2≈7.7MiB/单页（RGBA）。不要一次渲染100页全部高分辨率位图。
- 尽量用受控 `Uint8Array`、对象URL并在不需要时revoke；本示例不使用外部PDF URL，降低SSRF与版权风险。
- 浏览器 Worker/CSP可能需要 `worker-src 'self'`；跨源隔离、字体/CMAP/standard fonts和大文件行为请基于真实部署确定，不得写成普适已验证。

## 特有反例

1. Worker主线程用v6、PDF Worker从旧CDN取v5 → 版本不匹配造成神秘错误；必须同版锁定。
2. 在每次输入/页码改变时不断`getDocument`却不`destroy` → Worker和PDF缓存泄漏。
3. 取消切页只`setState`不`renderTask.cancel` → 旧页重叠绘制、Canvas状态冲突。
4. 文本提取等同于OCR → 扫描件无文字层，必须另用OCR并标其许可/成本。
5. 直接接受任意公网PDF链接/无大小限制 → SSRF、内存峰值及跨域失败。真实服务需可信代理/配额/权限。
6. 在Canvas设CSS高宽却忘设置实际像素 → 高DPI模糊/缩放性能问题。

## 验收

需要实际安装SDK、Worker、Chromium后：第一页和第二页内容不同，getTextContent包含预期关键词，缩放/切换迅速时无“same canvas”并发错误，坏文档提示不清空有效文档，卸载停止Worker相关资源。当前只有源码提交，不能称SDK或浏览器PASS。官方 [PDF.js仓库](https://github.com/mozilla/pdf.js) · [API](https://mozilla.github.io/pdf.js/api/) · [npm](https://www.npmjs.com/package/pdfjs-dist)。

## React-PDF 11 的跨条目版本合同

Lab 主依赖统一采用 `react-pdf@11.0.0` 对应的 `pdfjs-dist@6.3.289`。F06 和 F07 都从同一根包导入 `pdfjs-dist/build/pdf.worker.min.mjs?url`；两者必须同时升级，不能只升级 F06 而让 F07 的 `pdfjs` 运行时和 Worker 不一致。运行 `node --test entries/F06-pdfjs/examples/worker-version.test.mjs` 只能验证仓库静态声明，不代表已安装的依赖树确实满足该合同。实际 npm 解析、Worker 网络请求和浏览器渲染必须由 PLATFORM 核实。

## 为什么需要串行渲染

PDF.js `RenderTask.cancel()` 并非同步释放正在绘制的 Canvas。连续切页/缩放时必须等待旧 `RenderTask.promise` 结算，再让新任务使用同一 Canvas。示例 `examples/render-gate.mjs` 负责串行化，React effect cleanup 负责取消旧任务，effect 的 `active` 标记阻止排队的过期绘制与状态回写。`node --test entries/F06-pdfjs/examples/render-gate.test.mjs` 覆盖排他队列、取消后继续以及过期任务跳过。此 Node 测试不使用 PDF.js，最终仍必须在真实 Chromium 快速切页/缩放并检查画布重复使用异常。

## Wave21：PDF巨大页面的Canvas内存硬上限

3MiB输入限制不等于安全的Canvas大小，恶意PDF可以声明极大页面。真正的 `page.render()` 之前使用 `examples/render-budget.mjs` 验证 `getViewport()` 返回有限正尺寸：CSS边长不大于4096px、Canvas backing-store边长不大于4096px且总像素不大于800万；DPR最大2。检查在任何 `canvas.width/height` 赋值前执行，异常页报告失败但保留串行渲染gate。生产可按设备分级设置内存预算。

纯策略复现：`node --test entries/F06-pdfjs/examples/render-budget.test.mjs`，检查舍入、无穷/NaN、恶意尺寸与高DPR。该命令不会导入pdfjs-dist，不构成PDF Worker/SDK PASS；真实Chromium应加载巨型MediaBox PDF验证拒绝分配和正常页面恢复。
