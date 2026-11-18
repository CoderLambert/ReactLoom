# HTML-only 官方 README 回退：独立只读复核

2026-11-10，quality_e11。实际cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`。按root授权只写本报告，未改公共源/测试、未重复有效套件。读取readme-html-fallback.mjs/.d.mts、Document/OfficialReadme、HighlightCode、实际react-markdown处理顺序、六个新增Node测试与两条browser提案，以及candidate14 RED/GREEN原始日志。

结论：**无确认P1/P2，安全与适用范围静态通过**。真实新浏览器路径仍NOT_RUN，不能把Node22PASS提升为production browser PASS。

## 范围和安全链

- Document仅kind=readme安装插件；guide/agent仍是原sanitize+skipHtml。插件忽略空白text节点后，要求非空且全部顶层节点为raw；普通/混合Markdown、围栏代码和空白不进入回退。它不是rehype-raw，不解析HTML为可执行元素。
- 新树仅固定pre/code element与text(source)，语言class固定language-html，没有从原文复制属性、URL或元素。script/iframe/img/svg/style/event handler都成为字面源码。随后仍经过rehypeSanitize和react-markdown skipHtml，未放宽schema、URL或资源门禁。
- 生产CodeBlock再进入现有HighlightCode。该组件用codeToTokens，token.content由React文本子节点渲染；没有dangerouslySetInnerHTML或把原文当HTML解析。高亮失败仍保留React文本。Node默认pre与生产自定义pre不同，但这条实际下游链已独立只读核对，未拿默认renderer测试假装已测生产浏览器。
- 原文读取的字节预算/类型校验、SHA比对、AbortSignal、外部图片限制与URL变换均保留。CopyOriginal读取未修改text；快照文件与元数据hash不经回退重写。现有代码块展示末尾换行处理不等于改动原始snapshot/复制原文。

## 复用证据与边界

candidate14/readme-fallback-red.txt是插件尚未创建时ERR_MODULE_NOT_FOUND的TDD RED，不称它为安全行为反例。GREEN原日志为22PASS/0FAIL/0SKIP/exit0，其中六项新增覆盖实际Embla HTML-only原文、恶意HTML字面化、混合Markdown等价、围栏不重包、guide继续丢HTML、空白不生空代码块；既有文档检查一并有效。

root提供的真实Embla AST21raw+20whitespace/旧输出20空白B及candidate14官方README为空失败是问题行为证据；本review未另运行探针或重测。e2e/quality-document-security.spec.ts新两项分别针对实际官方快照文本/没有活HTML或远端图片请求，以及明确标注的静态guide安全fixture。后者page.route只替平台不可信文档输入，不替任何SDK运行；有window属性未执行断言。

新构建中的真实可读源码、高亮后的元素/请求边界和guide fixture仍待root统一browser。未引入依赖、宿主安全降级或iframe代理；未确认需要阻断候选的新增问题。
