# Papa Parse 5.7.0：CSV结构、业务导入与公式前缀

需要保留逗号、双引号和跨行单元格的CSV解析/导出时选Papa Parse；不是XLS/XLSX、工作簿、宏扫描或公式求值。只选择文件看F02，工作簿看F04/F05。当前示例完全本地，不上传、不根据CSV里的URL抓取，不开启download或worker。

## 模型与三个目标

basic解析`"React, Loom"`及双引号/跨行note，观察实际一条结构化记录；business校验订阅源HTTPS与规范化去重，从文本或本地文件输入；advanced展示列数错误与公式前缀导出。三个level共用实际reportCSV，不另造演示解析器。切换level用key重建子树，加载新fixture并使旧读取失效。

输入→Papa.parse(header:true,skipEmptyLines:'greedy',dynamicTyping:false)→严格表头/结构错误→业务normalizeFeed→仅已接受行Papa.unparse。数值样式文本如00042保持字符串，避免ID或精度变化。默认分隔符检测由Papa负责，示例是逗号CSV；不是用split(',')或split换行。

表头必须严格title,url,note且顺序一致。5.7重复表头会自动改名，meta.renamedHeaders映射新名到旧名（如note_1:note）；非空即整批拒绝。TooManyFields/TooFewFields且行号可信只拒绝该条，__parsed_extra同样拒绝；MissingQuotes等其余错误整批拒绝，即使前面已有合法行也不部分导入。错误行号是解析记录索引+表头，不保证等于跨行原文物理行号。

业务字段trim后title≤160、url≤2048、note≤2000，单位为JS UTF-16码元；note允许CR/LF，其他控制字符拒绝。URL必须HTTPS且无用户名密码，规范化host/默认端口后去fragment，以href去重；凭据是拒绝不是删除后接受。不会抓取这些URL，不提供SSRF/ACL/DNS/重定向安全保证，也不把不同query视为重复。

## 文件与输出边界

手工textarea maxLength=15,000 UTF-16码元；这是输入控件预算，不是15KB。文件允许≤256,000原始字节，先检查Blob.size才arrayBuffer，再fatal UTF-8解码；非法编码拒绝而非用File.text静默替换。reportCSV对任何来源统一检查≤256,000 UTF-8编码字节，文件程序设定的textarea值可以超过手工maxLength。允许开头BOM，parser去除；不猜测GBK/UTF16，转换需另设计。内存全量解析仅适合该小预算，不宣称Papa本身只有这个上限。

新增文件先清input与旧report；读取成功/失败均检查generation。手工编辑、解析、重置、再次选择、level切换和卸载使旧结果无效。arrayBuffer不能被本例物理abort，epoch只抑制迟到回写；无Worker/计时器/对象URL/下载锚点需释放。解析失败清旧report，文件失败保留当前text以便手工纠正，并显示alert。

导出只包含accepted，固定列顺序，使用真实Papa.unparse的`escapeFormulae: /^[=+\-@\t\r]/`。5.7默认true内部正则有.*$且不跨行，可能漏掉以公式前缀开头并包含换行的note；自定义前缀正则保持= + - @ TAB CR集合且覆盖跨行。SDK会在匹配单元格前加撇号再CSV引用。trim会去字段首尾空白，业务策略本身不接受TAB控制；该导出策略仍保留SDK前缀范围。不是任意表格软件/再编辑重保存/宏/XLS安全证明。页面只显示React文本pre，不执行HTML或形成可点击URL，也没有真实文件下载动作。

## 完整迁入

```bash
pnpm add papaparse@5.7.0
```

复制五份实际必需文件并保持相对路径：example.tsx、report.mjs、report.d.mts、policy.mjs、policy.d.mts。React/ReactDOM/TypeScript及React类型由目标项目提供；ESM/TSX/Bundler解析，DOM/Blob/TextEncoder/TextDecoder/URL可用。两个声明文件已封装JS SDK边界，本组件不直接依赖@types/papaparse；应用自己直接import Papa时可另装该类型包。无需Provider/CSS/env/后端，demo.tsx只是Lab适配。

```tsx
import CSVExample from './example'
export default function Page() { return <CSVExample level="business" /> }
```

解析与政策分模块，report同源用于UI与真实SDK测试，policy不加载Papa。不要独自带走TSX而遗漏声明或helper。完整迁入strict编译记录见local-validation.md；复用现有安装，不等于全新安装验收。

## 操作与验证

basic点击解析，观察1条包含引号与换行的记录。business默认3条得到通过1/重复和ftp拒绝2；选择UTF8 CSV再解析。advanced通过2且多余列拒绝，导出=2+3应前缀撇号。可以输入重复表头/未闭引号，观察accepted为空；选256001bytes/非法UTF8应alert且清旧report。文本里的HTML仅文本，且不请求CSV URL。

真实NodeSDK测试加载实际papaparse与同源report；纯policy测试单独记数。validation/browser.spec.ts仅提案，真实文件控件/场景切换/外层held读取后编辑、reset、unmount仍需主控。没有收据不改formal sdk/build/browser PASS。

固定官方README原字节与LICENSE在official/，metadata含repo/commit/path/SHA，固定tree无中文时en回退。官网实际响应header记录在source-evidence；不以200或CORS当iframe允许，未Lab-origin确认保持unknown。实际命令/六项分层在local-validation.md。
