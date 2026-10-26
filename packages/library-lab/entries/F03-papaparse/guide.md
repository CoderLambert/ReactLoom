# Papa Parse：CSV 导入、字段校验与安全导出

## 适用范围

Papa Parse 处理 CSV 文本/文件/Stream，理解引号转义、逗号、多行文本以及编码元信息；它**不是 XLSX 编辑器**，也不承担网络上传或后端数据迁移。首选用于 RSS 导入清单、运营表格的 CSV 入口、管理后台的 CSV 预览与导出。需要 xlsx 单元格样式、公式计算、工作簿格式时比较 F04 ExcelJS 和 F05 SheetJS。

基线：`papaparse@5.7.0`、开发期 `@types/papaparse@5.5.2`（分属运行包与 DefinitelyTyped），MIT；本库按照官方文档独立重写，不继承历史模拟测试 PASS。

## 直接安装与导入

```bash
pnpm add papaparse@5.7.0
pnpm add -D @types/papaparse@5.5.2
```

```ts
import Papa from 'papaparse'
const parsed = Papa.parse<{title:string,url:string}>(
 'title,url\nReactLoom,https://example.org',
 {header:true,skipEmptyLines:'greedy',dynamicTyping:false}
)
if (parsed.errors.length) throw new Error(parsed.errors[0].message)
const safeCsv = Papa.unparse(parsed.data,{escapeFormulae:true})
```

示例真实完整实现见 `examples/example.tsx`；Node 目标 SDK 断言见 `tests/node-scenarios.test.mjs`。这个页面不会上传选择的 CSV，也不会使用远程下载参数。

## 三层案例

- **basic**：带逗号的标题、跨行备注、`""` 引号转义。直接观察 `result.data/errors`。
- **business**：从当前浏览器选择本地 CSV（最多 256KB），校验必填字段、HTTPS 协议、重复 URL 与无凭据策略；报错必须呈现用户可理解的行号，不要只提示解析成功。
- **advanced**：演示错误列数、恶意表格公式与 `Papa.unparse({escapeFormulae:true})`。导入并不等于批准；只有经过域模型校验的记录才能导出安全预览。

## 实际机制

解析结果含 `data`、`errors`、`meta`；`header:true` 将首行用作键名，重复表头会被自动改名并出现在 meta，不能假设所有字段总是唯一。默认 `dynamicTyping:false` 能避免订阅 ID、邮编、超长数字因类型转换而损坏。CSV 内容用纯文本呈现，不得用 innerHTML；导出到 Excel/表格客户端时需要针对以 =/+/-/@ 开头的公式做 CSV 注入防护。

## 工程边界

1. **文件来源**：本地 `File.text()` 处理少量样例；无法推断编码，非 UTF-8 数据需显式选择编码策略/转换器。
2. **大文件**：256KB 只是本 Demo 的界限，不是 Papa 上限。百万行应评估 step/chunk、背压、Worker 兼容性及 UI 虚拟化，不能只调 `worker:true` 后假设一切已经高性能。
3. **过期回写**：文件异步读取后核对 generation；卸载时使代次失效。重复读取同一文件须允许重新选择。
4. **错误行**：`meta.renamedHeaders`、字段多/少、引号不闭合等需向用户显示并允许修改；不能丢掉 ParserError。
5. **安全**：CSV 公式防护在每个导出路径执行；不允许上传带密钥的原始表格到第三方服务；相同 URL 规范化去重不等于 SSRF 安全，真正网络抓取在受保护的后端执行。
6. **取消**：浏览器大规模 step 解析可用 parser.abort，但必须查看官方不同输入类型的中止语义，不可将 `File.text()` 误写为可直接取消。

## 组合和反例

与 F02 react-dropzone 组合负责拖入/选择，但本地选择 ≠ 已上传。与 F04 ExcelJS 不同，不能给 CSV 增加字体、工作表或样式。错误：`input.split('\n').map(s=>s.split(','))` 无法处理引号/跨行；使用 Papa.parse。错误：`dynamicTyping:true` 无条件处理 ID；保留原始字符串做 schema 验证。错误：只净化 HTML 不处理 CSV 注入；开启 `escapeFormulae`。

## 验证

PLATFORM 安装依赖后：`node --test packages/library-lab/entries/F03-papaparse/tests/node-scenarios.test.mjs`；`pnpm --filter @reactloom/library-lab typecheck && pnpm --filter @reactloom/library-lab build`；E2E 检查本地文件、分隔文本、恶意公式、字段错误和重复选择。缺少实际执行日志时 sdk/browser 保持 NOT_RUN。

官方：[Docs](https://www.papaparse.com/docs) · [Releases](https://github.com/mholt/PapaParse/releases) · [GitHub](https://github.com/mholt/PapaParse)。
