# 2026-11-18 主控闭环补充

六项本地质量PASS。真实Node Worker SDK3+策略2、隔离迁入编译及非作者新RPC/transfer/callback finalizer试用通过。浏览器3项含官方来源；外层Worker创建/close/page.workers验证成功、远端错误恢复、transfer/proxy、取消、卸载、切Tab均无残留线程。候选27及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/D18.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# D18 本地质量复核（2026-11-18）

对象：独占 entries/D18-comlink，真实Comlink4.4.2。先落盘NOT_RUN后进行整改；本文件记录最终本地结果，不是正式收据。共享宿主/依赖/锁/生成/e2e/队列未修改，没有运行共享build/full typecheck/browser。只运行本条SDK、policy、Biome、复制源码后的隔离编译与官方元数据检查。

## 六项复核

|维度|状态/证据层级|结果|
|---|---|---|
|技术准确|PASS：真实Node Worker + 源码|SDK3/3复用worker-api.ts，验证特殊键词频、远端拒绝后同端点恢复、buffer分离/求和和proxy顺序。修正旧MIT→Apache-2.0、releaseProxy void不是ACK、无expose可能永挂等错误。|
|解释清楚|PASS：静态正文/源码对照|选型→真实RPC→远端校验/恢复→transfer/proxy→有界等待和物理终止；三个目标不同，不以6/4000数据量充场景。|
|Demo有用|NOT_RUN：浏览器待验|可输入词频、非法数组错误恢复、转移/10步回调/取消；提供两个@D18用例，由主控集成执行。未把Node Worker通过当浏览器通过。|
|源码可迁移|PASS：隔离复制源码TypeScript编译|example.tsx、worker.ts、worker-api.ts、session-policy.mjs/.d.mts齐全，metadata全列。React/TS/模块Worker/Vite识别静态URL、CSP与Node测试前提已写guide/agent。没有Lab内部依赖。|
|官方来源可靠|PASS：固定原文字节/真实响应头|固定v4.4.2 peeled commit fd4b52666b1ec62784f8b45cb1108c7e40bc481d，完整递归树无中文README；原文摘要匹配。GitHub GET200明确deny/frame-ancestors none，blocked有证据。|
|结果可复核|NOT_RUN：集成/浏览器待验|本地SDK3/3、policy2/2、Biome、隔离编译、官方元数据通过；最终共享候选build/browser、逐库收据未执行。正式verification三个状态仍NOT_RUN。|

## 修复的实际问题

- 频数Record={}对__proto__/constructor/toString不安全。改用Map→可克隆行数组；远端检查最多10000字符串/每词200UTF16单元，Array.from使稀疏数组空洞同样拒绝。业务校验不能阻止消息入站前的克隆内存开销，正文明确发送方仍需预算。
- Worker API抽到真实共享worker-api.ts，浏览器worker.ts仅expose；Node Worker测试使用同一API，而非原来的测试专用sum/aggregate。
- business改成远端TypeError和修正重跑，不再只是4000条基础例子。advanced转移sum75、主线程byteLength0，10次await代理回调，正常完成finally释放收到的回调proxy。
- 主线程每批session独占，重复启动ref挡住，epoch防旧结果/进度、取消/卸载回写；error/messageerror/abort/5秒等待有明确清理。releaseProxy公开void，尝试请求后finally终止；不伪造ACK、协作式signal或远端Promise成功。
- 页面生命周期文案只声称请求与terminate调用。浏览器提案在组件外使用page worker/close和page.workers验证成功、取消、卸载及切Tab真实线程退出，并在取消后观察>3个fixture间隔无迟到回写。

## 实际执行及原始日志

所有命令cwd `/home/lambert/githubRepos/lambert/ReactLoom`。validation/*-command.json保存精确argv/cwd/exitCode/UTC时间，*.log是对应原始合并stdout/stderr；官方metadata脚本另保存stdin。不是verify:record receipt。

|命令|结果|原始证据|
|---|---|---|
|`node --test packages/library-lab/entries/D18-comlink/tests/sdk.test.mjs`|exit0，3 tests / 3 pass / 0 skip|validation/sdk-final.log + sdk-final-command.json|
|`node --test packages/library-lab/entries/D18-comlink/tests/policy.test.mjs`|exit0，2 tests / 2 pass|validation/policy-final.log + policy-final-command.json|
|`pnpm --filter @reactloom/library-lab exec biome check --write entries/D18-comlink/examples entries/D18-comlink/tests entries/D18-comlink/library.json entries/D18-comlink/validation/browser.spec.ts`|最终exit0，11files，无诊断|validation/biome-final.log + biome-final-command.json|
|`pnpm --filter @reactloom/library-lab exec tsc -p /tmp/d18-portable-ezqotf8z/tsconfig.json`|exit0，无诊断；仅复制的本条源码与浏览器提案，不是共享full typecheck|validation/portable-typecheck.log + portable-typecheck-command.json|
|`node --input-type=module -`|exit0；实际validateOfficialSources返回[]、原文SHA匹配|validation/official-metadata.log + official-metadata-command.json（含stdin）|

首次Biome exit1（effect缺dispose依赖）原日志保留validation/biome.log，已用useCallback+effect依赖修正。首次隔离编译指出callback的Remote类型未标记ProxyMarked，已修正为Remote<函数 & ProxyMarked>，最终编译通过。首次SDK/policy执行日志也保留，未以失败前源码声称最终PASS。

policy是本例业务输入和清理兜底测试，不计入SDK；其清理测试只用throwing release mock证明finally，真实物理Worker终止由SDK worker.terminate exit和待执行的浏览器外层观察分别覆盖。

## 官方取证

- `git ls-remote https://github.com/GoogleChromeLabs/comlink.git 'refs/tags/v4.4.2*'` exit0：tag object c72ee3bc6a8de289d3b9be206b96efdbc8a3f3e0，peeled commit fd4b52666b1ec62784f8b45cb1108c7e40bc481d。
- Python urllib实际GET官方该commit完整递归tree和README，exit0；保存official/tree.json和readme.md，未发现官方中文README，因此保留英文language=en；中文若上游提供必须用zh-CN契约，未自行翻译冒充原文。
- 许可双核：安装包package.json为Apache-2.0；固定commit LICENSE原文实际GET保存official/license.txt，标题Apache License Version 2.0。
- README SHA256 `cfd4281d28ea8268122ce3a885688c725f436fe12f4eb4f308242f130487af56`，与library.json和实际共享元数据校验匹配。
- `curl -fsSL -D packages/library-lab/entries/D18-comlink/official/homepage-headers.txt -o /dev/null https://github.com/GoogleChromeLabs/comlink` exit0；HTTP/2 200，x-frame-options deny、CSP frame-ancestors none。blocked并保留直达，不需要用iframe load猜测。

## 交给主控/独立复核

复制validation/browser.spec.ts到公共e2e后冻结候选执行@D18；当前未运行。独立review应特别检查真实共享API、特殊词/稀疏数组边界、Remote<ProxyMarked>回调类型、正常回调释放、主线程release无ACK声明、取消后旧finally不干扰新session，以及浏览器实际Worker close而非组件消失。CSP拒绝/worker缺expose的失败路径有代码与5秒上限，但没有单独浏览器故障注入证据。共享候选的构建和正式记录由主控负责，verification sdk/build/browser保持NOT_RUN。
