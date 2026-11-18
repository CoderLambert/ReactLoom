# C19 nuqs 独立六项复核

复核者：`/root/c19_review`；时间：2026-11-11 05:48 UTC。任务范围是当前共享工作区的 C19，只读条目及直接相关来源/验收材料，仅新增本报告。模型与实际权限未通过运行元数据核验，记录为 UNKNOWN。基线 HEAD：`1218066e706a90ba03fac8dff8c9b843dd2429c4`，保留现有未提交成果。

结论：**未发现阻止内容完成的 P1/P2；六项均 PASS，可将 C19 内容状态推进为 content_done。** 这是当前讲解、源码、官方资料和本地证据的独立质量复核；正式 sdk/build/browser 收据继续 NOT_RUN，官网 iframe 继续 unknown。

## 复核绑定

- 当前 entry 共 61 文件，按 queue 的 repo-relative path + NUL + bytes + NUL 算法独立复算，SHA-256 为 `f93530aa04813211cc4f85bfa37c623e27baf210705d96ea458aa9439ccc390a`，与作者 FINAL 一致。
- `validation/final-validation-binding.json` 中 19 个 protectedInputs、12 个 evidence 文件摘要逐一匹配，均无漂移。
- 八个实际运行源逐一匹配 candidate21 `inputs.json`，并匹配作者最终绑定；当前非 entry 的 210 个 candidate21 输入均无变化。它们包含宿主、公共源码、相关配置/脚本/测试及依赖声明输入。
- 安装 Nuqs 的 12 个源码/类型文件、Router Core 的 2 个源码文件与 `validation/sdk-source-audit.json` 均逐字节匹配。README 31845 字节，快照与安装包 README 相同。
- entry `validation/browser-proposal.txt` 与公共实际执行的 `e2e/quality-remediation-nuqs.spec.ts` 同 SHA-256：`fd637a0295a996fe308490ea47abceea48a8e8922497aef7c6b205dc1ba66bb9`。

以上为本次静态独立检查，cwd 为仓库根 `/home/lambert/githubRepos/lambert/ReactLoom`。两次 `python -` 只读摘要核对均 exit 0：第一次复核 protected/evidence/SDK/Core/README/八源及提案；第二次在 `2026-11-11T05:48:19.581020+00:00` 复算 entry 整体摘要和 210 个共享输入。未重跑 SDK、policy、HTTP、build 或浏览器。后文运行结论均为 REUSED，有对应真实原始日志。

## 六项逐项结论

| 维度 | 结论与证据层级 | 独立复核依据 |
| --- | --- | --- |
| 技术准确 | PASS，匹配安装源码/类型及真实 SDK、Chromium | `guide.md:7` 至 `:19` 区分草稿、SDK 状态、地址栏和业务模型；`:59` 至 `:73` 准确说明 null/default/clearOnDefault、宽松整数解析、页码夹取、整组 history 与当前版本桥。实际 `query-contract.mjs:1` 导入 nuqs/server，`example.tsx:20` 使用真实 useQueryStates。安装 `dist/server.js:314` 的 parseInt、`dist/debounce-Ynq26WfO.js:134` 的 push 优先、`dist/context-Mu913OAK.js:92` 的公开 provider 选项与正文一致。 |
| 解释清楚 | PASS，中文静态内容复核 | `guide.md:3` 以 RSS 分享/刷新/返回为工程问题，明确本地 5 条 fixture；`:9` 的输入→应用→SDK→URL→返回流，`:31` 的 Router 内 provider 接入及 `:47` 的关联参数 setter 解释输入、处理和结果；`:65`、`:75`、`:81` 就近解释 history、IME、迁移及取舍。原失败/候选批次/命令管理已归入 local-validation，正文没有过时的“真实浏览器未执行”结论。 |
| Demo 有用 | PASS，三独立目标且真实浏览器 REUSED | `library.json` 声明唯一 basic/business/advanced，`guide.md:23` 列操作、结果和对应源。实际浏览器套件 `quality-remediation-nuqs.spec.ts:33` 验草稿/分享/刷新/自有键清除/合成 composition；`:83` 验关联筛选、回页1、replace、空态恢复；`:119` 验 push/replace/Back/Forward、abc/99/2tail、逻辑数组/hash、窄屏及卸载重挂。candidate21 原始日志三项 PASS；没有以纯策略测试替代 UI。 |
| 源码可迁移 | PASS，静态源码/真实宿主运行 REUSED | metadata 三层均列齐八源；`guide.md:83` 明确复制文件、版本与真实 Router 上下文；CSS 仅作用于 c19-workshop。`tanstack-adapter.tsx:37` 使用公开 navigate href，`:57` 外层保留真实内置 HistorySpy、内层公开 custom provider；公开 defaultOptions/processUrlSearchParams 透传，没有私有 context/reset 导入。安装内置 adapter `dist/adapters/tanstack-router.js:45` 证实历史订阅和 unsubscribe 所有权。`example.tsx:30` 至 `:60` 的 alive/generation 仅保护自身回调，正文未将它冒称为 SDK 队列取消。 |
| 官方来源可靠 | PASS，固定原文/既有实际 HTTP/状态展示 REUSED | `library.json.official` 与 `official/source-evidence.json` 同 repo/ref/path/version/date/hash：47ng/nuqs、691a473226bba0ddb93bc3a1010c8fa4e777c45f、根 README.md、en；完整 tree 的候选列表无目标包 README 或中文候选，根原文回退有据。npm gitHead 与安装 2.10.1 对应，源 manifest 的语义发布占位版本没有改写。五次真实 GET 均200，README bytes/hash与快照及安装文件一致。官网 GET200 的最终 rawHeaders 无 XFO/CSP，但 `browserFromLabOrigin=NOT_RUN`，unknown 正确；官方面板 case 只证明原文和 unknown/直达入口展示，不冒称 iframe 可用。 |
| 结果可复核 | PASS，命令/退出码/日志及当前输入绑定 | `local-validation.md:38` 至 `:57`、`validation/local-runs.json`、`final-validation-binding.json` 和 candidate21 的 results/browser/bindings 可对应真实 cwd、argv、UTC、exit0；SDK6、policy6、C19 UI3+来源1分别计数，没有把混合6项全部计为C19。旧 candidate20 三 FAIL 保留。`verification.json` 正式三 status 均 NOT_RUN，与本地 PASS 分层一致。 |

## 复用的实际运行证据

| 范围 | 真实命令及 cwd | 原始证据与结果 |
| --- | --- | --- |
| SDK | 仓库根执行 `pnpm --dir packages/library-lab exec node --test entries/C19-nuqs/tests/sdk.test.mjs` | entry `validation/sdk.txt`：exit0，6 PASS/0 SKIP；实际 parser/loader/serializer，非 DOM/adapter 验收。 |
| 应用策略 | 仓库根执行 `pnpm --dir packages/library-lab exec node --test entries/C19-nuqs/tests/url-policy.test.mjs` | entry `validation/policy.txt`：exit0，6 PASS/0 SKIP；与 SDK 证据分开。 |
| 本地编译/目录 | 仓库根的 `pnpm --filter @reactloom/library-lab typecheck`、`build`、`catalog:check` | `docs/library-lab/evidence/quality-upgrade/candidate-21/results.json` 与对应 txt：各 exit0，候选输入 SHA `11b1313558ef9191b68ceb7e749b4a7fca8733d3883262871ce1d0e5a1f3368a`，3196 输入，`input-stability.json` changed=[]。 |
| 真实 Chromium | cwd `packages/library-lab`；`pnpm exec playwright test --config=.local-evidence/quality-playwright.config.ts e2e/quality-remediation-nuqs.spec.ts e2e/quality-remediation-tailwind-merge.spec.ts e2e/quality-remediation-primitives-sources.spec.ts --grep '@C19|@C21' --trace=off` | candidate21 `browser.json`/`browser.txt`：2026-11-10 18:24:58–18:25:07 UTC，exit0，implicitBuild=false。混合6 PASS；C19是三交互目标和一个官方来源展示，共4 PASS。 |
| 官方请求 | 仓库根 `python packages/library-lab/entries/C19-nuqs/validation/fetch-official.py` | entry `validation/official-fetch.txt`、`official/source-evidence.json`：exit0，registry/tree/manifest/README/官网五次实际 GET200；官网正文 NOT_READ，iframe未确认。 |
| 作者最终静态检查 | 仓库根 `pnpm --dir packages/library-lab exec node entries/C19-nuqs/validation/metadata-check.mjs` | `validation/final-record-metadata.txt`：2026-11-11 05:43:40 UTC，exit0，19输入/八源/12Nuqs+2Core/9发布链接通过。format/diff日志同在validation；这类检查未替代实际SDK/UI。 |

## 限制与处置

无新增 P1/P2。该版本兼容桥属于示例自建集成，正文明确 unstable 接口和升级复验要求，未掩盖内置 adapter 在当前组合的旧失败。官网维持 unknown，并提供直达路径，符合来源标准。

正式 sdk/build/browser receipts：**NOT_RUN**，待获授权的干净已提交输入和 recorder；此复核不授予提交授权。系统 IME、读屏、SSR/hydration、真实后端、独立项目迁入、全局缓存/队列泄漏普查：**NOT_RUN**，均已在 `local-validation.md:63` 或正文准确限定。合成 composition、DOM 卸载不被扩大为这些未测结论。

复核仅新增本报告，没有更改 C19 条目、公共源码、依赖、锁文件、queue 或 task-log。
