# C07 局部整改与交接记录

本记录只证明列出的定向检查，不是平台正式 sdk/build/browser 收据。正式 verification.json 三项保持 NOT_RUN。主控统一执行共享候选与真实浏览器；本工作者未运行全目录 generate/typecheck/build，也未启动隐式 build 的浏览器命令。

## 范围、输入与变动

- 实际仓库 cwd：`/home/lambert/githubRepos/lambert/ReactLoom`；以下 pnpm 检查实际 cwd 为其 `packages/library-lab`。
- Git HEAD：`1218066e706a90ba03fac8dff8c9b843dd2429c4`。开始研究时本条目 11 个受控文件，无本条目既有 diff；条目输入摘要与 Git HEAD 是不同概念。本轮未提交、推送或改公共输入。
- 只修改 `entries/C07-tanstack-table/**`。保留原 RSS fixture、v9 features、稳定 rowId、受控选择/排序/分页、IME、identity/epoch/lease 与缩页后重取的语义。
- 原 2 个真实 SDK 目标保留；原 10 个 page-policy 目标保留。新增 2 个 SDK 目标验证同源 fixture/features → 实际行模型 → SSR DOM 和 manual 跳过二次处理。没有把纯策略当 SDK。
- `example.tsx` 增加真实行模型 ID 检查器、数量链、加载/失败/空状态及语义 DOM/testid。错误展示增加 generation 匹配，避免同身份新一代重试展示旧错误。明确保留 `retry` 的 effect 依赖，显式恢复/刷新相同参数仍重新读取。
- `table-data.ts` 提取原 features、Feed 与 18 行数据；`fixture-page.ts` 提取原 360ms 可取消本地来源；`workshop.css` 只做本地布局/焦点/表格内部横向滚动。Table 本身不发 HTTP、不筛选本例 query、不生成 DOM 样式。
- 变动文件：`guide.md`、`agent.md`、`library.json`、`verification.json`；`examples/{demo.tsx,example.tsx,page-policy.mjs,page-policy.d.mts,table-data.ts,fixture-page.ts,workshop.css}`；`tests/{sdk.test.mjs,page-policy.test.mjs}`；`official/{readme.md,source-evidence.json}`；本记录与 `validation/*.txt`。AGENTS.md 未变，page-policy/原测试格式整理不改变其策略。

## 六项复核

| 项目 | 当前结论 | 可复核依据与限制 |
| --- | --- | --- |
| 技术准确 | PASS（源码/类型/定向 SDK） | 本地 React adapter/core 均 9.2.4；useTable/tableFeatures、core 自动提供、sorted/paginated factories、manual flags、rowCount、选择物化范围与实际类型/SDK一致。客户端应用先 filter；本地服务端 fixture 自行 sort/slice；不套 v8 useReactTable 构造 API。 |
| 解释清楚 | PASS（静态自审） | guide 从原始数据→data→core→sorted→最终行→DOM，说明关键输入输出、客户端全量和服务端当前页的处理所有权、三次独立操作和可见预期；agent 与源码/metadata同步。 |
| Demo 有用 | NOT_RUN（真实浏览器待主控） | 三目标分别是排序/身份、客户端分页、manual 当前页/请求所有权。SDK已验证模型与SSR DOM；鼠标/键盘、IME、360ms effects竞态与移动布局仍需真实浏览器。 |
| 源码可迁移 | PASS（局部类型/文件检查） | 正常排版；7个必要运行文件均列入每个Demo sourceFiles；React>=18、SDK固定版本、CSS与.ts导入前提写明，真实HTTP替换需应用API client+signal+rows/total校验。 |
| 官方来源可靠 | PASS（固定原文/HTTP证据） | README固定同版本官方提交、原文7231字节及sha256；无中文根/目标包候选，明确英文回退。官网GET200实际返回XFO DENY，blocked依据充分，Lab-origin browser NOT_RUN。 |
| 结果可复核 | NOT_RUN（整体验收） | 以下局部SDK/策略/类型/格式/metadata各自独立记录。正式三项NOT_RUN，完整浏览器与主控候选收据尚待接入；局部结果不替代最终验收。 |

## 匹配版本与官方来源

本地 `node_modules/@tanstack/react-table/package.json` 为9.2.4，依赖 `@tanstack/table-core`9.2.4，MIT、React peer>=18。核对本地adapter `dist/useTable.d.ts`、core `dist/core/row-models/coreRowModelsFeature.types.d.ts`、`utils.d.ts`、row-sorting/row-pagination类型和随包官方getting-started/migrate-v8-to-v9/client-vs-server说明；文档事实以匹配9.2.4类型/源码为准。v9自动包含core工厂，但实例`table.getCoreRowModel()`仍有效，两个概念不能混淆。

- 标签：`@tanstack/react-table@9.2.4`；`git ls-remote --tags https://github.com/TanStack/table.git '*9.2.4*'`解析到提交 `d01c01bedbab0ff6c2641f18b2fc9a11545d9bf6`。
- 固定官方[目标包README](https://github.com/TanStack/table/blob/d01c01bedbab0ff6c2641f18b2fc9a11545d9bf6/packages/react-table/README.md)，path=`packages/react-table/README.md`，language=`en`，version=`9.2.4`，snapshot=`official/readme.md`。
- 原文7231字节，SHA256=`913bdc81d1d575246a519cd84ef3c31b12298fa768dcfb98e9bd254085119daa`，同步时间 `2026-11-10T10:10:16.794464+00:00`。没有插入翻译或本地讲解。固定tree查到根/目标包候选README.md及packages/react-table/README.md，没有这两个范围的中文README，选择匹配React包的英文原文。
- `official/source-evidence.json` 保存urllib实际GET的初始/最终URL、HTTP状态、完整响应头、bytes和sha256；tree、原文、固定package.json、官网均200，固定package.json版本9.2.4。补查客户端/服务端官方指南链接GET200，最终URL不变。
- [官网](https://tanstack.com/table/latest)本次GET200、最终URL不变；`X-Frame-Options: DENY`，`Content-Security-Policy`未出现（显式null）。因此homepage.status=`blocked`；不是“HTTP成功就allowed”。Lab origin实际iframe未运行，直达入口仍保留。

## 定向检查与原始日志

以下命令均在 `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab` 通过Python subprocess实参数组执行，日志含完整ARGV、cwd、开始/结束时间、退出码、stdout与stderr。源码检查通过后只补文档/metadata，不重跑有效SDK/策略。

| 命令 | 退出码/结果 | 原始日志 |
| --- | --- | --- |
| `pnpm test:sdk --entry=C07` | 0；4 PASS | [sdk.txt](validation/sdk.txt) |
| `pnpm test:policy --entry=C07` | 0；10 PASS（纯策略） | [policy.txt](validation/policy.txt) |
| `pnpm exec tsc --ignoreConfig --noEmit --module ESNext --moduleResolution Bundler --target ES2022 --jsx react-jsx --strict --skipLibCheck --esModuleInterop --allowImportingTsExtensions --types vite/client,node entries/C07-tanstack-table/examples/demo.tsx` | 0 | [entry-typecheck.txt](validation/entry-typecheck.txt) |
| `pnpm exec biome check --write entries/C07-tanstack-table/examples entries/C07-tanstack-table/tests entries/C07-tanstack-table/library.json entries/C07-tanstack-table/verification.json entries/C07-tanstack-table/official/source-evidence.json` | 0；仅本条目格式整理 | [biome-format.txt](validation/biome-format.txt) |
| 同范围 `pnpm exec biome check` | 0；12文件、无修复 | [biome.txt](validation/biome.txt) |
| `node --input-type=module`（只读单条目metadata/必要文件/import/README hash/本地版本检查，完整stdin见日志） | 0；3个Demo/7个必要文件/hash/正式NOT_RUN一致 | [entry-metadata.txt](validation/entry-metadata.txt) |
| `git diff --check -- packages/library-lab/entries/C07-tanstack-table`（cwd仓库根） | 0 | [diff-check.txt](validation/diff-check.txt) |

首轮metadata检查因正在生成的本记录日志尚不存在而exit1，原始输出见[entry-metadata-initial.txt](validation/entry-metadata-initial.txt)；建立日志产物后仅重跑该检查并通过，未改SDK或策略。

首轮直接shell Biome命令实际被工具路由成`npm exec check`并exit1；该次不是源码检查结论，输出保留于[biome-shell-attempt.txt](validation/biome-shell-attempt.txt)。改为subprocess实参数组执行同一pnpm/本地Biome后成功，未安装依赖。格式整理曾尝试去除“未使用”的reload依赖，交付代码明确恢复并注释其相同参数重试用途；最终检查与SDK/类型日志均针对恢复后的代码。

## 交给主控的浏览器操作/断言

已有 `@C07` 风险流程意义保留，不需公共协议扩展。region仍是“TanStack Table v9 实际表格”。`c07-table tbody tr[data-row-id]`是真实业务行；loading/empty/error占位tr没有data-row-id。检查器展开“查看原始数据、行模型与选择ID”，读取`c07-row-model` JSON：rawFixtureIds、inputIds、coreIds、sortedIds、visibleIds、selectedIds、materializedSelectedIds、sorting、pagination、requestIdentity。

1. basic：初始18→18→18→18→18。选第一条feed-100；点击“订阅数”直到aria-sort降序，sorted/DOM首三项feed-117/116/115（最大627），input/core仍从feed-100开始。选中ID不转移；清空选择归零。
2. business：初始input/core/sorted18，DOM5；输入“技术”并查询后input/core/sorted6，DOM5，下一页DOM1。每页行数3/5/10与上一页/下一页保留；跨页选择由ID维持。检索无结果展示明确空状态。IME及229保护沿用原流程。
3. advanced：360ms完成后input/core/sorted/DOM各5、rowCount总18、页数4；翻页只给当前5条，不二次切页。选择第一页、第二页各一条后selectedIds包含二者，materializedSelectedIds只在当前输入页。
4. advanced末页“模拟后台缩减到2条”最终夹回第一页仅2条；“模拟服务端 503”出现失败且无旧页行；“恢复并刷新”恢复18条来源且当前页成功。同参数重复恢复/刷新也必须经过真实pending再成功；快速A→B→A/缩页竞态不能复活旧回包，卸载无未清timer写回。
5. `c07-status`带data-pending/data-error；`c07-model-summary`显示真实数量链；`c07-selection`带data-selected-count；`c07-pager`读取当前页/状态。375px确认页面不被表格撑宽，表格自身可横向滚动；README原文与blocked官网直达在宿主验证。

实际浏览器、移动视觉/键盘、真实HTTP/后端鉴权、全量性能、共享构建和平台正式收据均未由本工作者执行。18条本地fixture不是性能或真实服务端结果。

稳定检查点：2026-11-10T10:19:45.994468+00:00；C07 STABLE，完成此记录后停止所有条目写入，交主控独立复核。
