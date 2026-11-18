# D09 Axios 独立复核（2026-11-18）

范围：当前稳定候选 `packages/library-lab/entries/D09-axios`，仅写本报告，未改条目/共享文件/收据，不提交。沿用本轮已经读取的 library-lab-quality 三份参考及项目规则，重新读取 D09 的 library/guide/agent/AGENTS/verification/local-validation、三个声明源文件、浏览器提案和官方来源证据。

## 裁决与问题

内容/迁移/真实 SDK 最小试用通过，未发现已确认的客户端实现缺陷。合规 PASS：无模板泄漏、真实 Axios、fixture 明示、无网络验收夸大，正式三项 NOT_RUN 保留。整体质量验收仍 NOT_RUN，浏览器提案有一项必须在用作竞态验收前补强的证据缺口。

**P2：浏览器提案未等待旧任务窗口，不能证明竞态、租户切换和取消后的结果稳定。** `validation/browser.spec.ts:20–31` 在出现 a1/b1/取消提示后立即发起下一操作或卸载。fixture `/slow` 等待340ms，快任务40ms后才开始，另需60ms；出现 b1 的时刻可能早于旧租户快任务完成。即使移除清理 pending timer，先看到 b1、随后被旧 a 查询覆盖的回归也可能被下一个动作取消而隐藏。建议每个分支成功后等待至少400ms，再断言结果保持、租户不倒退；取消后同样跨窗口断言提示不变。此为测试覆盖缺陷，不是已确认运行时竞态。

`browser.spec.ts:30–31,43–44` 只观察卸载后节点消失，且高级用例已等409完成，无 pending 请求；它不证明未完成请求/40ms timer 已取消或拦截器已 eject。若要声称浏览器卸载清理通过，应先启动 pending 工作再卸载，并用宿主保留的 observer/请求轨迹验证后续无工作；否则明确只覆盖卸载 UI，资源清理由静态+Node 局部证据支持。合成 composition 只证明事件策略，真实中文输入法仍为人工范围。

## 独立最小 consumer

cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`。命令为 `node --input-type=module` stdin consumer，直接导入真实 `axios` 和声明文件 `./entries/D09-axios/examples/fixture-client.ts`；没有复制或执行作者七测试套件。

调用 `makeFixtureClient` 后 install→dispose→install→install，GET tenant=b，断言校验后只有 b1、真实 adapter 日志含 isolated 头且响应拦截器只执行一次。额外传非法 tenant/31行给 validate 均抛错。调用 boundedGetRetry 得 attempt=2；POST conflict 断言 AxiosError response409，日志仅一次 POST；启动 slow 后10ms abort，断言 axios.isCancel。最后 dispose。退出0，原始输出：

```text
Independent Axios consumer PASS: install/dispose/install idempotence; tenant b + actual intercepted header; invalid/oversize response rejection; bounded503 recovery; single409; in-flight cancel; pinned README hash/live bytes.
["GET /feeds → 200 (request 1, X-Lab-Request=isolated)","response interceptor → 200","GET /transient → 503 (request 1, X-Lab-Request=isolated)","GET /transient → 200 (request 2, X-Lab-Request=isolated)","response interceptor → 200","POST /conflict → 409 (request 1, X-Lab-Request=isolated)"]
```

目标类型检查从仓库根执行，退出0，无诊断：

```sh
pnpm --filter @reactloom/library-lab exec tsc --ignoreConfig --noEmit --strict --skipLibCheck --jsx react-jsx --module esnext --moduleResolution bundler --target es2022 --esModuleInterop entries/D09-axios/examples/example.tsx entries/D09-axios/examples/fixture-client.ts
```

这不是浏览器、全包build或正式SDK收据。未运行 broad checks 或重复作者suite。

## 实现与迁移核对

- 真实 axios.create/AxiosHeaders/AxiosError/interceptors；install 幂等，dispose 只 eject 自己两个id并清记录，可重装。StrictMode 的 abandoned lazy factory 仅创建可回收闭包和本地实例，未启动网络/timer；effect 重演能重新安装。
- controller 清 pending timer、abort 前请求、增 generation；租户切换复用 controller。search 成功/失败均核对 token；成功还核对 signal。effect 清 timer/abort/作废token/dispose。取消同时处理 pending timer 和活跃请求。
- IME ref 只约束手动 GET，不承诺自动搜索或防抖；guide 与代码一致。tenant 下拉会直接发请求，符合实验用途，非授权。
- boundedGetRetry 是自建两轮 GET-only 循环，只有503能继续；非503、取消和第二次失败即抛出；没有假称 Axios 内置重试、退避或Retry-After。POST409不经过重试循环。
- validate 对未知响应检查数组/30行上限/字段与租户枚举。纯工厂返回 AxiosResponse，页面校验 data；泛型非运行时验证。
- 迁移列明 axios1.20.0自带类型、React/hooks/TS、fixture-client+example两个必需文件，demo为适配，可选布局class无CSS硬依赖；无env/provider服务配置。生产需删除adapter/resetTransient、配受信baseURL及服务端鉴权，保留取消和代际。timeout2000在fixture不执行、网络/CORS/auth未验收，失败分支和清理说明准确。

## 官方来源

独立 Node crypto 核对快照SHA256等于 metadata `97a6e20150ce709291165af55c6fa4eba74f56c63dceb6aa69f1e9b495e52bcf`。独立 GitHub contents 请求固定提交 `84a9f3b9a4f3244b8c8e818f557d64c7b964fb25` 的 README 返回200，base64解码与保存bytes逐字节相同。固定tree来源证据列出的README无中文版本，回退英文合理；guide未冒称官方译文。homepage证据为中文入口GET200、最终axios.rest、无实际Lab origin嵌入证据；unknown及直达保留合理，未独立浏览器证明可嵌入。

检索先运行 `node packages/library-lab/scripts/find-library.mjs --id D09 --agent`，退出1：`Error: Invalid D10-zustand: invalid official README metadata`。据实际目录继续，归共享/其他条目阻塞，不归D09。

## 六维状态

|维度|状态与证据层级|
|---|---|
|技术准确|PASS 静态+独立真实SDK：实例、拦截器重装、取消、校验、503/409均对应声明。|
|解释清楚|PASS 静态：选型→请求链→迁移→三个独立目标→失败清理，SDK和fixture边界明确。|
|Demo有用|NOT_RUN 浏览器：三个独立目标设计合理，需修补提案稳定窗口后实际执行。|
|源码可迁移|PASS 静态+类型+真实consumer：依赖/文件/类型/配置/失败和所有权齐全。|
|官方来源可靠|PASS 固定来源与原文字节核对；homepage保守unknown。|
|结果可复核|NOT_RUN 完整交互：本报告列出局部真实输出；浏览器/正式收据未完成，不能从节点消失推定资源清理。|

后续交主控补稳定窗口并运行浏览器；作者本地日志和 verification 说明文字部分仍为旧“尚未执行”，但状态 NOT_RUN 是正式收据边界正确值，可选更新 note 指向 local-validation 避免误读。

## 增量复核：主控 browser 修补（candidate24 前，运行待定）

仅重新读取 `packages/library-lab/e2e/quality-resume-axios.spec.ts`，未重复 SDK/类型/上游请求。

原 P2 的**竞态/租户/取消稳定窗口**已在设计层关闭：新用例在结果后等待450ms再次检查 a1不含a2、b1不含a1，取消后等待450ms再检查取消提示，跨越340ms旧慢请求和40+60ms快任务窗口。实际运行仍 NOT_RUN。

新增外层 timer probe 捕获真实40/60/340ms计时器，比节点消失强，但**卸载清理仍有假绿路径**：`expect.poll(pending).toBe(0)` 允许未清理timer自然到期，之后才取 stopped；再等450ms不变完全可能通过。`scheduled>0` 也不保证卸载时仍有待执行工作。建议卸载前断言pending>0并保留fired基线；卸载完成后断言pending=0且fired相对卸载前未增加，再等待/推进时间断言稳定。最好用受控浏览器clock固定未完成窗口，避免操作延迟穿过40/340ms。不能在计时器可能已自然完成后才建立“取消成功”的基线。

因此原竞态窗口问题设计已修复；卸载资源验收证据问题保留，完整浏览器运行待candidate24。未据新增测试存在提升任何运行状态。

## 第二次增量复核：卸载 probe 设计关闭

重新读取最终 `e2e/quality-resume-axios.spec.ts`：clock 在请求前安装并暂停；实际 race 启动后记录 before，要求pending>0及scheduled>0；卸载后要求pending=0且fired与before相同；再用clock.runFor(450)推进，完整快照必须等于 `{...before,pending:0}`。由于时钟暂停，poll无法靠自然到期通过，且fired基线来自卸载前，上一轮假绿路径已关闭。

本次仅静态 delta review；两项浏览器证据缺口均在设计层关闭，无剩余已确认阻断项。运行仍待candidate24，完整质量状态仍 NOT_RUN，不能将此关闭记录当浏览器PASS。该probe证明本例实际fixture/race计时器清理，不扩张为真实HTTP/CORS或全部拦截器运行验收。
