# F04 ExcelJS — XLSX 工作簿生成、样式与数据边界

## 任务与适用性
将新闻订阅分析结果做成可审计的 XLSX 报表，支持多列数据、单元格样式、冻结表头和受控公式。纯 CSV 优先 Papa Parse；**ExcelJS 不计算公式**，公式的 `result` 仅是预填缓存，需Excel或其他计算引擎刷新。

## 安装与运行
```bash
pnpm --filter @reactloom/library-lab add exceljs@4.4.0
node packages/library-lab/entries/F04-exceljs/examples/basic.mjs
node packages/library-lab/entries/F04-exceljs/examples/business.mjs
node packages/library-lab/entries/F04-exceljs/examples/advanced.mjs
node packages/library-lab/entries/F04-exceljs/examples/verify.mjs
```
开发依赖和锁文件由 PLATFORM 统一维护，上述安装命令是独立复现说明而非指示EF修改依赖。脚本只使用内存 Buffer，不污染用户磁盘目录。

## 三层实战
**入门**：`new ExcelJS.Workbook()`、`addWorksheet`、`sheet.columns`、`getRow(1).fill/font`，写出并载入 XLSX，检查首条数据和冻结表头。

**业务**：使用本地 RSS 指标，`addRow` 后插入 `SUM` 公式及明确缓存值，再 `xlsx.writeBuffer()` / `xlsx.load()`，检查 `formula` 与 `result` 双字段。

**进阶**：`safeSpreadsheetText` 阻断以 `=+-@` 起始的恶意文本被当公式解释；拒绝无效计数、重复标识、超长单元格和超500行；务必对所有不可信字符串做导出前处理。攻击字符串只用于原创 fixture。

## 机制与生命周期
ExcelJS 存储 workbook/worksheet/cell 对象，`writeBuffer` 整本序列化并占内存。大量数据应在**Node 环境**评估官方 streaming writer，遵守其不等价于浏览器 writer 的限制。浏览器端不应一次渲染或导出几十万行，不能随意在主线程创建大内存工作簿。

## 反例与修正
1. 误以为 ExcelJS 计算公式：`{formula,result}` 是缓存，不是求值器；由Excel打开重算或服务端引入专门公式引擎。
2. 不可信单元格以 `=HYPERLINK(...)` 开头：导出前转为字面文本，避免表格公式注入。
3. 将导入文件未经大小/结构约束直接 `xlsx.load`：本示例只加载自己刚产生的 bytes；产品须限制大小、ZIP膨胀、Sheet数量及样式。
4. 流式与 `writeBuffer` 混用：浏览器/Node分别验证支持范围，海量写入只在隔离服务中执行并施加预算。

## 跨库组合与学习练习
F03 Papa Parse 解析外部 CSV，F04 生成规范 XLSX，F02 react-dropzone 负责选择文件；不要把文件选择当上传成功。练习：加入动态列和多工作表，并独立核验式缓存；再模拟恶意字段和非法数字，预期拒绝写入。

## 来源与验证
ExcelJS 4.4.0/MIT：<https://github.com/exceljs/exceljs>。真实源码位于 `examples/core.mjs`，复现入口是 `examples/basic.mjs` 等。本次未运行目标SDK、构建或浏览器，不得引用历史研究PASS。

## 增量数据约束（EF wave11）

共享 `examples/row-policy.mjs` 将校验放在 `new ExcelJS.Workbook()` **之前**：拒绝不存在/非字符串/空白或包含控制字符的来源，拒绝空ID及忽略大小写与两侧空格后重复ID；`reads/stars` 每项和总和都必须是非负安全整数，避免Excel公式缓存落入超过JavaScript安全整数范围的数。`safeSpreadsheetText` 仅接受字符串，trim后再对 `= + - @` 做字面量前缀保护。调用方不可绕过checkRows直接写不可信业务行。

离线运行 `node --test packages/library-lab/entries/F04-exceljs/examples/row-policy.test.mjs` 仅验证纯数据契约；真实ExcelJS读写还要执行 `examples/verify.mjs` 并真实安装依赖。不要从前者推断 XLSX 序列化已验收。
