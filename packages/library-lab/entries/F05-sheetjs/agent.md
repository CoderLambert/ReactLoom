# F05 SheetJS CE — Agent 选型与迁移指南

**事实**：这是2026-10-27依据官方 CE 0.20.3文档重新实现，原件为 SUMMARY_ONLY；不得援引旧 Slack PASS。
**安装要点**：`xlsx` 在 npm 公共 registry 上的版本可能滞后，固定官方签名/校验后的 `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz` 或经审查 vendor tarball。PLATFORM 独占 package+lock，不能擅自升级/引入第三方CDN执行。
**最小迁移**：`examples/core.mjs` 中 `createWorkbook/exportWorkbook/importWorkbook`；Node CLI 在 `basic.mjs/business.mjs/advanced.mjs`。依赖是实际 `xlsx`，没有模拟 SDK；不需要复制示例测试数据。
**必须保留**：列级 schema、原始输入大小限制、解压及计算预算、公式前缀处理、重复字段识别、导入结果再次验证；必要时改成隔离进程/Worker。
**反例**：CSV 字符串以 '=' 开头就安全地导出；将 workbook 保存当作计算公式；安装 npm 旧包却称为 CE 最新；对未知大表格全量主线程解析。
**验证**：独立 `node .../verify.mjs` 实际调用 SDK + 同版Excel兼容性检查，不把纯JSON预检/结构校验写为 SDK PASS。
**关联**：F04 ExcelJS 的XLSX公式/样式、F03 Papa Parse 的CSV、F02 react-dropzone的文件输入。
**官方**：https://docs.sheetjs.com/docs/getting-started/installation/frameworks/ 、https://cdn.sheetjs.com/


**输入与公式验证**：先读 `examples/validation.mjs`（严格三列对象、整数范围、文本/重复检查）；读 `examples/core.mjs` 的 `XLSX.read(sheetRows)`、表头、范围与公式单元格拒绝。不可用 `sheet_to_json` 后直接忽略额外列或对缺失属性 `String(undefined)`。通过 `node --test examples/validation.test.mjs` 只能验证纯业务边界；必须另外执行真实 SheetJS `examples/verify.mjs` 并测试恶意 XLSX，再判断目标SDK是否通过。压缩ZIP尺寸限制不等于解压内存限制。
