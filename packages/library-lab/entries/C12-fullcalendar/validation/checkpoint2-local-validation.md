# C12 FullCalendar：第二个INTERMEDIATE稳定检查点

UTC `2026-11-10T16:26:35.260269+00:00`；实际cwd `/home/lambert/githubRepos/lambert/ReactLoom`，HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。原11文件无diff，SHA见[baseline](validation/baseline.json)。只写自有C12，保留其他工作者；没有公共/依赖锁/e2e/队列/results变更，没有install/全目录generate/typecheck/build/提交。先前暂停去修C06时的完整中间状态保留[checkpoint1](validation/checkpoint1-local-validation.md)，C06已另外交付稳定。

当前六生产源与metadata一致，正常排版、共享插件/locale/fixture、真实datesSet/API读取、drop/resize receipt和revert、level/reset与alive/epoch边界均已实现。显式firstDay=0覆盖中文locale周一起始，让同一周确实包含Nov1 DST与Nov2复盘；否则初始Nov1周不含Nov2。eventClass是匹配v7真实hook，给SDK真实事件DOM稳定标记；不是自己画日历。时间/ID策略算法保留，仅三处字符串拼接等价模板排版。

## 六项中间状态

| 项 | 当前结论/剩余 |
| --- | --- |
| 技术准确 | 实装/Node SDK2/策略4与局部strict有效；完整browser NOT_RUN。旧纯Date SDK项已换真实FullCalendar formatDate，UTC05:30/06:30。 |
| 解释清楚 | 中文guide/agent已按3目标重写，区分SDK模型/DOM/React权威、半开日期、同步本地409与TZDB边界；最终独立复核待root。 |
| Demo有用 | NOT_RUN客户端：3目标源可编译，真实导航/日历/拖动/缩放/revert未执行；完整browser-proposal尚待完成。 |
| 源码可迁移 | 六必要源与三官方CSS入口/局部宽度断行齐；strict通过。最终源审计/迁移宿主和SSR hydration未测。 |
| 官方来源可靠 | 固定原文/8真实HTTP与library绑定齐；最终metadata审计未跑。官网XFO DENY+CSP frame-ancestors none→blocked，无真实iframe。 |
| 结果可复核 | 日志齐、限定SDK/类型有效，整体运行/正式NOT_RUN；最终摘要与3完整提案未完成，不计content_done。 |

## 已执行检查

原始cwd/argv/UTC/exit见[local-runs](validation/local-runs.json)。最早format-code的helper3 info现等价收为模板，未因此重跑SDK/策略。当前root cwd的`pnpm exec -- biome check --write`仅examples/library/source-evidence，exit0/8文件，见[checkpoint-format](validation/checkpoint-format.txt)。`pnpm --dir packages/library-lab exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/C12-fullcalendar/examples/demo.tsx` exit0，见[checkpoint-types](validation/checkpoint-types.txt)。本轮包括firstDay/eventClass真实v7属性，不能套前一次类型结果。

此前Lab cwd `node --test entries/C12-fullcalendar/tests/sdk.test.mjs` 2PASS/0SKIP见[sdk](validation/sdk.txt)；`calendar-policy.test.mjs`4PASS/0SKIP见[policy](validation/policy.txt)。后续仅UI hook/指南/metadata、helper等价排版，SDK共享插件/formatter及原策略行为未变，复用有效结果。不是Calendar DOM运行PASS。

仓库根`python3 packages/library-lab/entries/C12-fullcalendar/validation/fetch-official.py` exit0：8真实匿名GET，见[official-fetch](validation/official-fetch.txt)。npm缺gitHead，官方v7.1.3 annotated tag38e3df0e36a7197889be8c67148b8bc87c7700b4解引用6b890e803c66d1e6db2fb21c449936155b7e81fc，固定React manifest7.1.3。主[原文](official/readme.md)2405B/en/SHA9deb5ffbab60d6d8010097a95149614ec8ae0c41b06508db187b80c136ac983b，中文候选/完整头/日期在[source-evidence](official/source-evidence.json)，library已绑定。后仅补tag字段/摘要，源脚本AST有效、没有重复HTTP。

还需：真实安装源码审计、共享schema/official metadata最终校验、三完整Playwright提案与其类型/格式、最终六项/文件清单与输入摘要。正式verification三项NOT_RUN不改，root匹配构建做实际browser；不虚称内容完整。**INTERMEDIATE STABLE：停止全部C12写入含文档/日志/metadata，等待candidate17明确release。**
