# E09 Shiki 非作者独立复核

2026-11-18，当前E09-shiki，固定shiki4.5.0。仅写本报告，不改条目/共享文件、不跑完整作者套件、共享检查或浏览器。按catalog→metadata→agent→全部sourceFiles→verification→guide检索，并读local-validation/调度与浏览器提案/安装包源码/官方证据。

结论：Spec、静态质量、独立真实token与SSR文本消费、隔离迁入编译PASS；没有实质整改项。调度策略另列PASS，不声称物理取消token化；真实浏览器/请求/IME/正式receipt仍NOT_RUN。

## 新真实消费者

cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`，`node --input-type=module`内联ESM，直接导入实际highlight.mjs。新输入为TypeScript联合类型与赋值、JSON的scope/count/active、带onload的SVG源码。每种token按行拼回后与原文严格相等，至少有真实主题颜色；再用与UI相同的React文本span方式renderToStaticMarkup，HTML源码不变成svg/script/img/text标签，尖括号和&被转义。

最终exit0：

```json
{"trial":"PASS","inputs":{"typescript":{"lines":2,"tokens":23},"json":{"lines":1,"tokens":13},"html":{"lines":1,"tokens":13}},"sourcePreserved":true,"ReactEscapedHTML":true,"theme":"github-light","fontStyleNotRendered":true}
```

首次消费者错误地断言SSR存在连续`&lt;svg`，exit1：真实词法token把`<`与`svg`分为两个span，输出其实正确。改为精确原文保真 + 不产生危险标签 + 编码字符存在，再次通过。没有改产品或为测试迎合改变SDK。本试用不是浏览器无执行/无请求证据，也不构成XSS穷举。

## 独立控制调度消费者（纯policy）

同cwd、另一个`node --input-type=module`脚本，exit0。仅暂时替换本脚本global setTimeout/clearTimeout，捕获真实scheduleHighlight安排的默认160ms任务，finally恢复。

第一任务尚pending时cleanup，实际pending删除且run未启动；第二任务外部触发捕获的timer、等待run开始，再cleanup，最后手动完成run的Promise，apply/fail都未被调用。输出：

```json
{"trial":"POLICY_PASS","pendingTimerCleared":1,"runStarted":1,"lateResultIgnored":true,"tokenizerPhysicallyCancelled":false}
```

这是应用调度证明，不计SDK数量；run已经开始且完成，清理只能阻止结果回写。作者SDK4/policy3分计正确，本次未重复全套。

## 隔离完整迁入编译

将五个真实迁入文件example.tsx、highlight.mjs/.d.mts、highlight-session.mjs/.d.mts复制到独有tmp目录，链接已安装Lab依赖。新consumer.tsx实际导入组件、Language/Token、highlightSource和scheduleHighlight，检查Promise<Token[][]>/cleanup函数类型与advanced JSX调用。

cwd `/home/lambert/githubRepos/lambert/ReactLoom`，argv：

```text
pnpm exec tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution Bundler --jsx react-jsx --skipLibCheck /tmp/e09-independent-ht6qsxfd/consumer.tsx
```

exit0、stdout/stderr空。包含复制的真实UI源码与声明使用，第三方声明内部skipLibCheck，不冒称全工作区编译。最后仅删除自建tmp，无依赖安装/共享改动。

## 六维复核

|要求|状态与依据|
|---|---|
|技术准确|PASS，真实SDK+安装源码：codeToTokens返回行/token；UI仅color、content文本，fontStyle虽保留但未绘制，github-light固定，无编译/执行承诺。|
|解释清楚|PASS，静态：只读高亮选型、token数据流、语言/主题与资源、共享singleton、清理限制和完整迁入，区分输入工具与编辑器功能。|
|Demo有用|静态/Node PASS，浏览器NOT_RUN：原文保真、语言规则变化、不可信HTML文本分别独立；调度/错误/重置步骤对应实际源码。|
|源码可迁移|PASS，五原件隔离strict编译与真实highlight消费。动态import/WASM/TS Bundler/ReactDOM前提清楚，无Provider/env/CSS/Worker；状态/调度清理有实际来源。|
|官方来源可靠|PASS，字节/安装字段：固定shikijs/shiki commitf7d0167873fd676fe4e190bc9b53832fba9ee01d/packages/shiki/README.md，独立raw与本地SHA均bbc41a59177e51e1521ef0197e6d4c3867c877c13df2a55b3fe360f48c2b4bd8，与metadata一致；package4.5.0 MIT与保留license.txt吻合，资产许可另说。固定tree无中文package README记录合理。当前官网GET200未见明确frame限制，unknown保留直达合理。|
|结果可复核|Node与policy层PASS，DOM/browser/formal NOT_RUN。真实输出与完整argv在上；不以SSR转义/token返回值当浏览器执行/网络证据。|

## 4.5实际引擎与生命周期

已读实装shiki/dist/bundle-web.mjs末尾：createBundledHighlighter配置bundledLanguages/bundledThemes，engine调用createOnigurumaEngine(import('shiki/wasm'))；随后createSingletonShorthands(createHighlighter,...)导出codeToTokens。语言表与themes.mjs各自为本地包动态import，而非用户提供远程grammar URL。连续调用复用库级singleton，本例只拥有自己的调度，不应dispose别人的共享highlighter。文档没有错误承诺每次新引擎、零加载、零网络请求或已测CSP方案。

UI每次code/lang变化清旧行并安排新任务，effect cleanup抑制旧Promise写回；level更新重置源码/语言，结果不回填textarea，不干扰原文权威。没有Worker/存储/业务网络；160ms为自建输入合并常数，不是性能测量。

浏览器proposal在上一任务完成后外层包装window.setTimeout/clearTimeout，仅捕获160ms且函数型任务；pending Set在实际安排后加入，实际触发时移除，只有clearTimeout确实删除pending才增加cleared。因此预期pending0/cleared1能证明真实安排且清理，强于只看DOM消失。若繁忙环境导致160ms先触发，该断言可能失败，不能把失败解释成已经清理；应保持真实失败或用受控浏览器时钟让pending窗口确定，不把计数硬写为1。未执行前仍NOT_RUN，不能据此说在途WASM停止或singleton销毁。

报告完成，停止写入，浏览器由主控执行。
