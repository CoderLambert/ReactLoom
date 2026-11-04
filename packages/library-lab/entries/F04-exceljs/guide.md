# ExcelJS 4.4.0｜内存里的工作簿、冻结表头和公式缓存

Lab 锁定 `exceljs@4.4.0`（MIT）。它能写出 xlsx 的样式、冻结窗格和公式字符串。它不算这些公式。`result` 只是预先放进去的缓存，Excel 打开后可能重算。

执行种类是 `node-ci`。Demo 页只展示命令，不在浏览器里启动进程。纯策略测试不是 SDK PASS。

包已在锁文件中。没有 `docs/library-lab/evidence/runs/` 收据时 sdk、build、browser 保持 NOT_RUN。Actions 41779873259 是仓库级安装、类型检查、构建、52 个 SDK 文件 / 153 项测试和 45 项 Playwright，不是本条目 PASS。

## Lab 当前示例

| 文件 | 作用 |
| --- | --- |
| `examples/core.mjs` | `Workbook`、冻结首行、样式、SUM 缓存、`writeBuffer` / `load` |
| `examples/row-policy.mjs` | 在 `new Workbook()` 之前检查行、整数和公式前缀 |
| `examples/basic.mjs` | 固定调用 `generateWorkbook('basic')` |
| `examples/business.mjs` | 同样三行夹具，带 TOTAL |
| `examples/advanced.mjs` | 把 `=HYPERLINK(...)` 写成字面量，并拒绝 NaN |
| `examples/verify.mjs` | 三个 level 的往返断言 |
| `examples/row-policy.test.mjs` | 不加载 ExcelJS |

页面上的复现命令会带上 level 参数，例如：

```bash
node entries/F04-exceljs/examples/basic.mjs basic
```

脚本不读 `argv`。场景写死在各自文件里。多出来的参数没有效果。`verify.mjs` 不在三个 Demo 的入口上，需要的话在 `packages/library-lab` 下单独执行。

全部读写都是内存 `Buffer`。不往用户磁盘写 xlsx，也不要在指南里要求提交真实报表。

流式 writer 和浏览器里打开文件是生产教学，本页没有挂载。

## 1. 什么时候用

要冻结表头、填充色、多列数字和一份可打开的 xlsx。纯文本交换用 F03。更广的表格格式要同时看 F05 的许可和能力，本页不比较「谁更强」，只说明 ExcelJS 这条路径做什么。

不要用它当公式引擎，也不要在主线程上一次性序列化几十万行。

## 2. 模型

`checkRows` 先跑。通过之后才 `new ExcelJS.Workbook()`。创建者是 `ReactLoom Library Lab`，`created` 固定为 `2026-10-27T00:00:00Z`，避免每次生成都改元数据。

工作表名 `Sources`。视图 `state: 'frozen', ySplit: 1`。列是 Source ID、Source、Reads、Stars。表头白字，填充 `FF275B49`。

夹具三行：React Updates 52/5，Engineering Notes 38/8，Security Weekly 25/4。合计 115 和 17。

basic 不写 TOTAL。business 和 advanced 在数据下一行写 `SUM(C2:C{n})` 和 `SUM(D2:D{n})`，`result` 来自前面加总，不是 ExcelJS 算出来的。

`safeSpreadsheetText` 要求非空字符串、trim 后不超过 160、无控制字符。若以 `=` `+` `-` `@` 开头，前面加 `'`。

整数上限是 `999_999_999_999_999`。Excel 大约 15 位有效数字，`Number.isSafeInteger` 比这个宽，所以合计超过该上限就拒绝，不能在缓存上标成精确值。

`inspectWorkbook` 只读自己刚写的字节：行数、B2、最后一行 C 列、是否冻结。

## 3. 三层

### 基本

`generateWorkbook('basic')` 后立刻 `load`。日志里有字节长度、合计和 `frozen: true`。没有 SUM 单元格。首个来源应是 `React Updates`。

### 业务

同一夹具加上 TOTAL。`summary.formula` 应为 `SUM(C2:C4)`，`summary.result` 为 115。这仍是缓存。

### 进阶

在夹具后追加一行，来源文本是 `=HYPERLINK("https://example.invalid","click")`。读回 B5 应是带撇号的字面量，而不是公式对象。`reads: NaN` 必须在创建工作簿之前失败。`verify.mjs` 还拒绝 `Infinity`、非字符串来源、忽略大小写和空格后重复的 id，以及超过 Excel 整数上限的合计。

## 4. 反例

### 反例 1：把 result 当成求值

```js
sheet.getCell('C5').value = { formula: 'SUM(C2:C4)' }
```

不写 `result` 时，未打开 Excel 的读回可能没有数字。写了 `result` 也只是缓存。要在 Excel 或单独的计算引擎里重算，并接受 15 位有效数字。

### 反例 2：不可信文本直接进单元格

```js
sheet.addRow({ name: userText })
```

`=HYPERLINK(...)` 或 `@SUM` 会在表格软件里执行。先走 `safeSpreadsheetText`。调用方不能绕过 `checkRows`。

### 反例 3：无上限地 load 用户文件

```js
await workbook.xlsx.load(await request.arrayBuffer())
```

本示例只 load 自己 `writeBuffer` 的字节。产品要限制大小、工作表数量、样式和压缩展开后的体积。不要为了演示去读用户上传的 xlsx。

### 反例 4：在浏览器里套 Node 流式 API

官方 streaming writer 是 Node 路径，和 `writeBuffer` 不是同一个内存模型。Lab 页面不会启动它。海量导出放在有配额的服务里，而不是 Demo 页。

### 反例 5：用 JS 安全整数冒充 Excel 精度

```js
if (Number.isSafeInteger(total)) sheet.getCell('C9').value = { formula, result: total }
```

超过 15 位有效数字时，打开文件后的 SUM 可能和缓存不一致。`MAX_EXCEL_INTEGER` 要留在写工作簿之前。

## 5. 组合

**Papa Parse**：外部 CSV 先解析、做公式前缀和类型检查，再把干净的行交给 `generateWorkbook`。不要把 Papa 的字符串合计写进 `result` 却不经过 `checkRows`。

**react-dropzone**：选择文件不等于这张表已经生成。本条目没有文件选择 UI。

**报表下载**：字节可以从服务端返回。不要把生成好的 xlsx 和密钥一起提交进仓库。

## 6. 清单

- 行数 1–500，id 去空格、按 en-US 小写去重。
- reads/stars 为非负安全整数，合计不超过 15 位上限。
- 文本先 trim，再决定是否加撇号。
- basic 没有公式；另外两层的 formula 与 result 成对出现。
- 只 load 自己写出的 buffer。
- 页面命令多出来的 level 参数可以忽略，以脚本内的字符串为准。
- 策略测试通过后，仍要跑会 import ExcelJS 的 `verify.mjs` 才能谈论 SDK。没有收据就保持 NOT_RUN。

## 7. 升级

4.4.0 的 `writeBuffer` / `xlsx.load` 是这条示例的合同。升级时重跑 `verify.mjs`，核对冻结视图和公式对象的形状是否还是 `{ formula, result }`。不要把社区 fork 的 API 写进本页。

流式 API 和浏览器构建要单独核对文档。本仓库没有把它们挂进 Demo。

## 8. 验收

策略：

```bash
node --test packages/library-lab/entries/F04-exceljs/examples/row-policy.test.mjs
```

会加载 SDK 的入口是 `examples/verify.mjs` 和三个场景脚本。页面展示它们，并不执行。退出码和日志要记成收据之后，才能改 verification。browser 对本条目没有挂载的画布，保持 NOT_RUN，不要用「没有浏览器」写成 FAIL。

## 9. 资料

- https://github.com/exceljs/exceljs
- https://www.npmjs.com/package/exceljs/v/4.4.0
- https://support.microsoft.com/en-us/office/change-formula-recalculation-iteration-or-precision-in-excel
