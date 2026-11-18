# 2026-11-18 主控闭环补充

六项本地质量PASS。应用策略7及非作者五文件严格迁入/新generator消费通过，不作Node SDK。浏览器3项含来源：真实SDK完整与累计回复、Enter不发/error恢复；外层450ms timer实际fired1，取消清pending并增加clear/abort，1800ms后无新片段；允许SDK显示完已yield的18字符。新提问、切层与卸载的真实pending清理均通过。候选31及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/E12.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# E12 assistant-ui 本地质量证据（2026-11-18）

STABLE：只E12目录，未改shared/依赖锁/e2e/生成/队列结果，无模型/secret/API/新包，无build/fulltypecheck/browser/commit。真实@assistant-ui/react0.15.21；formal SDK/build/browser全部NOT_RUN。

|六项|状态与层级|证据|
|---|---|---|
|技术准确|静态/迁入类型PASS；真实SDK NOT_RUN|查实0.15.21公开primitives与Error/Composer submitMode，Provider/useLocalRuntime真实接线；5原件strict JSX compile通过。Node7仅自建reply/adapter/sleep策略，不冒称SDK|
|解释清楚|PASS：静态自检，独立待主控|guide区分runtime/fixture/模型、累计yield与delta、三个目标、错误恢复、session controller/listener/timer所有权、生产取消边界|
|Demo有用|NOT_RUN：browser待主控|basic一次回复+/error恢复；business可见累计；advanced真实cancelRun后稳定及新提问/卸载/切层清理。提案有具体外层探针，未执行|
|源码可迁移|PASS：类型/静态+本地adapter执行|example.tsx、local-adapter.mjs/.d.mts、reply-policy.mjs/.d.mts全sourceFiles；精确依赖/ReactDOM/TS bundler/AbortController+DOMException/timer，无Provider额外配置/env/CSS/账号；StrictMode可重入abortAll|
|官方来源可靠|PASS：固定原字节+实装字段/HTTP|@assistant-ui/react@0.15.21 commitf6bcca7cd0c901ae5a0a58a9ad3ce75fcf07bb09，包README为指向../../README.md的git symlink，实际保留根README原字节；无官方中文README，en。安装与固定package.json MIT，官网CSP frame-ancestors self blocked|
|结果可复核|NOT_RUN：policy/类型有日志，SDK/browser未执行|policy7/SDK0分列，raw日志/编译argv-cwd-exit保存；浏览器clock与真实primitives提案待主控，formal收据不推定|

cwd `/home/lambert/githubRepos/lambert/ReactLoom`：

- `node --test packages/library-lab/entries/E12-assistant-ui/tests/*.test.mjs` exit0，7纯应用policy tests，validation/policy.log。4条原reply策略迁至tests，3条真正UI local-adapter生成器/abortableSleep测试；累计由最近user驱动，sleep立即取消、abortAll后无yield且新run可用、/error失败后恢复。没有import/运行assistant-ui runtime，不计SDK。
- 5原迁入文件复制至自有tmp，用已安装Lab依赖symlink，根cwd `pnpm exec tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution Bundler --jsx react-jsx --skipLibCheck /tmp/e12-typecheck-oeznbxqd/example.tsx` exit0，output空，validation/typecheck.json保存全argv/cwd/exit/output。第三方声明内部skipLibCheck；不是DOM/Hook或全Lab检查；tmp已定向清理。
- `pnpm --filter @reactloom/library-lab exec biome check --write entries/E12-assistant-ui/examples entries/E12-assistant-ui/tests entries/E12-assistant-ui/validation/browser.spec.ts entries/E12-assistant-ui/library.json entries/E12-assistant-ui/official/source-evidence.json` exit0，validation/biome.log。初次11files格式化并有原测试template信息；等价模板修正后同范围加verification.json，最终exit0/12files/no fixes，validation/biome-final.log。无必要重跑未变策略。
- `git diff --check -- packages/library-lab/entries/E12-assistant-ui` exit0。
- 官方tag/tree/raw package及root README经Python urllib实际读取；包README最初取到15字节symlink文本，发现mode120000后改保留目标根README原字节，元数据path/sha匹配实际。homepage urllib首次HTTP403；换实际curl GET200后保存完整official/homepage-headers.txt/正文摘要，CSP只允许self因此blocked，不把200当allowed。来源树/版本许可/原文SHA见official/source-evidence.json/library.json。

浏览器提案validation/browser.spec.ts：真实Composer显式发送（Enter不自动发）、basic包含最新user/error可见/新提问不引用旧问题；business首段与累计增长；advanced真实首段后取消。独立controlled-clock阶段包装450ms timer和AbortController.abort，先pending>0、推进首段再pending>0，取消后pending0/clear与abort增加，超delay稳定且fired不增。新提问独立，实际学习场景切换和卸载也清pending/abort，超等待无迟到timer。探针只观察本delay，不通过DOM消失替代cleanup，也不访问模型服务。浏览器未执行，实际IME候选/读屏另行NOT_RUN。

正确边界：abortableSleep的正常/取消路径均移除同一listener，取消clear timer；每run finally解除SDK signal转发并移出active。cleanup abortAll只管自己session，StrictMode新run不永久禁用。SDK cancelRun给出的signal与本地controller转发；没有对远端模型取消/计费保证。会话历史保留与新reply串旧输出区分；回复始终本地fixture模板，不冒充AI或RSS核验。

独立review重点：真正adapter被useLocalRuntime消费与所有源/类型迁入；累计而非delta；取消/卸载/切层timer+listener/active清理；error恢复与最近user；Node policy不冒称SDK；README symlink目标原文与homepage blocked证据。
