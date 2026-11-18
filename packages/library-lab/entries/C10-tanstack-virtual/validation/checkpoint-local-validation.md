# C10 可恢复中间冻结点（不是整库完成）

Owner quality_e05；实际cwd `/home/lambert/githubRepos/lambert/ReactLoom`，HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。root请求candidate17冻结，停止C10全部写入。本条目原11文件无初始diff；逐文件bytes/SHA见validation/baseline.json，恢复必须基于当前实际目录，不从HEAD覆盖。

## 已完成

- 保留stableRowId/viewIdentity算法与真实measureElement、data-index/业务row.key、useFlushSync:false、365px窗口、8000/3400有界fixture。正常排版并抽examples/virtual-contract.ts共享fixture/过滤/窗口选项，新增必要styles.css。
- 分类与词均作草稿，“筛选”统一提交，重复提交revision仍增加；key重挂清滚动/测量和展开。新增空态/禁用跳转/重置筛选；IME引用/native isComposing/229与确认Enter-held守卫，Space/鼠标compositionend不无条件吞普通Enter。
- 三目标中文guide/agent已完整重写：窗口与真实滚动；统一筛选/身份/空态；真实变高/深跳/视图重建。明确SDK/自建策略、估计/测量、含overscan窗口/停滚范围、完整数据/DOM不同。校正旧文案：实装适配器已有ref测量flushSync保护，本例false为显式策略，不说默认true必然React19警告。
- library三目标/六sourceFiles/official、verification.note同步；三个正式status全NOT_RUN。完整三case browser-proposal.txt已写，但尚未类型/格式检查或实际执行。
- 官方实际7GET与annotated tag真实ls-remote采集完成：React3.14.21（npm无gitHead）→core3.19.6；tag对象b809313c001e5e29ef7e960edd1985a8098b7d74，peeled commit28ff2cab7a970f4e0908229d65a0da8803903900；固定两个manifest版本一致。目标React包无README，根原文5226B/en/SHA24bd3ff93da253313681dbe66adab7b012caca06f03edc516dfd875a1274ff00，未截断tree无匹配中文。官网实际XFO DENY、无CSP覆盖→blocked，正文NOT_READ；不标allowed。
- fetch工具从开始就用except独立failed，全部获取核验成功后双暂存再replace，不重复C08的finally覆盖成功证据问题。官方原文/source-evidence、完整头/实际tag stdout与维护脚本已落盘。sdk-source-audit.json保存实装React/core四源摘要及flush/cleanup/resize/measure片段。

## 实际检查与范围

外层cwd均仓库根，精确argv/UTC/exit/stdout见validation/*.txt和local-runs.json；pnpm --dir内层cwd为Lab。没有安装依赖或运行全目录generate/typecheck/build，真实browser由root。

| 已执行 | 实际结果/日志 |
| --- | --- |
| pnpm exec biome check --write 本条目examples/tests | 首次exit1，正常格式化8文件后发现原控制字符正则及scroll region语义/聚焦规则，日志format-code.txt保留。没有删查询边界或键盘滚动。 |
| 同轮入口strict | exit0，types.txt。 |
| pnpm --dir packages/library-lab test:sdk --entry=C10 | 3PASS/0SKIP，自然退出0，sdk.txt；React SSR共享配置+公开core initialRect模型+key尺寸缓存重排/measure清空，不造DOM。 |
| pnpm --dir packages/library-lab test:policy --entry=C10 | 原4+新增过滤/非法身份2共6PASS/0SKIP，policy.txt；不当SDK或滚动证据。 |
| 只修受影响viewport为可命名section、保留焦点并精确注释；原控制正则只加精确注释 | format-code-fixed.txt 2文件exit0，types-fixed.txt入口strict再0；SDK/policy语义未变不重复。 |
| python3 validation/fetch-official.py | 实际7GET+git ls-remote exit0，official-fetch.txt；正文/headers/tag/manifest见source-evidence.json。 |
| checkpoint局部metadata形状/3目标/每目标6源存在性 | exit0，checkpoint-metadata.txt；不是最终完整metadata检查。 |

Node边界：SSR无viewport，getVirtualItems为0；core模型人为提供initialRect640x200/20条94px估计，真实执行得到total1880/8虚拟项。resizeItem人为输入152后total1938，按业务key重排保持，measure清回1880；这些不是浏览器测量/scroll/ResizeObserver通过。源正常调用目标SDK，没用假observer函数或private mount API。

## 六项阶段状态

技术：共享真实SDK3/实装源码与入口strict已核，客户端NOT_RUN。讲解：作者静态完整，待独立review。Demo：三目标源码/完整提案齐，实际DOM/滚动/变高/移动/重建/卸载均NOT_RUN。迁移：六源和必要CSS齐，入口strict0。官方：实际固定原文/版本/完整头已采集并复读SHA，最终metadata待做。结果：原始日志/失败保留，但整库未完成，不自行content_done；formal均NOT_RUN。

## release后下一步（不得在冻结期执行）

1. 对完整browser-proposal.txt复制临时.ts做定向Biome/strict，回写.txt后删除临时；检查真实交互步骤/数据断言。不要运行browser或隐式build。
2. 写并运行本条目最终metadata-check，核三目标/六源、React/core实际版本、annotated tag peeled commit、根README回退理由/SHA、官网XFO DENY与正式NOT_RUN；生成当前输入摘要。
3. 最终local-validation补齐六项/变动清单/实际cwd命令exit日志/来源/剩余，scoped diff与链接检查、文件/日志摘要；有效SDK3/policy6/类型复用，不为文案重复全套。
4. FINAL STABLE后停写，交root非作者review和匹配候选真实browser。C05/C08记录已另行收口，不再交叉写。

冻结 STABLE：`2026-11-10T16:35:58.634166+00:00`。当前运行源可编译，剩余只在明确release后继续。停止全部C10输入/文档/提案/日志写入。
