# C19 nuqs：作者最终本地验收记录

本次接续现有工作区成果，基线HEAD为 `1218066e706a90ba03fac8dff8c9b843dd2429c4`；原始11文件摘要在 `validation/baseline.json`。当前八份运行源与candidate21逐字节一致，收尾只改讲解、agent、正式状态说明和本条维护材料。没有改公共router、测试接线、依赖、锁文件、生成目录、queue或task-log，也没有提交或推送。当前为 **作者FINAL STABLE，待非作者六项复核**，不能据作者交付自行标content_done。

## 六项作者复核

| 维度 | 结论与证据层级 | 具体依据 |
| --- | --- | --- |
| 技术准确 | PASS，匹配安装源码/类型 + 真实SDK/Chromium | nuqs2.10.1/MIT；12份安装Nuqs文件、2份Router Core文件摘要/行段在sdk-source-audit.json。真实useQueryStates和公开custom provider，当前@tanstack/react-router1.170.42/Core1.171.35通过href入口分开路径与查询；默认值、null清除、parseInt宽松解析与业务夹取分层。SDK6与UI3目标分别有证据。 |
| 解释清楚 | PASS，最终中文静态复核 | guide以RSS筛选的草稿→应用→SDK状态→实际URL→业务结果为主线，展示provider位置及一次setter提交关联参数；说明history、IME和当前版本桥的必要性。5条RSS是本地fixture，无后端/Query/HTTP。失败过程归本维护记录。 |
| Demo有用 | PASS，真实Chromium三目标 | basic实际分享/刷新/自有键清除与组合草稿；business关联筛选/清页码/replace/空态恢复；advanced真实push/replace/Back/Forward、abc/99/2tail、逻辑重复参数/hash、390px和卸载重挂。candidate21三case均PASS，未替换目标SDK或手写结果。 |
| 源码可迁移 | PASS，八源入口strict/格式 + 发布结构检查 | sourceFiles完整列出example/demo、兼容桥、共享parser/策略及各声明、scoped CSS。上下文要求明确；alive/generation只保护本组件晚回，外层真实SDK HistorySpy保留所属订阅清理，不私有reset他人队列。八源逐字节匹配已运行候选；独立迁入项目尚未运行。 |
| 官方来源可靠 | PASS，5次真实HTTP + 固定原文/unknown展示 | 47ng/nuqs固定npm gitHead；目标包目录无README/匹配中文候选，回退根英文原文31845B，SHA与安装README一致。manifest的0.0.0-semantically-released如实保留。官网GET200无XFO/CSP，实际嵌入未确认而保持unknown；candidate21只验原文及unknown面板，不冒称iframe成功。 |
| 结果可复核 | PASS，本地分层证据；正式收据NOT_RUN | 下列argv/cwd/exit和原始日志可追溯；validation/final-validation-binding.json绑定候选、当前八源、原文和日志摘要，metadata检查复核运行源与候选一致。本地SDK6、policy6、UI3+官方1共4项浏览器PASS各自独立；正式三个status继续NOT_RUN。 |

## 实现与可观察结果

三个level实际调用同一份 `queryParsers`/`URL_KEYS`，前缀为 `ll_c19_`。输入框允许尾随空格；应用时才去控制字符、trim、按80码点截断。basic忽略残留group；business/advanced按分组与查询过滤，再按每页2条夹页。SDK的 `2tail→2`、非法 `abc→默认1` 与业务的 `99→末页` 分开展示，读取不自动改写原始URL。三个相关键用一次setter提交，调用级replace防止page默认push抬高整批history；仅advanced翻页明确push。

兼容桥是示例自建集成，使用nuqs公开 `unstable_createAdapterProvider` 与真实Router hook/navigation。完整URL传href，由Router自己的parseHref/parseSearch处理；to在当前组合中按路径/模板处理。直接Object.fromEntries传search会使数字字符串按Router默认JSON策略编码，不是等价修复。读端按Router逻辑数组展开给nuqs，重复参数保逻辑值及顺序，未承诺原始query字节。外层真实内置NuqsAdapter保留HistorySpy的Back/Forward/GO队列重置和所属unsubscribe；透传公开defaultOptions/processUrlSearchParams、state/hash/replace/resetScroll。升级任一方后需核公开unstable接口及真实历史行为。

组合输入期间只改草稿、不提交或让URL回填覆盖。确认Enter保持到keyup；Space/鼠标确认后的普通Enter仍能应用。页面同时展示真实location.searchStr、SDK解析和业务模型，setter Promise结束只作为SDK队列提示，不代表路由loader/网络/持久化完成。alive/generation阻止本组件卸载或过期回调写React state，不是取消SDK全局URL队列。卸载保留URL、丢未应用草稿；未注册应用timer、网络、Worker或全局监听。

candidate20旧内置adapter组合三case均FAIL，首次URL写入将查询值尾附 `?tab=docs`。日志 `docs/library-lab/evidence/quality-upgrade/candidate-20/browser.txt` 保留，未放宽原业务断言。root与作者通过安装源码/公开Router模型定位边界，模型probe不是浏览器PASS。candidate21在修后八源构建运行原三目标，全部PASS；只增加独立逻辑host数组/hash观察。历史checkpoint、初始类型/格式错误均保留在validation，不覆写成成功。

## 官方原文与官网

仓库 `47ng/nuqs`，固定提交 `691a473226bba0ddb93bc3a1010c8fa4e777c45f`，来自npm2.10.1的gitHead；原文路径 `README.md`、语言en，同步 `2026-11-10T17:58:57.733168+00:00`。原文31845B/SHA-256 `de5eb7cbf51d0a8c0eecd79146a7e61e6dadfbd0132f3f26a73f91fa569d66eb`，与安装包README逐字节相同。官方源包manifest实际为 `0.0.0-semantically-released`，发布/安装版2.10.1，未改写成一致值。完整tree未截断，目标包目录没有README，匹配范围没有官方中文候选。

5次真实GET均200：registry、固定commit完整tree、目标包manifest、README、https://nuqs.dev。官网body为NOT_READ；rawHeaders保留重复字段与顺序，匿名Set-Cookie值脱敏并保留摘要/属性，没有读取或使用账号凭据。最终响应无XFO/CSP只是头部事实，`browserFromLabOrigin=NOT_RUN`，homepage保持unknown。candidate21实际核验原文及unknown说明/直达入口，未据iframe load或超时推导允许嵌入。

抓取工具在全部成功后暂存并替换成功文件对；失败写独立failed记录并抛错，不破坏旧原文。临时受控传输fixture有成功/首请求失败/取README后官网失败3项PASS，未真实访问网络；它们只验证维护工具，不新增官方HTTP或SDK证据。收尾未再抓取上游。

## 实际命令与证据

作者命令默认cwd为仓库根 `/home/lambert/githubRepos/lambert/ReactLoom`；`pnpm --dir packages/library-lab exec` 的目标进程在Lab包目录。日志首行保存真实cwd、argv、UTC和exit；`validation/local-runs.json`汇总现存原始记录，不补造缺失时间。以下为主要范围：

| 命令/范围 | 结果 | 原始证据 |
| --- | --- | --- |
| pnpm --dir packages/library-lab exec node --test entries/C19-nuqs/tests/sdk.test.mjs | exit0，6PASS/0SKIP，REUSED | validation/sdk.txt；真实Nuqs parser/loader/serializer，不证明React适配器 |
| pnpm --dir packages/library-lab exec node --test entries/C19-nuqs/tests/url-policy.test.mjs | exit0，6PASS/0SKIP，REUSED | validation/policy.txt；独立业务/组合策略 |
| pnpm --dir packages/library-lab exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/C19-nuqs/examples/demo.tsx | exit0，REUSED | validation/adapter-types-resolved.txt；八源入口 |
| pnpm exec biome check --write 本条adapter/example；完整proposal严格类型/格式检查 | exit0，REUSED | validation/adapter-format-resolved.txt、proposal-types-adapter.txt及proposal-format.txt |
| python packages/library-lab/entries/C19-nuqs/validation/fetch-official.py | exit0，5实际HTTP200，REUSED | validation/official-fetch.txt、official/source-evidence.json、official/readme.md |
| python packages/library-lab/entries/C19-nuqs/validation/source-tool-transport-fixture.py | exit0，3PASS，REUSED | validation/source-tool-transport.txt；仅受控维护工具 |
| pnpm --dir packages/library-lab exec node entries/C19-nuqs/validation/metadata-check.mjs | exit0，当前静态/绑定复核 | validation/final-record-metadata.txt；八源/12Nuqs+2Core文件/原文/发布链接/formal状态/候选真实4case |
| 本条维护JSON/metadata脚本Biome与scoped diff检查 | exit0 | validation/final-record-format.txt、final-record-diff.txt |

root实际共享构建只读复用：candidate21输入SHA `11b1313558ef9191b68ceb7e749b4a7fca8733d3883262871ce1d0e5a1f3368a`、3196输入，稳定性 `changed=[]`。仓库根执行新e2e定向Biome、`pnpm --filter @reactloom/library-lab typecheck`、`build`、`catalog:check`均exit0；argv、UTC、cwd和各log在该候选 `results.json`。这不是本条独立正式build收据。

root浏览器cwd为 `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`，实际命令：

```sh
pnpm exec playwright test --config=.local-evidence/quality-playwright.config.ts e2e/quality-remediation-nuqs.spec.ts e2e/quality-remediation-tailwind-merge.spec.ts e2e/quality-remediation-primitives-sources.spec.ts --grep '@C19|@C21' --trace=off
```

`docs/library-lab/evidence/quality-upgrade/candidate-21/browser.json`记录开始 `2026-11-10T18:24:58.132289+00:00`、结束 `18:25:07.331581+00:00`、exit0、implicitBuild=false。混合命令共6PASS，本条是三真实目标+原文/unknown展示 **4PASS**；其余2项属于C21，未计入本条。browser-binding及browser-build-binding保留实际dist与testSources摘要，提案与公共实际Nuqs套件同SHA `fd637a0295a996fe308490ea47abceea48a8e8922497aef7c6b205dc1ba66bb9`。旧candidate21-binding/checkpoint中的“newBrowser NOT_RUN”是运行结束前的历史状态，最终以本记录与final-validation-binding为准。

## 最终产物与剩余事项

八份运行源、两个SDK/策略套件、中文guide/agent/条目规则、library/verification、原文快照/来源、完整浏览器提案、安装源码审计及原始命令日志均在本entry。当前protected文件摘要见 `validation/input-hashes.json`；最终绑定和命令ledger为维护产物，不作为正式recorder收据。

正式 `verification.sdk/build/browser` 全部 **NOT_RUN**：尚无当前干净、获提交授权的输入及正式recorder运行，不能为了记证自行提交。非作者六项复核待主控安排。系统IME、读屏、SSR/hydration、全局缓存/队列泄漏普查、真实后端、独立项目迁入未运行；本例没有把这些能力列为已实现Demo目标。最终记录完成后本entry停止写入，无后台任务。
