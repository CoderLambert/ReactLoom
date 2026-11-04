# F04 ExcelJS — Agent 工程复用

**只在明确需要真正 XLSX、样式或公式存储时选用**；CSV 用 F03 Papa Parse。版本基线 `exceljs@4.4.0`，Node脚本，不把API示例部署为任意命令执行端点。

## 文件迁移
复制 `examples/core.mjs` 的输入校验、`generateWorkbook` 与 `inspectWorkbook` 到目标项目的报表层，调用端参考 `examples/business.mjs`。输入类型用目标业务 schema 限制，不能照搬RSS样例。不要复制展示日志代替Excel实际产物。

## 不可删除的边界
- **每个字段**校验类型、行数、文本长度及可识别的公式前缀。
- ExcelJS 不计算公式；公式 result 仅供缓存并应由产生方提供正确值。
- `writeBuffer/load` 内存随文件规模上涨；真正大报表改 streaming writer，并测试压缩包膨胀限制。
- 区分 Sheet 名、行列数、业务ID和样式继承；导出不可携带用户敏感信息。
- 禁止伪造“已完成计算”“已导出文件”，本示例是内存数据验证。

## 必要断言
`node entries/F04-exceljs/examples/verify.mjs`：真实调用ExcelJS，检查构造/往返、冻结表头、公式及缓存值、恶意前缀处理、非法数值拒绝。需要本地和CI安装依赖后运行；目前NOT_RUN，构建BLOCKED。

官方：<https://github.com/exceljs/exceljs>

## EF wave11 迁移约束

保留 `row-policy.mjs` 的严格文本/字段/总量检查，调用 `generateWorkbook` 前不能靠 `String(undefined)` 自动转成业务名称；ID 去重要求 trim+casefold，合计不能超过MAX_SAFE_INTEGER。应用展示与CLI共用该检查，不许为让示例通过而删除校验。`row-policy.test.mjs` 的无依赖测试PASS不等于ExcelJS SDK PASS。


EF wave23迁移注意：必须复制 `row-policy.mjs` 中的 `MAX_EXCEL_INTEGER`；勿把JS `Number.MAX_SAFE_INTEGER` 当作Excel无损上限。超出15位的大整数应转文本并单独设计合计策略；离线policy通过不代表ExcelJS/Excel公式真实验收。
