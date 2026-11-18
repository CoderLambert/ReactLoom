# 2026-11-18 主控闭环补充

六项本地质量PASS。真实SDK4项、非作者新数据consumer通过；浏览器4项覆盖基础与频道/团队、完整竞态、超旧请求时长的重置/切换以及官方来源。候选25及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/D12.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# D12 本地质量整改与证据

本轮只写D12目录；保留createSlice/configureStore、独立团队store和React useSyncExternalStore模型。旧SDK测试复制了另一套slice，现改为真实SDK加浏览器同一 `examples/store.mjs`。从UI中提取唯一store源码并添加 `.d.mts`，保留行为：稳定ID去重/已读、旧响应拒绝、完整reset。补齐“重置也清理timer”，避免reset后旧任务又改变ignored。

三层现在各自呈现动作计数、团队频道隔离、独立异步身份实验；进阶移除重复的计数/频道操作，显示团队ID、发起顺序与回包计划（350ms新、1000ms旧）。这些仍是本地timer fixture，不是网络和服务端权限。参数仅为可观察顺序，不是性能承诺。

## 六维复核

| 维度 | 状态/证据层级 | 依据 |
| --- | --- | --- |
| 技术准确 | PASS：版本源码与真实SDK执行 | 实装2.13.0；固定官方README；实装src/getDefaultMiddleware.ts核对开发检查；configureStore默认中间件保留，DevTools关闭；createSlice draft及action前缀与state挂载键区别；不再将序列化警告说成拒绝机制；SDK4/4 |
| 解释清楚 | PASS：静态自检，独立复核待主控 | guide选型→动作/快照模型→完整接入→三实验→真实边界；SDK、自建业务及fixture逐项区分 |
| Demo有用 | NOT_RUN：源码与SDK已核对，真实交互待主控 | 三个独立目标；先进/后回顺序可见；browser提案覆盖计数、已读保持、团队隔离、竞态、reset稳定和切换清理 |
| 源码可迁移 | PASS：单文件TS及静态自检 | store.mjs+d.mts与example.tsx齐全；无Lab模块、Provider或env依赖；React订阅与timer清理按所有权；types.log exit0 |
| 官方来源可靠 | PASS：原文固定与明确unknown | 包级README固定v2.13.0提交370f7eb6403bdfdb1a2ab5b90fbcfd8eaee7d57b；完整递归README列表无中文原件；官方GET200与完整响应头有记录；未验证Lab嵌入故unknown；officialSources contract+sha256 exit0 |
| 结果可复核 | NOT_RUN：本地SDK/类型可复核，浏览器未执行 | commands.json含cwd/原命令/退出码/时间/日志；浏览器proposal尚未执行，不能由Node通过推导UI PASS |

## 实际检查

cwd `/home/lambert/githubRepos/lambert/ReactLoom`；时间与完整参数见 `validation/commands.json`。

- `node --test packages/library-lab/entries/D12-redux-toolkit/tests/sdk.test.mjs`：exit0，4/4。每项均导入实际SDK并操作当前store.mjs；没有独立纯策略测试被计为SDK。
- 包内Biome check/write：exit0；首次修正格式并提示4处字符串模板信息，已修正；最终 `validation/biome-final.log` 无信息。browser提案后续仅增加region定位，其格式日志 `validation/browser-format.log` exit0。
- 包内 `tsc --ignoreConfig --noEmit --strict --skipLibCheck --jsx react-jsx --module esnext --moduleResolution bundler --target ES2022 --lib ES2022,DOM --allowJs entries/D12-redux-toolkit/examples/example.tsx`：exit0，types.log；这是定向源码检查，不是全Lab typecheck/build。
- 实际调用 `validateOfficialSources(library.official)` 并核对原始快照sha256：exit0，official-contract.log；metadata repository使用owner/repo格式，无猜测字段。

`official/source-evidence.json` 保存提交、包级README选择依据、递归README路径、官网最终URL（重定向至https://redux.js.org/toolkit/）/完整响应头及正文摘要；`official/readme.md` 保留原始字节。无中文原文则回退官方英文，不自行翻译冒充原文。

## 待主控

`validation/browser.spec.ts` 供复制到共享e2e。所有控件限定在真实experiment region，角色/exact定位防止源码查看器文本混淆；reset/团队切换检查均等待1150ms超过最长旧任务1000ms。竞态等待ignored=1表明两个回包都已执行，随后确认新结果保持。未单独执行真实卸载观察，切团队覆盖同一effect清理路径，不能宣称已取得卸载收据。

未运行共享生成、build、全Lab类型检查或浏览器。无需新依赖、宿主或公共字段。正式sdk/build/browser保持NOT_RUN；没有提交/推送/发布或receipt写入。
