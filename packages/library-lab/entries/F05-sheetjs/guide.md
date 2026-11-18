# SheetJS CE：把订阅记录交成一份可回读的工作簿

后台有一组 `{ channel, views, kind }` 订阅记录，运营希望拿到 Excel 文件；稍后还要把按约定填写的单表导回系统。SheetJS CE 负责把 JavaScript 数据与表格文件互相转换。它适合处理多种表格格式、读取单元格和生成数据报表；只处理 CSV 时可先考虑 [Papa Parse](../F03-papaparse/guide.md)，需要细致的 XLSX 样式对象模型时再比较 [ExcelJS](../F04-exceljs/guide.md)。

本例固定 `xlsx` **0.20.3**，使用原创订阅 fixture，不连接真实 NewsHub 或任何服务。三个实验全部在 Node 中调用真实 SDK，页面提供源码与复现命令。运行会在本条目 `.artifacts/` 生成 XLSX 和回读 JSON；没有网页假终端、自动上传或浏览器下载。

## 先看数据怎样变成文件

```text
业务行数组 → worksheet（A1、B2、!ref）
          → workbook（SheetNames、Sheets）
          → XLSX字节（ZIP容器）
          → workbook → worksheet → 回读行数组 → 业务验证
```

| 对象 | 本例中的含义 | 创建或读取它的 API |
| --- | --- | --- |
| 行数组 | 一条订阅一个对象；views 必须是非负安全整数 | 自建 `normalize` |
| worksheet | 单元格地址映射；A1 是表头，B2 是第一个计数，`!ref` 是使用范围 | `utils.json_to_sheet` |
| workbook | 有序表名 `SheetNames` 与按名取表的 `Sheets` | `utils.book_new`、`utils.book_append_sheet` |
| 文件字节 | 真正的 XLSX ZIP 内容，不是 JSON 改扩展名 | `write(..., { bookType: 'xlsx', type: 'buffer' })` |
| 回读结果 | `read` 先解析容器，`sheet_to_json` 再把一张表变成数组 | `read`、`utils.sheet_to_json` |

单元格的 `t` 是类型、`v` 是值，`f` 是公式表达式。`{ t: 'n', v: 128 }` 与 `{ t: 's', v: '128' }` 在业务里不同。SDK 不知道什么是合法频道，也不会替你检查重复订阅；字段约束、分类和汇总都由本例 JavaScript 实现。

### 最小接入

下面是 [core.mjs](examples/core.mjs) 中流水线的关键调用；完整文件还保留了输入、ZIP 和表格结构边界。

```js
import * as XLSX from 'xlsx'

const rows = [{ channel: 'Frontend', views: 128, kind: 'RSS' }]
const sheet = XLSX.utils.json_to_sheet(rows, {
  header: ['channel', 'views', 'kind'],
})
const book = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(book, sheet, 'Subscriptions')
const bytes = XLSX.write(book, {
  bookType: 'xlsx',
  type: 'buffer',
  compression: true,
})
const restored = XLSX.read(bytes, { type: 'buffer', cellFormula: true })
const matrix = XLSX.utils.sheet_to_json(restored.Sheets.Subscriptions, {
  header: 1,
  raw: true,
  defval: null,
  blankrows: true,
})
```

`header` 指定导出列顺序，**不等于字段白名单**；本例先通过 `normalize` 拒绝缺列和额外属性，再转换成 sheet，并传入新的 header 数组。回读用 `header: 1` 获得二维数组，先检查原始表头，再映射字段；不能直接拿默认对象结果丢掉未知列。`raw: true` 保留数值，`defval: null` 使缺值进入验证，`blankrows: true` 保留中间空行以便拒绝，而不是悄悄吞掉它们。

## 在当前仓库运行

前提：仓库依赖已经安装，Lab 要求 Node ≥22.18、pnpm 10。当前 package/lockfile 固定官方 CDN tarball，独立迁移项目可显式安装：

```sh
pnpm add https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
```

这里不修改工作区公共依赖。官方 [Node 安装说明](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/) 将 CDN 作为模块发行来源，并说明公共 npm registry 的 `xlsx` 版本滞后；不要把无版本 `pnpm add xlsx` 当成安装本例版本。

以下命令的 **cwd 都是仓库内 `packages/library-lab`**：

```sh
node entries/F05-sheetjs/examples/basic.mjs
node entries/F05-sheetjs/examples/business.mjs
node entries/F05-sheetjs/examples/advanced.mjs
node entries/F05-sheetjs/examples/verify.mjs
```

每个场景成功时退出 0；断言或解析失败时非零退出。前三个命令把输出保存在 `entries/F05-sheetjs/.artifacts/<场景>.xlsx` 和同名 `.json`，重复执行只覆盖这些原创 fixture 产物。`verify.mjs` 执行固定的真实 SDK 套件，不调用 shell、不运行构建、不执行任意路径。

## 实验一：单表往返，检查类型和行值

**问题**：文件写出来了，字段顺序、中文和计数是否还在？

**操作**：执行 `basic.mjs`，然后查看终端 JSON 或 `.artifacts/basic.json`。关键源码是 [basic.mjs](examples/basic.mjs) 和 [core.mjs](examples/core.mjs)。

**可观察结果**：表名为 `Subscriptions`，范围 `A1:C4`；回读 `A2` 是字符串 `Frontend`，`B2` 是数值 `128`；三条记录与输入深度相等。`artifact` 给出真实字节数和 SHA-256。修改 fixture 中的 views 后重跑，可以看到数值及文件摘要随输入变化；不要求文件摘要在不同 SDK 版本间保持一致。

本轮真实执行得到 8,851 字节 XLSX。这个数字是本地 fixture 产物大小，不是线上性能指标。输出文件可交给人查看；本轮没有在 Excel 或 LibreOffice 中人工打开验收。

## 实验二：一个工作簿，多张分类表

**问题**：运营要汇总页，还要按类别分别查看明细。只换几条单表数据不能解释这个需求。

**操作**：执行 `business.mjs`，检查 `.artifacts/business.json` 的 `sheetNames`、`summary` 与 `categories`；源码见 [category-report.mjs](examples/category-report.mjs)、[business.mjs](examples/business.mjs)。

`createCategoryReport` 先用 Map 按 kind 分组，再用 JavaScript 计算 count/totalViews，最后创建一张 `Summary` 和三张 `Category-N`。表名用固定前缀加编号，避免把用户类别直接塞进有长度、重复名及非法字符限制的工作表名称。原类别作为 Summary 单元格保存。汇总若超过安全整数范围会拒绝，避免导出看似正确的错误数字。

**可观察结果**：4 条记录形成 `Summary / Category-1 / Category-2 / Category-3`；RSS 有 2 条、160 次访问，推荐为 63，专题为 27，总计 250。脚本重新读取真实 XLSX，逐张核对汇总和明细。本轮产物为 11,071 字节。

这些是写入的**静态计算值**；CE 没有在这里求值 SUM 公式。修改输入后必须重新生成报告。本例公共 `importWorkbook` 只接受单表订阅格式，故会拒绝这个多表报告；business 读取器只消费本次自己生成的 fixture，不是一个可直接接收任意报表的生产导入接口。

## 实验三：区分文本、公式与不合格工作簿

**问题**：用户输入 `=literal`，或上传一张含公式、空行、未知列的 XLSX，系统应怎样处理？

**操作**：执行 `advanced.mjs`，看 `.artifacts/advanced.json` 的 `literalCell` 和 9 项 `rejected`。源码见 [advanced.mjs](examples/advanced.mjs)、[invalid-workbooks.mjs](examples/invalid-workbooks.mjs)、[validation.mjs](examples/validation.mjs)。

**可观察结果**：以 `= / + / - / @` 起头的文本由本例保守加单引号，真实写出并回读后 `t` 为 `s`、`f` 不存在；例如值是 `'=literal-0`。120字符上限检查的是加单引号后的最终字符串：普通文本最多120字符，公式前缀原文最多119字符；超出时在创建工作簿前拒绝。这个单引号属于本例返回的字符串，不是 SheetJS 自动做的公式净化，也不证明另存为 CSV 后在所有桌面软件里都安全。

另一路径用真实 SheetJS 创建 9 份 XLSX 字节：缺列、额外列、错误表头、大小写重复频道、负计数、中间空行、201 条数据、含 `f` 的公式单元格、多张工作表。每份都实际经过 `importWorkbook` 并记录具体拒绝原因；不是只给 `normalize` 一个无效 JSON。

导入顺序是：ZIP 目录预检 → `read` → 表数量/范围/公式检查 → 二维表头检查 → 每行 schema。`cellFormula: true` 用于看见并拒绝 `f/F`，不会执行公式。`sheetRows: 202` 限制本例物化的行数，且检查 `!fullref`，避免把被截断的 201 行文件误当合格；这不是解析器内存或 CPU 上限。

### 这里的边界有多窄

受限导入器接受：一个工作表、A1 起始、精确 `channel / views / kind` 三列、1–200 行、非空短文本、非负安全整数、大小写不重复频道。隐藏行列也不跳过，合并单元格、日期等通用 Excel 语义没有提供转换承诺。

[archive-policy.mjs](examples/archive-policy.mjs) 与 [zip-entry-policy.mjs](examples/zip-entry-policy.mjs) 是本例自建的保守 ZIP 策略：输入最多 2,000,000 字节、80 项文件、单项声明 4,000,000 字节、总声明解压 8,000,000 字节、声明压缩比不超过 200；核对本地和中央目录元数据，拒绝 ZIP64、多磁盘、加密、data descriptor、危险路径、宏及部分活动内容。它可能拒绝其他软件生成的合法 XLSX，不是 SheetJS 的格式限制。

声明长度仍可能被伪造；预检不限制真实 inflate 或 XML 解析的资源，也不等于杀毒。生产接收不可信工作簿时，要在可终止且有 CPU/内存/超时限制的进程中解析，并按照业务 schema 验证结果。本例是离线原创 fixture 实验，未实现该生产隔离服务。不要把同一个同步调用直接搬到 React 点击处理器里解析未知大文件。

## 迁入 React 项目时保留什么

- 单表转换复制 `core.mjs / validation.mjs / archive-policy.mjs / zip-entry-policy.mjs`，保持相对路径并固定 `xlsx@0.20.3` 的已审查发行来源。
- 分类报告额外复制 `category-report.mjs`，换自己的行数据；分组、数值精度和工作表命名仍归业务代码所有。
- CLI 复现额外保留场景脚本、`artifacts.mjs`、`invalid-workbooks.mjs`、`verify.mjs` 和 `tests/sdk.test.mjs`。`artifacts.mjs` 是 Node 文件输出适配，不应随浏览器 bundle 导入。
- 框架无关转换层与 React 状态分开。浏览器中使用 Uint8Array/ArrayBuffer 和受控下载适配；这个 Node 示例的 `type: 'buffer'` 与文件写入不能不改就照搬。任何对象 URL 由创建它的下载层释放。

## 官方资料与验证范围

[官方 README 原文](official/readme.md) 固定于 `v0.20.3` 对应提交 `8a7cfd47bde8258c0d91df6a737bf0136699cdf8`，英文，保留原始字节。该 ref 根目录只有 `README.md`，未发现官方中文 README。通过公开 forge raw/contents API 实际取得原文，并与已安装 0.20.3 包内 README 核对相同；来源和响应保存在 `official/`。网页形式的 canonical 原文入口当前会跳到登录页，API 无需登录可读。

[官网](https://sheetjs.com/) 本轮 HTTP GET 返回 200，未见禁止嵌入的响应头；没有从实际 Lab origin 做浏览器确认，官网页签状态是 **unknown**，保留直达入口。Apache-2.0 是 CE 代码许可；公式求值、复杂模板和高级样式等 Pro 能力不能由本实验推定免费可用。

本轮三条 CLI、真实 SDK 套件及纯策略测试的命令、退出码、原始日志和产物见 [local-validation.md](local-validation.md)。这些是本地执行证据；`verification.json` 的正式 sdk/build/browser 保持 NOT_RUN，不能用 dirty 工作区日志替代绑定提交和指纹的正式收据。
