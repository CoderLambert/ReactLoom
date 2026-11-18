# B07 Material UI 质量整改本地记录

实际仓库cwd `/home/lambert/githubRepos/lambert/ReactLoom`，执行定向检查cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`。Git HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`；条目原9个文件及各自输入摘要见 [baseline](validation/baseline.json)，摘要不是Git提交。此次只拥有B07，保留其他工作者修改；未改公共src/scripts/e2e、依赖/锁、索引、queue/results，未提交、推送或发布，没有运行全目录generate/typecheck/build。

正式 [verification](verification.json) 的sdk/build/browser全部 **NOT_RUN**。以下是本地定向检查和内容静态复核，不是正式固定fixture收据，也没有将Node或纯策略写成浏览器PASS。主控独立浏览器验收完成前，整体结果保持NOT_RUN。

## 六项独立核对

| 项目 | 本地结论 | 依据与范围 |
| --- | --- | --- |
| 技术准确 | 静态与限定SDK PASS；DOM NOT_RUN | 核安装material9.5.0、Emotion11.14.0/11.14.1和React19.3.0；匹配类型与固定源码的slotProps/inputRef/transitionDuration、ThemeProvider、Portal/FocusTrap/Snackbar所有权。真实SDK2项只检查主题计算和TextField服务端标记，不推断浏览器交互。 |
| 解释清楚 | 静态 PASS | guide按RSS工程问题→四种状态→三个独立目标→输入/处理/结果→迁移取舍；中文说明真实SDK与自建history、校验、模拟409的边界。agent与真实控件、源码一致。 |
| Demo有用 | 三目标源码/步骤齐；运行 NOT_RUN | basic观察真实useTheme与局部样式/受控输入；business真实Table/Switch过滤、空态和一步撤销；advanced真实Dialog form、字段错误、草稿/冲突恢复及Portal焦点。三目标可单独操作，浏览器提案已完整给出，尚未在此执行。 |
| 源码可迁移 | 静态/入口类型 PASS；目标应用集成 NOT_RUN | 三目标每个声明相同6个必要sourceFiles，含theme、history、draft-policy和CSS，无Lab alias。保留Emotion、slotProps、稳定id/一步undo；未下载字体或使用MUI X。SSR Emotion缓存、媒体查询与水合需另配，未声称已测。 |
| 官方来源可靠 | 固定原文/HTTP证据 PASS；嵌入 unknown | 目标包README原文2284B、精确9.5.0 commit、语言/路径/时间/sha均核对；根和目标目录候选无中文。官网同次200有XFO SAMEORIGIN和enforced frame-ancestors *，按规范CSP优先；无Lab-origin真实浏览器证据，保留unknown。 |
| 结果可复核 | 整体 NOT_RUN；限定日志可复核 | SDK2 PASS、policy6 PASS、入口strict类型/Biome/提案类型/metadata均exit0，有实际cwd/argv/UTC/原始输出。16个实现/测试/内容/来源/提案输入摘要已保存；完整浏览器、实际DOM清理和正式验收仍NOT_RUN。 |

## 实现与保留的有效边界

原history有效逻辑保留：稳定row id；有效写入保存一步before；无效id/重复同值不抹快照；撤销不回退nextId。原history及测试仅正常排版和等价模板字符串整理。新增校验独立返回字段错误，不伪造保存。事件checked先读取成布尔值再传入updater，不延迟重读可变DOM。

两个模块级稳定主题显式cssVariables:false；未使用CssBaseline、全局mode或存储。ThemeProbe直接读取SDK useTheme。Table本地筛选不写history；通知关闭不undo。真实Dialog默认Portal/body且保留React context，标题/说明useId，未禁trap/restore；真实form/noValidate让自建校验可观察并聚焦首错。一次409只在通过字段校验后消费；失败不写rows，不清草稿，再次同值可成功。真实重复地址仍拒绝。取消/Escape保留草稿、清错误/注入标记。

通知有独立id/key，迟到关闭按id保护；Snackbar真实3000ms时钟、暂停和窗口监听由SDK拥有，应用没有自建timer、网络、存储或监听。Dialog/Portal/FocusTrap/过渡的清理由SDK拥有。Info提示role=status，字段失败role=alert；没有伪造HTTP、Portal、辅助技术或浏览器清理结果。

## 真实命令、退出码及原始产物

除diff在仓库根执行，下面均在Lab cwd执行。完整argv（包含所有strict编译参数）、UTC起止/退出码和stdout/stderr在相应日志；可直接复用有效结果，没有为文档收尾重复已通过SDK、策略或入口类型。

| 实际命令 | exit / 限定结果 | 原始日志 |
| --- | --- | --- |
| `pnpm test:sdk --entry=B07` | 0；真实SDK2 PASS / 0 SKIP | [sdk.txt](validation/sdk.txt) |
| `pnpm test:policy --entry=B07` | 0；history4 + draft2，纯policy6 PASS / 0 SKIP | [policy.txt](validation/policy.txt) |
| `pnpm exec -- tsc --ignoreConfig --noEmit … entries/B07-mui/examples/demo.tsx` | 0；局部strict入口及其imports，无共享generate | [首次类型](validation/types.txt)、[中间最终类型](validation/checkpoint-types.txt) |
| `pnpm exec -- biome check --write entries/B07-mui/examples entries/B07-mui/tests entries/B07-mui/library.json entries/B07-mui/verification.json` | 0；11文件 | [checkpoint-format.txt](validation/checkpoint-format.txt) |
| `python3 entries/B07-mui/validation/fetch-official.py` | 0；目录2/原文/package/官网5个实际200请求 | [source-fetch.txt](validation/source-fetch.txt) |
| `pnpm exec -- biome check --write entries/B07-mui/validation/browser-proposal.check.ts entries/B07-mui/validation/metadata-check.mjs` | 0；2文件格式化，临时ts随后原样复制回txt并删除 | [proposal-format.txt](validation/proposal-format.txt) |
| `pnpm exec -- tsc --ignoreConfig --noEmit … entries/B07-mui/validation/browser-proposal.check.ts` | 0；完整Playwright提案strict类型，不运行浏览器 | [proposal-types.txt](validation/proposal-types.txt) |
| `node entries/B07-mui/validation/metadata-check.mjs` | 0；schema/completeness、3目标/6源码、版本/许可、原文sha、官网优先级、formal与16输入 | [metadata.txt](validation/metadata.txt)、[input-hashes.json](validation/input-hashes.json) |
| `git diff --check -- packages/library-lab/entries/B07-mui` | 0；仓库根、仅本条目 | [diff-check.txt](validation/diff-check.txt) |

原失败保留：[checkpoint-format-initial.txt](validation/checkpoint-format-initial.txt) exit1仅library数组格式，随后11文件格式化exit0；首次format-initial的模板字符串info已等价修正，[format-tests](validation/format-tests.txt)也保留。未擦掉失败或把说明性占位写成SDK SKIP。原文请求原始完整headers未删减。

中间冻结点 `2026-11-10T13:15:57.682257+00:00` 当时如实未交完整提案/最终metadata；主控随后请求再次冻结，期间没有写入。candidate10构建后主控明确释放，本次只补提案、metadata和交付记录；无runtime变动，不因交接或文档重复有效类型/SDK/policy。主控共享候选结果由主控维护，不冒充本条目正式收据。

## 官方来源与版本证据

安装包的React/ReactDOM peer支持17/18/19，不表示这些组合均运行通过。Core与Emotion MIT，没有icons-material、MUI X商业组件或远程资源。

官方 [`v9.5.0`](https://github.com/mui/material-ui/tree/1c3f8b4903f21cfad12c102edb3db4ceba2e8c8c) annotated tag对象`d4366b2c20b69195dfcf487dbfb5bbef69fedb83`解引用到commit `1c3f8b4903f21cfad12c102edb3db4ceba2e8c8c`；主快照选择 [`packages/mui-material/README.md`](https://github.com/mui/material-ui/blob/1c3f8b4903f21cfad12c102edb3db4ceba2e8c8c/packages/mui-material/README.md) 英文原文，2284B，sha256 `7101439d2715daf9687af1c610051cfc01f393b1a83d52b6d8c0d10e8a6e1227`，同步UTC `2026-11-10T13:08:19.801218+00:00`。检查该提交根与目标包目录，两候选README.md及packages/mui-material/README.md，无中文；没有声称遍历整个仓库全部子目录。

[官方原文](official/readme.md)、[全部HTTP来源证据](official/source-evidence.json)、[获取脚本](validation/fetch-official.py) 和library.json元数据一致。脚本完成5个真实请求，原文/包JSON的字节/hash及目录响应hash已存；官网明确只读取GET完整头，没有捏造正文hash。固定源代码关键位置：`packages/mui-material/src/{TextField,Dialog,Modal,Portal,Snackbar}/`，FocusTrap在Unstable_TrapFocus；安装类型与源码已核对实际slotProps、焦点恢复、timer cleanup。

官网 [mui.com/material-ui](https://mui.com/material-ui/) 此次200的XFO SAMEORIGIN与enforced CSP frame-ancestors *同在完整响应头。按 [CSP3 §6.4.2.2](https://w3c.github.io/webappsec-csp/#frame-ancestors-and-frame-options) 有效frame-ancestors覆盖XFO；不能单据XFO判blocked，也不能仅据宽松CSP推断实际Lab中allowed。当前 **unknown**、browserFromLabOrigin NOT_RUN，保留官网直达，未修改公共iframe安全策略。

## 浏览器交接与未测项

完整真实Playwright源码 [browser-proposal.txt](validation/browser-proposal.txt)，3个独立case对应三个学习目标。真实控件：switch“仅本例深色主题”“工程实践 订阅状态”“设计系统 订阅状态”；TextField“工作区名称”“搜索订阅”；“新增订阅”“下一次保存注入409”“撤销”“关闭通知”；Dialog“添加 RSS 订阅”，字段“订阅名称”“HTTPS 地址”，按钮“取消”“保存本地记录”。观察b07-theme-state/preview/name、row-s-1等、count/empty/history。无SDK mock、手工DOM注入结果、强点被Modal屏蔽宿主或假生命周期事件。

提案验证实际主题context+Paper计算样式和body不变；Table原生语义/checked与一步撤销/通知独立/筛选空态；Dialog物理Portal、关联说明、Tab约束、Enter首错焦点、HTTPS错误、Escape留稿/焦点返回、一次409失败→同值成功、nextId撤销不回退；390px真实Dialog边界；使用真实browser Back切回先前basic场景卸载仍打开的Dialog，保持同一body、旧Portal断开、backdrop消失与滚动恢复。浏览器尚未执行，异常须保留真实trace并由主控修正。

仍NOT_RUN：以上真实浏览器Emotion/Portal/焦点/Tab/移动排版/卸载结果；Snackbar原生hover/blur的时钟边界（提案只显式关闭与卸载，不声称精确3秒）；多辅助技术矩阵；SSR Emotion缓存/媒体查询与hydration；官网真实Lab-origin可嵌入性；正式sdk/build/browser固定收据。不将policy或TextField静态SSR HTML替代这些结果。

## 文件交付

修改原有library、guide、agent、verification、example/demo、feed-history及其测试（有效history行为保留）；新增theme、draft-policy、scoped CSS、draft策略测试/真实SDK测试、固定官方原文与完整证据、来源抓取脚本、提案/validator/input摘要及真实原始日志。本地完整文件清单见 [final-files.txt](validation/final-files.txt)，日志sha见 [log-hashes.json](validation/log-hashes.json)。AGENTS未修改。最终STABLE时间见本文件末尾；停止全部条目写入后交独立复核，内容状态由主控决定。

FINAL STABLE：`2026-11-10T13:32:36.374659+00:00`。上述16输入摘要核对无变化；停止B07所有写入（含日志/文档/metadata），正式verification全部NOT_RUN。

## 主控candidate11真实闭环

真实MUI三个目标+官方展示4项PASS：真实ThemeProvider/useTheme与浅深DOM样式、受控名称、原生表格/Switch/一步撤销/通知分离与过滤空态；真实Dialog Portal/焦点陷阱/首错定位/Enter校验/留稿/一次409同值恢复/移动viewport与SPA Back卸载。SDK主题/SSR2和policy6局部结果复用。

非作者完整六项复核通过。advanced初次读背景role region在Modal正确aria-hidden后不可见；仅以testid观察被隐藏的权威数据，不穿透遮罩操作背景，重试完整casePASS。source从candidate10到11未改行为，其他2case有效PASS复用。官方enforced frame-ancestors优先XFO且未Lab嵌入确认，unknown准确。

候选2208输入SHA362873dc5a79d4089300e5257e611b9fa3fab2a6af76e7355d792b13d3aa83cc：新e2e lint/type/build/catalog全部0且stability changed=[]，浏览器固定dist无隐式build。实际argv/cwd/exit/产物见docs/library-lab/evidence/quality-upgrade/candidate-11/browser-fixes与browser-mantine-status-retry，未受影响candidate10结果复用；单次7项6PASS1FAIL不隐瞒，失败仅定位并已定向闭环。非作者六项内容和本地运行完成，正式sdk/build/browser仍NOT_RUN，不冒充授权干净recorder收据。
