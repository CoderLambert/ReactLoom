# 2026-11-18 主控闭环补充

六项本地质量PASS。真实SSR SDK6+策略2及非作者新SSR consumer/迁入编译通过；浏览器2项含来源，三个level编辑/GFM表格任务清单、严格URL、HTML无害执行标记保持false、无tracker图片请求、外链rel及重置卸载通过；SSR不代浏览器证据。候选29及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/E06.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# E06 本地质量证据（2026-11-18）

STABLE：只修改E06目录，等待独立review/主控浏览器，不写共享viewer/e2e/依赖/索引，不提交/推送。真实react-markdown10.1.0、remark-gfm4.0.1、rehype-sanitize6.0.0。正式verification各维NOT_RUN。

|六项|状态与层级|证据|
|---|---|---|
|技术准确|PASS：真实SSR SDK+静态|6项SSR使用真实三包及UI共用render-policy；GFM任务disabled/checked，危险URL/HTML/远程图占位；新增反斜线拒绝；修正urlTransform替换默认而非默认后叠加与组合输入更新误述|
|解释清楚|PASS：静态自检，独立待主控|guide从报告问题/选型→真实AST流→四层职责不等价→三个目标→完整迁移与生产限制；不把sanitize当最终组件的万能净化|
|Demo有用|NOT_RUN：browser待主控|basic编辑React元素；business真实表格/任务；advanced恶意URL/HTML/跟踪图。SSR6 PASS不代替DOM执行/网络验证|
|源码可迁移|PASS：静态+策略复用SSR|example.tsx/render-policy.mjs/.d.mts全声明，无Lab私有导入；精确三依赖、React/DOM、TS bundler、无Provider/env/CSS插件；局部state无外部资源|
|官方来源可靠|PASS：固定原字节+实际HTTP|remarkjs/react-markdown tag10.1.0→commit44d2e4a44b37461ab7778d6870c1a9eb36393ad2，完整tree仅readme.md，无中文，保留en；三包实际安装与上游对应tag字段MIT；README链接官方demo GET无限制头，unknown非allowed|
|结果可复核|NOT_RUN：SSR/策略已记证，DOM未执行|SSR SDK6与纯URL policy2分列，raw日志/格式初始失败及最终通过均保存；browser.spec.ts仅提案，正式收据待主控|

cwd `/home/lambert/githubRepos/lambert/ReactLoom`，实际命令：

- `node --test packages/library-lab/entries/E06-react-markdown/tests/sdk.test.mjs` exit0，6 actual SSR SDK tests，validation/sdk.log。并非浏览器：GFM表格/任务、合法格式与rel、HTML/链接/图像、严格URL替换、sanitize删除测试插件注入的script HAST。没有执行脚本或真实外链导航。
- `node --test packages/library-lab/entries/E06-react-markdown/tests/policy.test.mjs` exit0，2 policy tests，validation/policy.log，不计SSR SDK。
- `pnpm --filter @reactloom/library-lab exec biome check --write entries/E06-react-markdown/examples entries/E06-react-markdown/tests entries/E06-react-markdown/validation/browser.spec.ts entries/E06-react-markdown/library.json entries/E06-react-markdown/official/source-evidence.json` 首次exit1，既有children prop和新增用例同类noChildrenProp问题，validation/biome.log。改为React.createElement第三参数children及模板文本；最终同范围加verification.json检查exit0，10files，validation/biome-final.log。
- `git diff --check -- packages/library-lab/entries/E06-react-markdown` exit0。
- 官方GitHub tag/tree/raw与README内demo链接实际GET通过Python urllib读取；official/readme.md保留原字节，SHA在library.json；official/source-evidence.json包含固定ref、唯一README候选、三包本地/上游版本许可字段、最终主页URL/响应头/正文摘要。无执行README命令。

浏览器提案validation/browser.spec.ts：实际编辑标题/strong；HTTPS外链target/rel只检查不导航；GFM表格/任务勾选+disabled与单元格编辑；advanced无script/img/onerror/a，无害window标记保持false，监听example.invalid/e06-tracker.png请求数0，图片alt占位；重置与停止卸载。未运行，不能声称DOM安全/无请求PASS。真实IME、读屏、水合另行NOT_RUN。

重要范围：safeMarkdownURL拒绝ASCII控制/空格/DEL/反斜线，不声称Unicode全净化；HTTPS不等于内容可信。sanitize在hast边界，而组件可以另建DOM，二者不能相互替代。maxLength12000仅textarea码元限制，非API限额。源码复用真实AST生态，没有自研Markdown parser、扩共享viewer或加载远程文章。

独立review重点：urlTransform替代语义；sanitize顺序与最终组件职责；图片既无img亦无预加载请求的浏览器待验；SSR6/policy2与browser分层；官方README pin/hash/唯一英文原件与unknown主页依据。
