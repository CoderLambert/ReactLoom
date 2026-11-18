# C03 Valibot 本地质量整改

实际仓库cwd `/home/lambert/githubRepos/lambert/ReactLoom`；定向检查cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`（diff在仓库根）。Git HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`，原11文件/每项sha见[baseline](validation/baseline.json)。条目内容摘要不是Git提交。

只写C03，保留他人修改；不改公共src/scripts/e2e/依赖锁/索引/queue/results，未提交/推送/发布，未运行全目录generate/typecheck/build或隐式build浏览器。读取适用AGENTS与quality skill三references，复用本会话协作/实施/修复/roadmap规则。历史CI不作本条目验收。

正式[verification](verification.json)三项sdk/build/browser全部 **NOT_RUN**。本地真实SDK与纯边界规则、类型/metadata、浏览器各自记录，不伪造正式匹配收据；全部真实客户端验收仍NOT_RUN，主控匹配候选执行。

## 六项独立结论

| 项目 | 状态/证据层级 | 依据及范围 |
| --- | --- | --- |
| 技术准确 | PASS（匹配安装源码/类型与真实Node SDK） | 实装Valibot1.4.2/MIT、TS peer>=5；safeParse/pipe/object/partialCheck/forward/getDotPath与实际源码匹配。原end只验isoDate会接受不存在日期，已真实red→修正shared Window→SDK green；Node不证明UI/ARIA。 |
| 解释清楚 | PASS（静态） | RSS输入→unknown→pipeline/output/issues主线，单源/批量/跨字段三目标中文输入与操作结果；准确区分格式/真实公历、URL形状/输出规范化、object去未知键/严格合同、SDK/自建helper。删除未挂载方案堆砌。 |
| Demo有用 | NOT_RUN（真实浏览器） | 三目标真实Schema/预置负例/恢复/状态/字段表齐；输入编辑只清旧结果，JSON错误与Schema失败分开。完整3case真实Playwright提案已给，实际输入/结果/移动/重挂待root。 |
| 源码可迁移 | PASS（静态/入口strict类型） | 六sourceFiles包含共享schemas.ts、原mjs及.d.mts和必要CSS；UI与SDK用同一实际合同，无Lab alias/网络/外部资产。useId标签/同步状态，无额外资源清理；异步/resolver未实现。 |
| 官方来源可靠 | PASS（固定原文/完整HTTP） | npm gitHead与v1.4.2=0dc26...、固定library manifest1.4.2；完整tree八README无中文，优先library/README5343B原文且安装README同sha。六实际200完整头，官网缺限制头但Lab-origin未测unknown。 |
| 结果可复核 | NOT_RUN（整体客户端运行）；限定SDK/检查PASS | 实际SDK6/policy2、入口/提案类型、最终Biome/metadata exit0；red/初始format/type失败原日志保留。15实现/内容/来源/提案sha绑定，原始cwd/argv/UTC/exit齐。正式状态不因局部绿升级。 |

## 实际修正与保留

保留原URL凭据/控制字符规则与公历helper、普通object去未知键、safeParse abortEarly:false、partialCheck+forward及三个独立目标。边界helper只正常排版和解释性lint注释，算法未改：URL先trim外围空白、拒剩余ASCII控制/非HTTPS/凭据；公历按闰世纪判断、拒0000，避免Date.UTC对0–99年的重映射。

原Feed/Batch/Window从UI抽到真实schemas.ts，SDK直接导入实际合同，不用一套相似影子Schema代替Demo。Feed仍只trim name，URL helper用于v.check布尔验证，没有transform；因此输出URL保留原串/fragment，讲解纠正“检查时canonical就等于输出canonical”的混淆。object去未知键不是权限或SSRF防护。

Batch复用Feed并明确本例1–3条业务界限，保留owner trim；负例显示owner与feeds.1.url、空数组与超量feeds。Window给end补与start相同真实公历规则，顺序predicate只在两日期真实时比较；增加独立可选note，展示其类型错误不抑制selected-path跨字段问题。两项新增SDK直接验证共享Batch/Window，既有4项真实SDK断言保留。

UI正常排版/必要CSS/useId、预置负例与恢复；状态idle/dirty/json/success/schema明确区分，JSON.parse失败不冒称SDK已运行。编辑不自动解析或重写输入；只显示issue的getDotPath/message，不写原始用户payload或含input的整个issue到持久日志。合成静态fixture的日期/URL负例用于测试，不是读取用户秘密。

## 匹配版本与机制

实际Valibot1.4.2，MIT，当前官方repo open-circle/valibot，旧fabian-hiller入口是历史路径。npm gitHead与v1.4.2轻量tag都为0dc26ea88cf07a414653375f0da43f97e0eed607，固定library/package.json为1.4.2。安装manifest不含gitHead，不伪称从安装manifest读到commit；版本、README摘要和实际SDK代码/类型分别核对。

[SDK源码审计](validation/sdk-source-audit.json)记录安装位置、package/ESM/d.mts三sha及safeParse/object/partialCheck/forward/getDotPath/isoDate实际摘录。isoDate是格式正则，不判断每月最大天数；[官方文档](https://valibot.dev/api/isoDate/)同样明确。partialCheck可在selected部分typed时执行，[官方说明](https://valibot.dev/api/partialCheck/)与匹配1.4.2实现一致；optional note错仍出现end顺序问题已经真实SDK验证。

本库与React无关，TS peer>=5，宿主TS7.0.2；React19.3只是编辑UI。没有新的timer/监听/Worker/网络/存储，不存在未实现的async parse取消；卸载只丢本例React状态。SSR hydration/设备输入仍需独立验收。

## 真实命令 / cwd / exit / 原始日志

除diff在仓库根，均在Lab cwd。原始日志含完整argv/UTC/exit/stdout/stderr；长tsc参数在表内简写，日志无省略。只执行本条目定向检查，没跑公共旧套件或全部库。

| 实际命令 | exit / 结果 | 原始日志 |
| --- | --- | --- |
| `node --input-type=module -e …`（导入原样抽出的实际WindowSchema并断言end不存在时失败） | **1**；旧合同实际接受2026-02-30，真实缺陷red | [calendar-red.txt](validation/calendar-red.txt) |
| `pnpm exec -- biome check --write entries/C03-valibot/examples entries/C03-valibot/tests` | 首次1；明确保留控制字符拒绝正则后0，8文件 | [format-initial.txt](validation/format-initial.txt)、[format-code.txt](validation/format-code.txt) |
| `pnpm exec -- tsc --ignoreConfig --noEmit … entries/C03-valibot/examples/demo.tsx` | 首次1泛型unknown推断；上下文箭头后0 | [types-initial.txt](validation/types-initial.txt)、[types.txt](validation/types.txt) |
| `pnpm exec -- biome check --write entries/C03-valibot/examples/schemas.ts` | 0；仅受影响Schema | [format-schema.txt](validation/format-schema.txt) |
| `pnpm test:sdk --entry=C03` | 0；真实SDK6 PASS / 0 SKIP，自然退出 | [sdk.txt](validation/sdk.txt) |
| `pnpm test:policy --entry=C03` | 0；纯helper2 PASS / 0 SKIP | [policy.txt](validation/policy.txt) |
| `python3 entries/C03-valibot/validation/fetch-official.py` | 0；6个真实200 GET | [source-fetch.txt](validation/source-fetch.txt) |
| `pnpm exec -- biome check --write`（library/verification/validator/临时提案四文件） | 0，完整argv见日志 | [format-final.txt](validation/format-final.txt) |
| `pnpm exec -- tsc --ignoreConfig --noEmit … entries/C03-valibot/validation/browser-proposal.check.ts` | 0；完整提案strict类型，不执行browser | [proposal-types.txt](validation/proposal-types.txt) |
| `node entries/C03-valibot/validation/metadata-check.mjs` | 0；schema/completeness、3目标/6源码、版本/许可/原文/unknown、正式状态、15输入 | [metadata.txt](validation/metadata.txt)、[metadata-final.txt](validation/metadata-final.txt) |
| `git diff --check -- packages/library-lab/entries/C03-valibot` | 0；仅本条目 | [diff-check.txt](validation/diff-check.txt) |

首次格式失败只因原有拒控制字符正则被通用lint阻止，精确注释解释“拒绝URL解析器可能规范化的控制字符”，没有删安全规则或unsafe改逻辑。首次类型错误是把unknown签名helper直接交v.check使action推成unknown；改上下文(value)=>helper(value)保留规则并得到string类型，无any/类型断言。均保留原始失败，只查受影响文件/入口。

SDK6包括原4项真实导入/issue/forward/URL公历，以及新2项直接导入实际shared Feed/Batch/Window：trim去未知键但保留原URL、批量路径/界限、非法结束日、无关note类型错仍forward end、闰日正例。policy2只是独立helper，不当SDK。代码通过后不因文案/元数据收尾重复有效SDK/策略/入口类型。

## 官方原文与官网

官方repo **open-circle/valibot**，tag v1.4.2 / npm gitHead / 固定library manifest对应commit **0dc26ea88cf07a414653375f0da43f97e0eed607**。完整未截断tree的八README候选无官方中文，优先目标 **library/README.md**，不选无关monorepo介绍或自行翻译覆盖。

[完整原文](official/readme.md)英文 **5343B**，SHA-256 **7046bda07a0b96c0c3cbdca00818eb0922eb9e18b5f27bddfe871b88f38f0dcb**，同步UTC **2026-11-10T15:04:54.496261+00:00**；安装README也核同sha。library.json与[source-evidence](official/source-evidence.json)记录repo/commit/path/version/lang/date/hash，原文不交格式器。

真实fetch6请求为registry、tag ref、recursive tree、raw library manifest、raw target README、官网；各保存status/最终URL/完整headers，前五正文另有bytes/sha。官网明确未读body，不捏造正文hash。未使用凭据；旧owner路径不当当前官方repo。

[官网](https://valibot.dev/)实际200，完整头未见XFO/CSP，Lab-origin真实iframe尚未确认，**unknown**与直达合理，不从缺头推定allowed，未改公共frame-src。

## 完整浏览器交接与未测

[三case真实Playwright源码](validation/browser-proposal.txt)无validator mock或伪造输出。basic真实输入/trim/未知键去除/URL保留、三字段错误、JSON与Schema分离/清旧结果/恢复；business真实owner和feeds.1.url、最少与最多、恢复两项；advanced实际end非法公历、note+end双问题/闰日恢复、390px布局与卸载/重跑初始状态。全部由root匹配构建统一运行。

控件继续“输入 JSON”“运行 safeParse”“恢复示例”；负例按钮与guide对应。c03-workshop data-level、c03-result data-status、原valibot-output、c03-issues实际路径/消息表。读数来自真实SDK outcome，不伪造字段路径或通过字符串。

仍NOT_RUN：以上真实浏览器输入/结果/ARIA/移动/卸载，OS中文IME与光标、读屏公告、SSR hydration；async schema/网络取消/resolver焦点/后台保存、输入字节/深度与服务端授权均未实现。Node通过不证明这些能力，formal三项NOT_RUN。没有新增公共依赖或接线请求。

## 文件与交付

修改example/demo/原helper与声明/原测试按上述正常排版和必要修正，helper算法保留；新增共享schemas.ts与必要styles；更新guide/agent/library/verification但不升级正式状态；新增官方原文/完整头、fetch/源码审计/metadata、完整提案、15输入摘要和原始red/修正日志/本记录。AGENTS未修改。完整清单见[final-files.txt](validation/final-files.txt)，日志sha见[log-hashes.json](validation/log-hashes.json)，最终时间见文末。交付后停止所有C03写入，内容完成由root独立复核决定。

FINAL STABLE：`2026-11-10T15:13:53.206600+00:00`。15当前输入sha复读一致，metadata/diff exit0；停止C03所有写入（含文档/日志/metadata）。正式verification和真实browser仍NOT_RUN，交root独立复核/匹配候选。

## candidate15 主控本地质量闭环

本条目适用六项均已通过。candidate15输入f76964af6e3bfa520b3e9e1d78c67a00b09713e1987c8adcce994b46c3e53857，公共/e2e lint/type/build/catalog0且changed=[]；固定dist真实browser29项26PASS/3FAIL，三个失败只属于尚未完成B22。本条目实际通过范围和独立处置见路线图results/C03.md；旧作者摘要为各自阶段历史，新主控输入摘要见validation/controller-input-hashes.json。正式三收据仍NOT_RUN，不是生产/真人最终验收。
