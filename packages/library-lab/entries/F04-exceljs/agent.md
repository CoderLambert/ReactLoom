# F04 ExcelJS — 工程手册

## 适用

要样式、冻结表头和一份内存 xlsx。CSV 用 F03。不要把它当公式计算器。

## 版本

`exceljs@4.4.0`，MIT。API 是 `Workbook`、`addWorksheet`、`xlsx.writeBuffer`、`xlsx.load`。

## 迁移

带走 `examples/core.mjs` 和 `examples/row-policy.mjs`。三个场景脚本只选 level。`checkRows` 必须在 `new ExcelJS.Workbook()` 之前。不要把流式 writer 或浏览器大文件路径一起抄走，除非产品单独验证。

页面命令形如 `node entries/F04-exceljs/examples/basic.mjs basic`。脚本忽略多余参数。

## 不可删的清理

文本必须以字符串进入 `safeSpreadsheetText`，`= + - @` 加撇号。id 按 trim + en-US 小写去重。reads/stars 单项和合计都是非负整数，合计不超过 `999_999_999_999_999`。只 load 刚写出的字节。不写用户磁盘。

## 反例

- 省略 `result` 或把 `result` 说成已求值。
- 用户字符串直接 `addRow`。
- 无上限 `xlsx.load` 外部文件。
- 在浏览器 Demo 里调用 Node streaming writer。
- 用 `Number.isSafeInteger` 代替 15 位有效数字上限。
- 绕过 `checkRows` 写行。
- 把策略单测写成 SDK PASS。

## 测试断言

- 三层都冻结，B2 为 `React Updates`。
- business/advanced 的 C 列公式是 `SUM(C2:C4)`，缓存 115。
- HYPERLINK 文本读回为带撇号的字符串。
- NaN、Infinity、非字符串、重复 id、过大合计在创建工作簿前拒绝。
- `row-policy.test.mjs` 不 import exceljs。

## 真实限制

网页不启动 Node。公式不会在库内重算。夹具只有三行加一条恶意文本。没有中文字体或打印版式验收。

## 证据

sdk 收据只能来自真实执行 ExcelJS 的命令，并且写进 `docs/library-lab/evidence/runs/`。Actions 41779873259 不是 F04 PASS。browser 保持 NOT_RUN。
