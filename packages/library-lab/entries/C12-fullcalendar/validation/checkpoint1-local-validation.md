# C12 FullCalendar：INTERMEDIATE稳定检查点

UTC `2026-11-10T16:15:43.591854+00:00`，实际cwd `/home/lambert/githubRepos/lambert/ReactLoom`，HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。原11文件干净，逐项sha见[baseline](validation/baseline.json)。owner=/root/quality_f05，独占C12且保留他人；未改公共/依赖/锁/e2e/队列/results，未install/提交/全目录生成或build。按root要求暂停以先修原作者C06真实移动overflow，**此处不是整库完成**。

当前六生产sourceFiles与metadata一致，实际入口严格类型exit0；三目标实现：真实datesSet/导航/getEvents与半开全天范围；严格日期/稳定ID创建、真实drop/resize receipt接受回写React；NY重复offset与fold-early同步模拟409 revert。插件/locale/初始事件抽为shared calendar-contract，基础事件增加[11/3,11/5)两日对照；state数组本身引用稳定，只有业务改变才新建；key=level/显式epoch reset重挂本子树，alive/epoch仅拒旧SDK回调，无未实现网络或server revision。

保留原calendar-policy算法/声明与policy4。SDK原第二项只有内置Date差值，现改为实际FullCalendar公开formatDate验证两个明确offset在UTC得到05:30/06:30；不造DOM，不当实际日历/拖动PASS。

已实际检查，cwd Lab，完整argv/UTC/exit在[local-runs](validation/local-runs.json)：

| 命令 | exit/范围 |
| --- | --- |
| `pnpm exec -- biome check --write entries/C12-fullcalendar/examples entries/C12-fullcalendar/tests entries/C12-fullcalendar/library.json` | 0，9文件，3个原helper字符串拼接info未unsafe自动改，见[format-code](validation/format-code.txt)。 |
| `pnpm exec -- tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/C12-fullcalendar/examples/demo.tsx` | 0，[types](validation/types.txt)。 |
| `node --test entries/C12-fullcalendar/tests/sdk.test.mjs` | 0，实际SDK2/0skip，[sdk](validation/sdk.txt)。 |
| `node --test entries/C12-fullcalendar/tests/calendar-policy.test.mjs` | 0，pure策略4/0skip，[policy](validation/policy.txt)。 |
| `python3 packages/library-lab/entries/C12-fullcalendar/validation/fetch-official.py`（仓库根） | 0，8实际匿名GET，[official-fetch](validation/official-fetch.txt)。 |

官方固定v7.1.3 annotated tag38e3df0e36a7197889be8c67148b8bc87c7700b4解引用commit6b890e803c66d1e6db2fb21c449936155b7e81fc；npm两包省略gitHead，不伪造一致。匹配React package manifest7.1.3，原README packages/react/README.md英文2405B，SHA9deb5ffbab60d6d8010097a95149614ec8ae0c41b06508db187b80c136ac983b已存[official](official/readme.md)，完整请求/tree中文候选与头见[source-evidence](official/source-evidence.json)。官网实际GET200的XFO DENY/CSP frame-ancestors none→blocked；未真实iframe。版本/首页元数据与完整中文尚待收尾，不能据已有文件标完整官方展示已验。

## 六项中间状态

| 项 | 当前状态 |
| --- | --- |
| 技术准确 | NOT_RUN整库；实际7.1.3/Temporal1.0.4、Node配置/formatter与入口strict有证据。 |
| 解释清楚 | NOT_RUN：旧guide/agent仍待按新实际源完整重写，保留当前未完成状态。 |
| Demo有用 | NOT_RUN：3目标源已实现，真实Calendar DOM/事件/拖动/resize/revert待root。 |
| 源码可迁移 | NOT_RUN完整验收：6源/3官方CSS入口/局部CSS/strict已齐，需最终说明与提案。 |
| 官方来源可靠 | NOT_RUN完整验收：成功原文/头事实齐，需source元数据与摘要收尾。 |
| 结果可复核 | NOT_RUN整体：SDK2/policy4/类型/格式/真实来源日志齐，尚无完整browser-proposal/最终审计。 |

原正式verification三项NOT_RUN不改。后续恢复：完整中文/agent、源审计与固定README元数据、真实3目标browser提案、局部格式/metadata/最终摘要；复用不变SDK2/policy4，不全目录测试。当前**停止全部C12写入（含文档/日志/metadata）**，供协调使用，不记content_done。
