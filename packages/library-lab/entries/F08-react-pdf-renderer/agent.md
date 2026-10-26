# F08 @react-pdf/renderer — Agent 迁移指南

## 任务选型
新报告PDF排版用 `@react-pdf/renderer@4.9.0`；已有PDF阅读是 `react-pdf`（F07），对现有字节合并/标注是 `pdf-lib`（F09）。不要把三个近似名称混为同一个包。

## 迁移最小文件
拿走 `examples/report.tsx` 真实的 Document/Page/Text/StyleSheet/Flexbox模式；UI触发下载参考 `examples/example.tsx`，目标应用可以替换实际数据接口，但保留输入 schema 和按需生成策略。

## 生产必须保留
- 对行数、字节数、字符集做上限，特别是Unicode字体/网络图片的许可与CORS。
- 表格长文档分页策略、`wrap={false}`、`fixed` Footer。
- 生成只在明确用户意图时启动，异步epoch避免旧结果覆盖。
- BlobURL更新/卸载都revoke；不得在React render中直接异步生成PDF。
- 避免把生成PDF当成可视化预览器；真实pdfjs能读取才代表互操作检查。

## 测试约定
浏览器点击后有实际application/pdf Blob，PDF.js解析页数和文本、100行跨页、卸载内存释放、失败恢复、键盘交互；还需检查字体编码与商业分发权。模拟Blob不等于真实SDK测试。当前该库sdk/build/browser均NOT_RUN/BLOCKED。

官方：<https://react-pdf.org/docs/v4>
