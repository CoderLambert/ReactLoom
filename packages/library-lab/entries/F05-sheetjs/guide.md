# F05 SheetJS CE 0.20.3 — 工作簿导入/导出与供应链

## 重要：资料来源说明
该条目历史原始 GUIDE/SOURCE/DEMO ZIP 缺失，仅有 Slack 摘要；本目录根据 SheetJS 当前官方文档**重新编写**，不宣称恢复了研究原件，也不使用旧研究的 PASS 记录。

## 安装（不要误用 npm 旧版本）
官方 **cdn.sheetjs.com** 才是 CE 0.20.3 的软件发行渠道，公共 npm 的 `xlsx` 包可能停留在旧版本。独立复现：
```bash
pnpm add https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
node packages/library-lab/entries/F05-sheetjs/examples/basic.mjs
node packages/library-lab/entries/F05-sheetjs/examples/business.mjs
node packages/library-lab/entries/F05-sheetjs/examples/advanced.mjs
node packages/library-lab/entries/F05-sheetjs/examples/verify.mjs
```
不要自动修改公共 package.json；PLATFORM 核对来源/校验值、vendor 方案、许可及 lockfile 后统一安装。不得从不可信 CDN 任意执行脚本。

## 运行源码
`examples/core.mjs` 导入真实 `xlsx`：`utils.json_to_sheet`、`book_new`、`book_append_sheet`、`write`、`read` 和 `sheet_to_json`。三层脚本输入与输出来自真实 SDK，**不创建网页假终端**，不写磁盘上的个人文件。
- 入门：三条原创订阅记录在 XLSX Buffer 往返。
- 业务：两个 NewsHub 类别数据导出并回读，计算访问量总和。
- 进阶：对公式起始字符做保守转义，拒绝负数/非整数/重复字段；对 Buffer 大小做约束。CLI 期望输出由实际执行得出，不预造 JSON 报告。

## 生产风险
1. CSV/XLSX 公式注入：单纯 `json_to_sheet` 不等于安全过滤；所有不可信文本必须保守转义，且需用实际 Excel/LibreOffice 验证各格式。
2. ZIP 炸弹/超大表格：只看输入 Buffer 长度不代表解压后资源安全；生产必须隔离 Worker/服务器、限制膨胀倍数、Sheet/行/列/CPU预算。
3. 混淆 CE 与 Pro：CE 基础导入导出可用，复杂样式/模板/公式求值不是可免费假设的能力。
4. 导入后字段类型不稳定：明确 schema，拒绝空行、重复ID、无效数字、日期序号与二义时区。
5. 滥用 `writeFile`：浏览器端下载有权限/手势限制；这个 Node 演示坚持只在内存中工作。

## 何时改用其它库
F04 ExcelJS 更侧重 XLSX 样式/对象模型；F03 Papa Parse 更适合纯 CSV；F02 react-dropzone 只是文件选择，并不做解析或上传。跨库组合应有明确输入/输出 Schema，不通过任意 XLSX 执行公式。

## 执行证据
本轮提交源码但当前没有真正解析 SheetJS 官方包并运行 `verify.mjs`。SDK/CLI NOT_RUN，完整构建 BLOCKED。只有实际执行后才能更新证据。Apache-2.0 CE。官方 https://docs.sheetjs.com/docs/getting-started/installation/frameworks/ 。
