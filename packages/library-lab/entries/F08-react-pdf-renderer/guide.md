# F08 @react-pdf/renderer — React 声明式 PDF 生成

## 适用场景
适用于报告、票据、新闻日报等**新建PDF排版**。它不是F07 `react-pdf`（PDF阅读器），后者主要基于PDF.js展示已有PDF；对现有文档增页/合并则优先F09 pdf-lib。

## 安装和入口
```bash
pnpm add @react-pdf/renderer@4.9.0
```
`examples/report.tsx` 定义真正的 `Document/Page/View/Text` 和StyleSheet；`examples/example.tsx` 用 `pdf(<ReportDocument />).toBlob()` 生成内容，仅在点击后执行、按需导入。不会将 Blob 人工伪造为 PDF。

## 三层实战
- **basic**：单条来源→A4报告→pdf().toBlob()→下载链接。
- **business**：多个RSS来源表，Flexbox行、数字对齐、列表生成。
- **advanced**：100行自动分页、行禁拆、页码固定、输入上限与错误提示。执行代码还验证输出 MIME 和字节大小；并不由此证明 PDF 解析完全正确，需真实PDF阅读器验收。

## 资源所有权
renderer 在点击时运行；Blob URL由组件拥有，新的结果覆盖旧结果时调用 `URL.revokeObjectURL`，卸载时再次释放；epoch防止长时间渲染的旧结果回写新Tab。未使用外部图片/字体/CDN/付费API。

## 生产反例与修复
1. 在 100 张卡片每张挂 `BlobProvider` 自动生成：CPU和内存飙升。改为显式触发，复用按需组件和队列。
2. 把CSS Web属性随意传给PDF：React-PDF使用PDF布局自己的StyleSheet API，需针对PDF验证。
3. 直接用Helvetica输出中文：默认核心字体不支持Unicode中文；生产场景登记拥有分发权的字体并测试embed。
4. 大表格无分页/页脚策略：行 `wrap={false}`，Footer `fixed`，大数据须后端分页或分批生成并设限。
5. 异步输出不释放URL：切换组件、失败和卸载都要回收对象URL，避免长期会话内存增长。

## 组合与实践
F09 pdf-lib可在生成后合并PDF；F07 react-pdf可作为预览器。练习：多页报告与页码对照，注入非法名称并断言显式错误，验证真实PDF可被PDF.js读取。

## 来源及验证
<https://react-pdf.org/docs/v4>、<https://react-pdf.org/docs/v4/advanced/on-the-fly-rendering>；4.9.0/MIT。TypeScript/Vite/Chromium SDK测试尚未完成，NOT_RUN不是PASS。

## Wave16 报表输入与并发

唯一数据校验源 `examples/report-policy.mjs` 拒绝null/数组、非ASCII名字、错误ID、大小写重复ID、非安全整数/超140行；只把白名单字段放进PDF。`PdfRendererSession key={level}` 隔离下载链接，同步running ref阻止同轮重复pdf().toBlob。纯Node测试5项通过，不代表react-pdf/字体/分页真实验证。
