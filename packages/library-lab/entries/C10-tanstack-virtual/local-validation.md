# C10 TanStack Virtual 本地质量整改

Owner quality_e05；实际cwd `/home/lambert/githubRepos/lambert/ReactLoom`，Git HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。原11文件无初始diff，原bytes/SHA在[baseline.json](validation/baseline.json)。只写C10，保留他人修改；没有安装、公共代码/锁/索引/队列/results修改、全目录generate/typecheck/build、隐式构建浏览器或提交推送。冻结中间记录归档[checkpoint-local-validation.md](validation/checkpoint-local-validation.md)。

## 六项状态

| 维度 | 当前状态/层级 | 证据与边界 |
| --- | --- | --- |
| 技术准确 | PASS（作者静态/实装/真实SDK模型） | React适配器3.14.21→精确core3.19.6；真实SSR与公开core三断言直接用共享virtual-contract。估计/测量/key/cache/视图身份语义与实装一致，未以Node模型冒充DOM。客户端三目标已由root在candidate17实际通过；OS/SSR等缺口另列。 |
| 解释清楚 | PASS（作者静态） | guide工程问题→输入/范围/DOM→三目标→迁移/取舍；统一分类/词提交，明确94估计、overscan窗口与停滚范围不同、视图重建清测量/展开的代价；独立review交root。 |
| Demo有用 | PASS（root candidate17真实浏览器） | 三目标实际滚动/筛选/重建/变高/深跳/窄屏/卸载已通过，原文/官网blocked另1case通过；精确日志见文末。 |
| 源码可迁移 | PASS（静态/入口strict） | 六生产sourceFiles含共享合同/helper声明/局部CSS；无Lab alias/网络/外部资产。保留业务ID/viewIdentity/measureElement/useFlushSync:false，SDK资源按hook所有权清理。OS读屏/SSR hydration未验。 |
| 官方来源可靠 | PASS（固定原文/真实HTTP与git） | npm缺gitHead，实际annotated版本tag peel28ff2cab…，同commit React3.14.21/core3.19.6 manifest核实；目标React无README，根5226B原文与SHA，英文/日期/候选齐。7实际GET完整头，官网XFO DENY无CSP覆盖→blocked。 |
| 结果可复核 | PASS（本地模型/类型/真实客户端）；正式仍NOT_RUN | 实际SDK3/policy6/入口strict与提案0、metadata16输入和root匹配candidate17四browser case可复读；非作者review交e11，不能代替正式收据。 |

## 保留、修正与实际调用

保留filter-policy的NFC/去ASCII控制/trim/80码点、stableRowId拒越界/空ID、viewIdentity的JSON(group,query,revision)，没有造missing-index。正常排版，抽virtual-contract.ts共享fixture/筛选/窗口选项。旧SDK第二项只是helper调用，现改为真实公开Virtualizer模型，纯身份断言留policy范围。

UI仍真实useVirtualizer，getScrollElement指实际365px可聚焦窗口、业务getItemKey/row.key、absolute/translateY、getTotalSize占位和同外层data-index/measureElement。94是未测量估计，不写固定行height；UI不调用resizeItem、不打开directDomUpdates。basic只构造8000，business/advanced只构造3400，未重复构造无用数组；工程实践筛选850。

原分类即时/词延迟混用现统一草稿，提交才一起更新；重复提交revision仍递增，VirtualList key重挂清旧滚动/测量和内部展开Set。空态显式、零行禁用跳转，重置恢复3400并重建。Enter组合守卫看ref/native isComposing/229与当前确认按键，compositionend不无条件阻止下一普通Enter；真实OS输入法没有运行。

自建停滚文字只在isScrolling=false时更新，不宣称SDK/React滚动时完全不渲染。保留useFlushSync:false为本例策略，实装适配器已有measure-from-ref的flushSync保护，已移除“默认true必然React19警告”的误导。hook挂载effect返回SDK cleanup，内部observer/scroll订阅由SDK清理；应用无网络/业务timer，不调用全局stop。源码与清理片段见[sdk-source-audit.json](validation/sdk-source-audit.json)，静态清理不等于全局泄漏普查。

## 实际检查、cwd/argv/exit与日志

外层cwd均仓库根；pnpm --dir使内层包命令cwd为Lab。完整argv/UTC/exit/stdout在下列日志和[local-runs.json](validation/local-runs.json)。未修改运行源后复用有效检查，没因文案重跑SDK。

| 实际命令 | exit/范围 | 日志 |
| --- | --- | --- |
| pnpm exec biome check --write 本条目examples/tests | 首次1，8文件正常格式化后发现控制正则与scroll region语义/焦点规则；原失败保留 | [format-code.txt](validation/format-code.txt) |
| pnpm --dir packages/library-lab exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/C10-tanstack-virtual/examples/demo.tsx | 初次0；viewport语义/注释后定向0 | [types.txt](validation/types.txt)、[types-fixed.txt](validation/types-fixed.txt) |
| pnpm --dir packages/library-lab test:sdk --entry=C10 | 0，3PASS/0SKIP，自然Node退出 | [sdk.txt](validation/sdk.txt) |
| pnpm --dir packages/library-lab test:policy --entry=C10 | 0，原4+过滤/非法身份2，6PASS/0SKIP | [policy.txt](validation/policy.txt) |
| pnpm exec biome check --write 受影响example.tsx/filter-policy.mjs | 0，2文件；保留必要键盘焦点/规范化规则，精确注释 | [format-code-fixed.txt](validation/format-code-fixed.txt) |
| python3 packages/library-lab/entries/C10-tanstack-virtual/validation/fetch-official.py | 0，真实7GET+git ls-remote | [official-fetch.txt](validation/official-fetch.txt) |
| node --input-type=module -e checkpoint metadata形状/三目标/六源检查 | 0，中间检查非最终provenance | [checkpoint-metadata.txt](validation/checkpoint-metadata.txt) |
| pnpm exec biome check --write library/verification/source-evidence/sdk-source-audit/metadata-check五文件 | 0，5文件，精确argv在日志 | [format-metadata.txt](validation/format-metadata.txt) |
| pnpm exec biome check --write 提案临时browser-proposal.check.ts | 0，1文件，回写txt后删除临时 | [proposal-format.txt](validation/proposal-format.txt) |
| pnpm --dir packages/library-lab exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --strict --skipLibCheck --types node entries/C10-tanstack-virtual/validation/browser-proposal.check.ts | 0，完整提案strict | [proposal-types.txt](validation/proposal-types.txt) |
| node packages/library-lab/entries/C10-tanstack-virtual/validation/metadata-check.mjs | 0，三目标/六源/实装版本/原文/官网/16输入 | [metadata.txt](validation/metadata.txt) |
| git diff --check -- packages/library-lab/entries/C10-tanstack-virtual | 0，最终doc范围 | [diff-check.txt](validation/diff-check.txt) |

SDK3的精确边界：SSR真实React hook无视口，0窗口、模型total37600；公开Virtualizer显式initialRect640×200、20条94px估计，实际范围0–2及含overscan8项、total1880。resizeItem人为输入152后total1938，重排业务key保留，再改另一行total1944，measure清缓存回1880。没mount、没调用private API、没造DOM/observer函数或替换时钟；提供的都是实际SDK观察/scroll函数但无元素时未执行。它们不证明真实DOM尺寸、ResizeObserver或滚动。

冻结后六运行源与checkpoint逐字节一致，因此入口strict与root报告candidate17 type/build/catalog0继续有效（全局输入SHA13e1e74df3dc155b95bf047d2129d1509fd5cda68691360aba1d20f7e6f5f4d0）。这是共享候选编译范围，非逐库正式收据；本地只补提案/metadata/文档，未全局重跑。初次公共提案格式lint失败及root仅格式化公共文件的过程由root保存，本目录保留自己的初次format失败和修后日志。

## 官方原文/维护边界

[原文](official/readme.md)固定TanStack/virtual@28ff2cab7a970f4e0908229d65a0da8803903900/README.md，React3.14.21、core3.19.6，en/5226B，SHA `24bd3ff93da253313681dbe66adab7b012caca06f03edc516dfd875a1274ff00`，同步UTC2026-11-10T16:23:31.742143+00:00。未截断tree证明React包目录没有README，安装包也不附README，故回退固定根原文；没有匹配中文候选，未拿别的框架README或自译冒充。

[source-evidence.json](official/source-evidence.json)含真实npm两版本、固定两manifest/tree/原README/官网7GET完整最终头/bytes/SHA及tag stdout。npm React无gitHead，实际annotated tag对象b809313c…与peeled commit28ff2cab…分开；不是把tag对象当提交。官网最终GET200、XFO DENY、无CSP覆盖，正文NOT_READ，blocked可由响应头确认，未标allowed或假装从Lab浏览器成功。

fetch脚本异常只写独立failed并重新抛错，全部请求与版本核验成功才双暂存再replace；不会在finally破坏已有成功对。C10未额外运行受控fixture，不虚构工具fixture通过，也没为维护改动重抓有效上游。实际源/README未格式化改写。

## 三目标浏览器交接与剩余

[完整三case提案](validation/browser-proposal.txt)已strict/格式通过，作者未执行browser，以下三case现已由root实际运行通过：basic实际8000/小型DOM、原生wheel/PageDown/深跳/回顶；business分类草稿不立即提交→850、重复同查询remount/回顶、空态/禁用/恢复，以及应用composition守卫序列；advanced真实展开/收起高度/下一行不重叠/total、深处展开、重复提交清展开、390px几何/停止DOM断开/新挂载与console/pageerror。调用真实rAF等候浏览器帧，没有替换RAF/clock/observer/SDK。合成composition只证明应用守卫，不当OS输入法通过。

c10-workshop/data-level；c10-view/data-view-identity；c10-model为真实SDKJSON；c10-scroll/spacer/row(data-row-id/data-index)；c10-filter-state是应用提交条件；c10-empty。控件保留跳转靠近末尾/回到顶部/筛选/展开长文，新增重置筛选，搜索文章与分类有标签。

仍NOT_RUN：OS输入法/读屏/触摸、SSR hydration、多实例、全局泄漏/帧率；无网络/Query/游标/横向网格或全量无障碍分页出口，不声称已实现。匹配候选browser已闭环，非作者review交e11；正式sdk/build/browser都NOT_RUN。

## 文件与交付

修改example/demo/原helper与声明正常排版、原policy保留并增加两边界、替换误标的SDK helper项为真实模型；新增virtual-contract/styles、官方原文/完整来源、审计/抓取/metadata脚本/提案/日志。AGENTS未改。完整清单见[final-files.txt](validation/final-files.txt)，16当前输入在[input-hashes.json](validation/input-hashes.json)，原始日志摘要见[log-hashes.json](validation/log-hashes.json)。完成由root决定，不自行content_done。

## candidate17真实运行闭环

实际读取[原始browser.txt](../../../../docs/library-lab/evidence/quality-upgrade/candidate-17/browser.txt)：整批12/12PASS，其中C10三个真实目标+原文/官网blocked共4PASS。初始候选输入SHA13e1e74df3dc155b95bf047d2129d1509fd5cda68691360aba1d20f7e6f5f4d0，六运行源与该稳定checkpoint逐字节未改；entry提案与公共quality-remediation-tanstack-virtual.spec.ts逐字节相同（SHA0076dddec6621fb847581cffee0b863df952c2988fd02e281a56bd03732ffd2d）。没有为文案重复SDK、策略、入口type或浏览器。

这证明当前目标的原生滚动/跳转、过滤身份/空态/重复提交和合成composition应用协议、实际measureElement变高/深处/重建/卸载，以及固定原文和blocked展示；合成协议不代表真实OS输入法，官网case不代表iframe可允许。局部六项完成层级已写上表，非作者独立review另交e11，不自行content_done。正式三status仍NOT_RUN。

最终链接检查首次因先检查后生成diff日志路径而exit1，原始记录保留final-inspection-initial.txt；调整先生成真实scoped diff日志再复读，最终16输入/六运行源/本地链接均0差异、exit0，未改产品或重复SDK。

FINAL STABLE：`2026-11-10T16:44:25.160595+00:00`。停止C10全部输入/文档/提案/日志写入，交e11非作者复核；正式status不升级，root汇总content_done。
