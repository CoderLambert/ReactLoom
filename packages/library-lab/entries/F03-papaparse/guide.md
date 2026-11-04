# Papa Parse 5.7.0｜引号、表头、HTTPS 和公式前缀

Lab 锁定 `papaparse@5.7.0`（MIT）。类型包 `@types/papaparse` 若需要，跟 DefinitelyTyped 走，不改变运行时版本。它解析和生成 CSV。它不是工作簿，也不抓取 URL。

包已在锁文件中。没有 `docs/library-lab/evidence/runs/` 收据时 sdk、build、browser 保持 NOT_RUN。Actions 41779873259 是仓库级结果（安装、类型检查、构建、52 个 SDK 文件 / 153 项测试、45 项 Playwright），不是本条目 PASS。

## Lab 当前示例

执行种类是 `react`。显式启动后挂载 [`examples/demo.tsx`](examples/demo.tsx) → [`examples/example.tsx`](examples/example.tsx)。解析函数是 [`examples/report.mjs`](examples/report.mjs) 的 `reportCSV`，UI 和 Node 套件共用它。

| 文件 | 作用 |
| --- | --- |
| `examples/example.tsx` | 三份本地夹具、256 000 字节文件上限、15 000 字符文本框 |
| `examples/report.mjs` | `Papa.parse` / `Papa.unparse`，表头失败则不导入行 |
| `examples/policy.mjs` | 表头必须是 `title,url,note`；HTTPS、去重、长度 |
| `tests/node-scenarios.test.mjs` | 直接 import `papaparse` 和 `reportCSV` |
| `tests/policy.test.mjs` | 不加载 Papa 的纯契约 |

`header: true`，`skipEmptyLines: 'greedy'`，`dynamicTyping: false`。导出只包含已接受的行，`escapeFormulae: true`，列顺序固定。

文本框和本地文件都停在页面里。没有上传，也没有 `download: true` 那种远程拉取。旧指南里的 Worker 分块是生产教学，本页没有挂 `worker: true`。

## 1. 什么时候用

运营表格、RSS 清单、需要保留引号和单元格内换行的 CSV。要样式、多表、公式求值时看 F04 ExcelJS 或 F05，不要把 CSV 装成 xlsx。

选文件的交互可以交给 F02。Papa 不负责拖放，也不负责把文件存进对象存储。

## 2. 模型

```text
字符串或 File.text()
  → 去掉开头的 U+FEFF
  → Papa.parse
  → 表头 / 不可恢复错误？整批拒绝
  → 列数不对的行单独拒绝
  → normalizeFeed
  → Papa.unparse({ escapeFormulae: true })
```

`meta.fields` 必须恰好是 `title`、`url`、`note`，顺序一致。`meta.renamedHeaders` 只要非空就拒绝：重复表头会被 Papa 改名，不能静默导入。

`TooManyFields` / `TooFewFields` 且行号可信时，只拒绝那一行，并看 `__parsed_extra`。其它解析错误整批拒绝，避免半截坏文件进库。

`normalizeFeed` 去掉首尾空白。title ≤ 160，url ≤ 2048，note ≤ 2000。note 允许换行，其它字段拒绝控制字符。URL 必须是无用户名密码的 `https:`，比较前丢掉 fragment。重复用规范化后的 `href`。这不是服务端抓取防护：没有内网地址判断，也没有跟随重定向。

generation 在输入、选文件、解析、重置、卸载时增加。超限文件会先把 `<input value>` 清掉，同一文件还能再选。

## 3. 三层

### 基本

夹具是一行带逗号的标题、转义引号，以及单元格里的换行：

```text
title,url,note
"React, Loom",https://example.org/feeds,"带引号 ""文本"" 和
下一行"
```

点「解析并校验」后看通过条数、拒绝原因和转义后的 CSV。不要用 `split(',')` 对照。

### 业务

夹具含重复的 `https://example.org/rss` 和 `ftp://`。通过的只有合法且未重复的 HTTPS。也可以选本地 `.csv`，大于 256 000 字节直接提示，并说明更大的文件要另做 step/chunk 和 Worker。本页没有实现那条路径。

### 进阶

夹具含 `=2+3`、一条合法行，以及「too,many,cells」。公式行若通过校验，导出里应出现 Papa 加上的前缀。多出来的列进入拒绝，而不是塞进 note。文案写明：HTML 转义不能代替 CSV 公式防护。

## 4. 反例

### 反例 1：手写分割

```ts
rows = text.split('\n').map((line) => line.split(','))
```

引号里的逗号和换行会裂开。用 `Papa.parse`。

### 反例 2：打开 dynamicTyping

```ts
Papa.parse(csv, { header: true, dynamicTyping: true })
```

邮编、前导零和超过安全整数的 id 会被改掉。本页保持 false，再按字段做校验。

### 反例 3：重复表头照单全收

`title,url,title` 会进 `renamedHeaders`。不检查它，后一列会换名字混进来。`validateHeaders` 直接抛错，整批不导入。

### 反例 4：只做 HTML 转义

```ts
cell.replaceAll('<', '&lt;')
```

Excel 仍会把 `=HYPERLINK(...)` 当公式。导出用 `escapeFormulae: true`。导入时不要把已经加过撇号的文本再当成原始公式。

### 反例 5：远程 URL 选项

```ts
Papa.parse('https://example.com/users.csv', { download: true })
```

那会让浏览器去拉取。Lab 只解析手头的字符串。抓取属于后端，并要处理重定向和内网地址。

### 反例 6：坏引号仍导入前几行

未闭合引号是不可恢复错误。`reportCSV` 在这种情况下 `accepted` 为空。不要展示「已导入一部分」。

### 反例 7：File.text 回写

选了大文件又立刻改文本框时，晚到的 `file.text()` 不能覆盖用户正在改的内容。代号不对就返回。

## 5. 组合

**react-dropzone**：它给 `File`。Papa 给记录。两边的大小上限要说清楚：dropzone 示例和这里的 256 000 字节不是同一个数。

**ExcelJS**：CSV 清洗之后，需要样式和 SUM 缓存时再生成 xlsx。不要让 Papa 去画冻结表头。

**Zod**：`normalizeFeed` 是本地规则。产品可以把同样的字段放进 schema，但不要用 Papa 的 `dynamicTyping` 代替 schema。

## 6. 清单

- 表头严格三列，拒绝改名。
- 只导出 `accepted`，并打开 `escapeFormulae`。
- 非列数类解析错误整批失败。
- 文件输入在读取前清空，卸载时增加 generation。
- 预览用文本节点，不用 `innerHTML`。
- 不把规范化 URL 当成允许服务器去请求。
- 不上传带密钥的表格。夹具全是 example.org。

## 7. 升级

5.7 的 `skipEmptyLines: 'greedy'` 和 `escapeFormulae` 按当前文档使用。升级 minor 时重跑 `tests/node-scenarios.test.mjs`，因为引号和错误码是行为合同。不要把 v4 的回调风格混进这段同步 `Papa.parse`。

大文件的 `worker: true` 还要看打包和 CSP。本页没有打开它，升级文档不能写成「已经在 Worker 里跑过」。

## 8. 验收

```bash
node --test packages/library-lab/entries/F03-papaparse/tests/node-scenarios.test.mjs
node --test packages/library-lab/entries/F03-papaparse/tests/policy.test.mjs
```

前者会加载 Papa，但没有写入收据之前，verification 里的 sdk 仍是 NOT_RUN。后者完全不加载 SDK。浏览器还要看：夹具解析、本地文件超限后能重选、公式导出、坏行文案。仓库绿标不能抄过来。

## 9. 故障对照

| 现象 | 先看 |
| --- | --- |
| 逗号把标题拆开 | 用了 `split`，没有走 `Papa.parse` |
| 表头看起来对却整批拒绝 | `renamedHeaders` 非空，或列顺序不是 title,url,note |
| 只有半行进了 accepted | 不可恢复错误的分支被删了。未闭合引号必须整批空 |
| 备注里的换行丢了 | 策略对 note 允许换行，title 和 url 不允许控制字符 |
| 同一文件不能再选 | input 没有在读取前清空 |
| 文本框被刚刚的文件覆盖 | generation 在手动输入时没有增加 |
| 导出仍以 `=` 开头 | `unparse` 没有 `escapeFormulae: true`，或导出了未接受的行 |
| 256 KB 以上没进度 | 本页直接拒绝。step/chunk 与 Worker 没有挂载 |

编码：夹具按 UTF-8。文件开头的 U+FEFF 会先去掉。其它编码要在进 `reportCSV` 之前转换，不要开 `dynamicTyping` 来「碰运气」。

可访问性：错误用 `role="alert"`，计数用 `role="status"`。结果是 `<pre>` 文本，不是 HTML。移动端文件选择走同一 input，不假设有拖放。

## 10. 资料

- https://www.papaparse.com/docs
- https://github.com/mholt/PapaParse
- https://github.com/mholt/PapaParse/releases
