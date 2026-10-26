# F09 pdf-lib — PDF 创建、修改与页面合并

## 使用目的
`pdf-lib` 负责 PDF 字节的**创建、合并、编辑、表单更新**，而不是将 PDF 绘制成浏览器 Canvas（F06 PDF.js）。演示输入是原创的内存 PDF；不开网络、不访问账户与私有文件。

## 依赖/源码/运行
```bash
pnpm add pdf-lib@1.17.1
```
代码见 `examples/document.ts`（与展示同源），`examples/example.tsx` 只封装按钮、状态和下载URL；入口 `examples/demo.tsx`。

## 实战三层
1. **basic**：`PDFDocument.create()` → `addPage()` → `embedFont(StandardFonts.Helvetica)` → `drawText()` → `save()`，下载本地字节。
2. **business**：两份原创报告分别创建后 `PDFDocument.load()`，用 `copyPages()` 合并到目标PDF，检查 `getPageCount()===2`。
3. **advanced**：用户主动选择≤2MiB本地PDF；校验文件头后实际 `load()` 并写入标注；损坏/加密/超大文件必须给出错误，不能回退到假成功。

## 机制与生命周期
PDFDocument是内存对象，`save()` 返回 Uint8Array。展示层使用 `Blob` + `URL.createObjectURL` 生成下载链接，切换文件/卸载时撤销旧URL；epoch避免过期异步完成反写。PDF签名只能快速筛选，**不是安全扫描**。实际产品需对压缩对象、超多页、附件与内存预算另做隔离；不能直接相信文件 MIME。

## 反例
- 使用默认 Helvetica 直接写中文：会遇到 WinAnsi 字符编码失败。中文要使用合法字体资源并通过 `@pdf-lib/fontkit` 注册，优先确认许可。
- 用 `pdf-lib` 预览已有PDF：它不提供完整浏览器阅读器；需组合F06/F07。
- 将浏览器file转成Blob URL后从不revoke：内存泄漏。必须局部回收。
- 直接覆盖用户源文件：本示例只产生新bytes并下载，不写原始对象。

## 组合和练习
F07 react-pdf进行所生成PDF的可选择文本预览；F08适合用React布局新PDF。练习：创建三页报告、提取部分页重组，检查页数顺序；再上传损坏内容验证错误恢复而不是空白页。

## 官方依据与状态
<https://github.com/Hopding/pdf-lib> / <https://pdf-lib.js.org/>。MIT，基线1.17.1。实际SDK、生产构建和浏览器仍NOT_RUN/BLOCKED，源码存在不等于验收通过。
