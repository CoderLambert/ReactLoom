# remark：同一棵mdast，结构分析与Markdown规范化

文章入库前要提取标题、统一GFM表格写法，再列出可疑链接。remark把Markdown解析为mdast，插件可以扩展语法/转换树，stringify再输出Markdown。它不创建React元素、不执行HTML，也不是sanitizer。给人看的预览用react-markdown；HTML树与净化另选rehype/DOMPurify。

本例真实使用remark15.0.1和remark-gfm4.0.1，实装均MIT/ESM。三个目标是结构分析、GFM规范化、只读审计，不是同一结果换标题。没有网络、文件上传、自动保存或远程服务。GFM样例的PASS/NOT_RUN只是文章文字。

## 完整最小接入

已有React/TypeScript浏览器打包项目执行：

```sh
pnpm add remark@15.0.1 remark-gfm@4.0.1
```

复制examples/example.tsx、workshop.mjs/.d.mts、audit-policy.mjs/.d.mts，保持相对目录。demo.tsx只是Lab转发可省。渲染 `<RemarkExample level="basic" />`。ESM/TSX打包器需能解析声明文件；无需CSS、Provider、账号、env或Lab内部模块。纯Node复用workshop.mjs时不需要React/DOM，保持ESM导入并安装同版本两包即可。

```js
const processor = remark().use(remarkGfm)
const ast = processor.parse(source)
const audit = auditMarkdownTree(ast)
const normalized = String(processor.stringify(ast))
```

真实共享workshop.mjs只parse一次，将**同一个ast**交给审计和stringify。按钮触发；键击只改原文，结果是上次点击的快照，不会自动更新。换层/恢复案例清空结果；处理失败也清空旧结果，避免旧成功报告冒充本次成功。

## parse不是run：GFM为什么仍然生效

unified处理有parse→run→stringify阶段。`parse`会初始化/冻结processor，使语法扩展生效，但**不执行transformer插件**。remark-gfm注册解析/序列化扩展，所以本例无需run也能读写table/task/delete节点；这不代表任意 `.use(plugin)` 转换都会跑。

若后来添加会改树的transformer，应在parse后执行 `processor.runSync(ast)`（异步插件用await run），取得其返回树，再对那一棵最终树审计与stringify。不能审计旧树、输出新树，也不能把processSync暗中多parse一次。当前示例无transformer，无自定义改写，审计只读。

## 基础：结构与大纲

默认Markdown有两个标题和列表。点击解析，预期headings为ReactLoom Note、Getting started，nodeTypes.list为1；输出依然是Markdown，空行/列表标记可能规范化。节点数不是正文字符数。标题纯文本采集text/inlineCode和图片alt，不把HTML标签拼进标题。它不是任意自定义mdast节点的语义解释器。

## 业务：GFM工程报告

输入表格、任务列表与删除线。预期nodeTypes.table=1、delete=1，输出保留表格、[x]/[ ]、~~旧方案~~。页面没有HTML table，只有pre里的字符串。规范化可能改变排版，不保证原始字节完全一致；当前固定fixture规范化后再次规范化稳定，由真实SDK测试核实。

## 进阶：URL与raw HTML审计

默认包含HTTPS、javascript链接、raw script、远程图片和reference-style链接。审计列出link/image及definition的URL，因此引用链接的定义也能显示data:为false，**包括未被使用的定义**；links长度不是实际点击链接次数。rawHtmlNodes数只报告html节点，不删除它。

`safeReference`是本例自建URL语法规则：最多2048个UTF16单元；控制字符、空白、反斜杠、协议相对URL、凭据被拒绝；允许无凭据HTTPS、单/开头站内路径和有限Unicode锚点。标safe=true不表示域名可信、无追踪、无重定向风险或已通过浏览器XSS测试。图片HTTPS可以被标true，但本页根本不渲染img、不下载图片。

危险URL/raw HTML仍留在原树与输出Markdown中。这是审计信号，不是安全发布产物。下一步发布可拒绝文档，或明确执行另一个改写/净化管线；不能看到safe字段就把normalized送入dangerouslySetInnerHTML。本例两个pre使用React文本插值，script只是文字。

## 有界输入与行走

处理上限是**24,000 UTF-8字节**，不是24KiB（24KiB是24,576字节）。输入框另限12,000个JavaScript UTF16单元。中文通常每字3字节，8,001个“中”只有8,001单元却有24,003字节，可以在UI触发处理错误；emoji通常2个单元/4字节。不要把textarea maxLength误写成字节保护。

审计显式栈遍历最多4096对象节点，并用WeakSet拒绝循环/重复共享节点；标题采集同样有预算，不能绕过主行走造成无限循环。这个额外保护面向直接调用helper的非remark树，正常mdast是树。字节限制在parse前，节点限制在parse之后；它们不是严格CPU/内存时限。要实时处理大文章，另设计Worker/取消/资源预算，不在每键里同步解析。

## 操作与错误恢复

1. basic点击，检查两标题/列表与Markdown输出。
2. business点击，查看nodeTypes及GFM文字输出；不是浏览器表格。
3. advanced点击，检查safe true/false、rawHtmlNodes与reference definition；输出危险文字仍在。
4. 先成功，再输入8,001个“中”点击：alert显示字节错误，旧audit/output消失。恢复案例再运行应成功。

本例没有定时器、订阅、Worker或持久化需要销毁；React仅管理文本/结果状态，换层effect重置。本地浏览器检查了恶意输入按文本展示、脚本不执行和远程图片 URL 无请求。真实NodeSDK/policy与DOM安全行为分别记证，不能用Node无DOM自动推出浏览器无网络。

## 生产组合与升级

编辑器拥有原文，remark拥有一次处理快照；预览层用E06，HTML发布层用E08/E10。Query可以缓存原文，但不能把审计报告当第二份正文真相。多文档缓存包含内容/策略版本；审计错误应阻止发布但不删除本地输入。

固定remark15.0.1/gfm4.0.1。升级或新增转换插件后核对AST节点、同树审计/输出、GFM规范化和UTF8边界。安全标签属于业务策略，不能由目录收录或生成脚本推成SDK/安全PASS。

官方原文采用固定15.0.1 monorepo中对应packages/remark/readme.md，与本中文讲解分开；未发现固定版本官方中文对应README，使用en。许可/主页响应与具体运行日志见official和local-validation.md；主页未实际Lab嵌入确认保持unknown。正式verification维持NOT_RUN直至匹配收据。
