# C14 date-fns 作者最终本地验证

**FINAL STABLE，交独立复核；不自行content_done。** 实际cwd为 /home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab。原11文件clean、HEAD1218066e706a90ba03fac8dff8c9b843dd2429c4与初始SHA见 [baseline](validation/baseline.json)。保留recreated/原恢复来源事实，未改公共源码、e2e、runner、依赖、锁、索引、队列/results，未提交/推送/安装。作者没有运行全目录generate/typecheck/build或重复有效SDK/browser。

## 六项结论

| 项目 | 结论 | 实际范围 |
| --- | --- | --- |
| 技术准确 | PASS（限定配方） | 真实SDK4项+独立低高年instant1项分段有效；25安装源码/类型SHA匹配；原低年FAIL和契约收窄明确 |
| 中文讲解 | PASS（静态审阅） | 三目标输入→处理→结果、操作步骤/错误恢复/状态owner、现代日历与instant区别、format无in真实语义、部署TZDB限制 |
| 可操作Demo | PASS（root固定候选18） | 三个真实React目标全部通过；无假SDK、fake clock、route替换；不推断OS IME/任意时区 |
| 源码可迁移 | PASS（静态+当前候选） | 六运行源完整，入口strict0；已构建/浏览器六源逐字节一致；无Lab alias/自有异步资源 |
| 官方原README | PASS（原文/版本/摘要） | 固定v4.4.0提交下core4.4.0/tz1.5.0，两包README原字节与安装包相同；实际完整tree无匹配官方中文 |
| 官网预览 | unknown，准确 | 实际GET200，完整原始头；XFO/CSP null，无Lab-origin浏览器嵌入确认；官方页unknown与原文case实际PASS，未改allowed |

正式verification.json的sdk/build/browser三status仍NOT_RUN；notes仅说明本地与主控收据。实际结果不等于正式runner收据，也不冒充发布、CI、任意平台或用户手动验收。

## 目标与真实边界

1. basic：严格YYYY-MM-DD/三时区，真实TZDate公共setter后完整字段回读，输出当地中午与原生UTC instant。编辑清结果；非法进位/低年拒绝可恢复；重置/离开重进清本轮session。
2. business：count1–14安全整数，真实addDays带in上下文；NY春23/秋25小时，上海/UTC24，日历差独立；9999结果越界拒绝。
3. advanced：仅消费独立明确instant，固定NY春秋和两条秋季01:30对照。不再因无关civil/count草稿失效。真实parseISO覆盖0001/0096/9999；缺偏移/-00:00/非法日期拒绝并可恢复。

**原失败保留。** [sdk-checkpoint.txt](validation/sdk-checkpoint.txt)初次3PASS/1FAIL exit1，0096年三时区中午正例失败。实际 [low-year-probe.txt](validation/low-year-probe.txt)显示上海0096/1900 setter回读11:59:17，纽约12:00:02，UTC正确。未改依赖/私有算法，不把失败改写为通过。示例日历明确1901–9999（本例白名单现代业务规则，不是库全球下界），并回读分秒毫秒。后续真实1901/2024/9999三个区正例仍调用SDK；guard拒绝本身属于应用policy。

[sdk-modern-contract.txt](validation/sdk-modern-contract.txt)真实4/4 exit0：现代边界与闰日、DST/小时/输入不变、advanced独立输入、三hostTZ子进程（固定NY2026+UTC1901）一致。新增 [sdk-instant-boundaries.txt](validation/sdk-instant-boundaries.txt)仅1/1 exit0：实际parseISO低高年和0096+08、TZDate无in保留区/显式UTC格式。后者不改变前4项运行逻辑，未重跑有效4项。当前5项分段有效，格式变化无语义变化。纯 [policy.txt](validation/policy.txt)3/3不调用SDK，不计SDK数。

## 候选18实际构建与浏览器复用

已实际阅读root原始记录，不是只转述消息。[shared-evidence.json](validation/shared-evidence.json)保存完整command/cwd/UTC/exit/log路径、输入与公共提案SHA、四条原始C14通过行，metadata检查将当前六运行源同时对比candidate18 inputs与源码审计，6/6相同。作者提案已同步root仅格式后的公共文件，字节/候选SHA相同；复用该真实全Lab type0与new-e2e lint0，不再重复它们。

- 根cwd /home/lambert/githubRepos/lambert/ReactLoom：pnpm --filter @reactloom/library-lab typecheck、build、catalog:check，candidate18分别exit0；public新e2e Biome exit0；input-stability changed=[]。完整argv见根 docs/library-lab/evidence/quality-upgrade/candidate-18/results.json。
- 浏览器cwd为Lab：pnpm exec playwright test --config=.local-evidence/quality-playwright.config.ts e2e/quality-remediation-arborist.spec.ts e2e/quality-remediation-date-fns.spec.ts e2e/quality-remediation-primitives-sources.spec.ts --grep '@C11|@C14' --trace=off。实际整轮8/8 exit0，其中C14三目标+官方4/4；17:16:01.123522至17:16:10.504722 UTC，implicitBuild=false，固定dist18/4319。
- basic实际检查三时区真实结果、非法/现代下界、重置、Enter和离开重进；business检查23/25/24/71小时与结果范围拒绝；advanced检查fold/缺偏移恢复/明确instant0001–9999/390宽度。官方case检查原文与有证据unknown，不等于官网iframe内容可嵌入。
- 本次release只改guide私有链接、agent/verification notes、审计/metadata/报告及提案排版；没有改变已验证六运行源和原README/官网metadata。修正文档本身不宣称已重新构建展示。

## 官方版本与维护

[原证据](official/source-evidence.json)：匿名9次实际HTTP，两个npm版本gitHead均null；真实tag v4.4.0指向 cd53d2538cfa318404eff7ade6449b49bf34562e；固定pkgs/core4.4.0及pkgs/tz1.5.0 manifests匹配安装，旧独立tz仓库不作为1.5.0来源。完整tree与候选清单实存，无匹配官方中文：

- [主README](official/readme.md)：README.md，英文4.4.0，1814B，SHA256 87237646806588ea43e8a7d4c13880d09b42b14ab0a4b0bbb944855f25b82232。
- [tz README](official/tz-readme.md)：pkgs/tz/README.md，英文1.5.0，9377B，SHA256 dc3a4466b53f9a5d2f06e0e3a5d38ce2858f565481471ec3747aee5f0718b264。
- 同步UTC 2026-11-10T17:03:33.235450+00:00；两份均与安装README完全相同。主字段包含repository/commit/path/sourceUrl/version/language/time/SHA，tz元数据独立存在source-evidence中。官网GET final200、正文NOT_READ、XFO/CSP显式null，保存原始重复headers，公开Set-Cookie值已摘要隐去。
- [fetch-official.py](validation/fetch-official.py)完成所有获取后再双README+JSON全部暂存，再逐个replace；传输失败独立failed JSON并抛出，不提前写README/不finally覆盖旧成功。不是跨文件OS事务/崩溃恢复保证。
- [source-tool-transport.txt](validation/source-tool-transport.txt)受控urllib fixture3/3：完整成功、首请求失败、双README后官网失败；三份旧成功文件保留、重复头不丢。它不产生新官方HTTP、SDK或浏览器PASS。

[安装源码审计](validation/sdk-source-audit.md)与 [25文件SHA](validation/sdk-source-audit.json)核公开API、上下文/clone、trunc、parseISO、TZDate UTC表示与生命周期。本地检查再次逐份读实装文件比SHA，非SDK调用。guide只保留renderer允许的实际source链接与固定HTTPS上游，私有维护链接集中本记录。

## 作者定向命令/退出码/日志

下表均实际执行于Lab cwd；完整argv/UTC保存在 [local-runs.json](validation/local-runs.json)。历史FAIL未删除。原入口strict与格式有效结果复用；metadata最终复核25源码/12文档链接/六候选源/双README/四浏览器case/proposal候选绑定。格式info只是模板字面量建议，exit0无error。

| 实际命令 | exit | 日志 |
| --- | --- | --- |
| `pnpm exec biome check --write entries/C14-date-fns/examples entries/C14-date-fns/tests entries/C14-date-fns/library.json` | 0 | [validation/format-checkpoint.txt](validation/format-checkpoint.txt) |
| `pnpm exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/C14-date-fns/examples/demo.tsx` | 0 | [validation/typecheck-checkpoint.txt](validation/typecheck-checkpoint.txt) |
| `node --test entries/C14-date-fns/tests/sdk.test.mjs` | 1 | [validation/sdk-checkpoint.txt](validation/sdk-checkpoint.txt) |
| `pnpm exec node --input-type=module -e 'import {TZDate,tzOffset} from "@date-fns/tz"; for(const zone of ["America/New_York","Asia/Shanghai","UTC"])for(const year of [96,100,1900,2024]){const d=TZDate.tz(zone,0); const read=()=>({fields:[d.getFullYear(),d.getMonth()+1,d.getDate(),d.getHours(),d.getMinutes(),d.getSeconds()],time:+d,offset:tzOffset(zone,d)});d.setFullYear(year,1,29);const afterYear=read();d.setHours(12,0,0,0);console.log(JSON.stringify({zone,year,afterYear,afterHours:read()}));}'` | 0 | [validation/low-year-probe.txt](validation/low-year-probe.txt) |
| `pnpm exec node --test entries/C14-date-fns/tests/sdk.test.mjs` | 0 | [validation/sdk-modern-contract.txt](validation/sdk-modern-contract.txt) |
| `pnpm exec node --test entries/C14-date-fns/tests/instant-policy.test.mjs` | 0 | [validation/policy.txt](validation/policy.txt) |
| `python3 entries/C14-date-fns/validation/fetch-official.py` | 0 | [validation/official-capture.txt](validation/official-capture.txt) |
| `pnpm exec node --test --test-name-pattern 'actual explicit-offset low/high-year' entries/C14-date-fns/tests/sdk.test.mjs` | 0 | [validation/sdk-instant-boundaries.txt](validation/sdk-instant-boundaries.txt) |
| `python3 entries/C14-date-fns/validation/source-tool-transport-fixture.py` | 0 | [validation/source-tool-transport.txt](validation/source-tool-transport.txt) |
| `pnpm exec biome check --write entries/C14-date-fns/examples entries/C14-date-fns/tests entries/C14-date-fns/library.json entries/C14-date-fns/verification.json` | 0 | [validation/format-modern-checkpoint.txt](validation/format-modern-checkpoint.txt) |
| `pnpm exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/C14-date-fns/examples/demo.tsx` | 0 | [validation/type-modern-checkpoint.txt](validation/type-modern-checkpoint.txt) |
| `pnpm exec node entries/C14-date-fns/validation/metadata-check.mjs` | 0 | [validation/metadata-final.txt](validation/metadata-final.txt) |
| `pnpm exec biome check --write entries/C14-date-fns/validation/metadata-check.mjs entries/C14-date-fns/verification.json` | 0 | [validation/format-final.txt](validation/format-final.txt) |
| `git diff --check -- entries/C14-date-fns` | 0 | [validation/diff-final.txt](validation/diff-final.txt) |

## 变动与未测

10个原文件改动：guide、agent、library、verification、example/demo、instant-policy与声明、两tests；其中instant-policy及其tests仅格式，策略语义保留。新增date-contract.ts与scoped CSS，新增official双原文/证据、validation抓取/维护fixture/审计/完整浏览器提案/metadata/日志与摘要、本记录；没有删除合格成果。最终具体文件与SHA见validation/input-hashes.json，运行六源对candidate18固定输入绑定。

尚未测：真实OS IME/触屏、任意IANA区与历史日期、日历1901以前、所有ICU/TZDB/浏览器矩阵、SSR hydration、持久化/后台调度/部署/全量回归。无新SDK/polyfill/worker补丁。独立非作者review待主控调度，不自行标content_done。

最终写入结束后全部停写，交接顺序为作者STABLE→非作者独占报告→必要原作者增量修复。未启动后台写者。

最终收口：final-bind.txt exit0、diff-after-report.txt exit0；元数据/12链接/25安装SHA/六候选源/公共提案及C14四条实际browser结果再次比对成功。最终UTC 2026-11-10T17:21:01.867707+00:00，作者全部停止写入，无活动进程。
