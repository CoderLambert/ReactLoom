# F03 Papa Parse — 工程手册

## 适用

带引号和换行的 CSV 导入、导出。不是 xlsx，也不抓远程文件。

## 版本

`papaparse@5.7.0`，MIT。`header: true`，`skipEmptyLines: 'greedy'`，`dynamicTyping: false`，`escapeFormulae: true`。

## 迁移

带走 `examples/report.mjs`、`examples/policy.mjs` 和两边的 `.d.mts`。UI 只调用 `reportCSV`。表头保持 `title,url,note`。文件上限 256 000 字节，文本框 15 000 字符。不要打开 `download: true`。

## 不可删的清理

选文件、编辑、解析、重置、卸载都增加 generation。超限时先清空 input。`renamedHeaders` 非空或不可恢复的解析错误整批拒绝。只 unparse 已接受行。URL 去掉 fragment 和凭据，仅 https。

## 反例

- `split(',')` 或 `split('\\n')`。
- `dynamicTyping: true` 处理 id。
- 忽略重复表头。
- 只做 HTML 转义就交给 Excel。
- `Papa.parse(url, { download: true })`。
- 未闭合引号仍导入前面的行。
- 把客户端 URL 规范化当成 SSRF 防护。
- 上传用户表格或把密钥放进夹具。

## 测试断言

- 逗号、`""` 和单元格换行得到一条记录。
- `=2+3` 导出后带撇号前缀。
- 多余列、重复表头、未闭合引号不进入 `accepted`。
- ftp、带用户信息的 URL、重复 https 被拒绝。
- `policy.test.mjs` 不 import Papa；`node-scenarios.test.mjs` 才加载 SDK。

## 真实限制

页面不上传。256 KB 不是 Papa 的上限。没有 Worker 分块。标准示例不探测编码，非 UTF-8 要另做转换。公式前缀不是宏安全的全部。文本框上限 15 000 字符，和文件上限不是同一个数。

## 证据

本地跑过测试也不等于 verification PASS。收据要落在 `docs/library-lab/evidence/runs/`。Actions 41779873259 不是 F03 的单项验收。

`policy.test.mjs` 与 `node-scenarios.test.mjs` 要分开记录。只有后者加载 Papa。
