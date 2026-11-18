# B10 本地质量整改与验收边界

2026-11-10，quality_f05独占B10；工作区HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。原10文件无条目diff，真实基线、SHA与状态见[baseline.json](validation/baseline.json)。保留原三目标、外层label、权限数组规则、name/value/disabled/FormData；不改公共源码、依赖/锁、e2e、队列或索引，不提交。正式sdk/build/browser保持NOT_RUN。

## 基线问题与实际改动

原guide把onCheckedChange描述为可能给出混合态回调；实际1.9.0类型明确boolean+eventDetails。旧文堆积未实现Dialog/Popover与历史CI，官方README/官网证据缺失，源码压缩。原高级锁定操作没有使旧提交显示失效，容易把已含manage的旧结果当成当前配置。

现在完整中文先解释Root/Indicator、可聚焦span与旁侧CSS隐藏的原生checkbox，再讲checked/indeterminate、label/键盘、混合全选、浏览器成功表单控件与本地权限边界。保留三目标，未扩成别的组件课。原六policy仅正常排版；核心算法未重写。锁定/编辑会清除上次提交和DOM读数；解锁只恢复可编辑，不偷偷恢复权限。

实际例子通过SDK inputRef读取name/value/checked/indeterminate/disabled/tabIndex与当次原生FormData；不是从React state拼一份假DOM结果。显式id/htmlFor、稳定aria-labelledby、aria-describedby、fieldset/legend、Indicator aria-hidden与Root focus-visible补齐；useId隔离多实例，必要CSS正常排版。没有自造Space/Enter处理，没有timer、存储或全局监听需要额外清空。

## 六项检查点

| 项 | 当前结论与层级 | 证据与范围 |
| --- | --- | --- |
| 技术准确 | PASS：匹配类型/源码与真实SSR SDK局部 | 实装@base-ui/react1.9.0；[sdk-source-audit.json](validation/sdk-source-audit.json)保留安装包版本/peer和实际Root/Indicator类型与JS摘要/摘录。真实React SSR2/2核对mixed ARIA、native input name/value/checked/disabled，不含DOM替身。 |
| 解释清楚 | PASS：静态内容复核 | guide围绕同一权限表解释交互/状态/提交；区分SDK、手工父级、本地策略、正式授权；代理迁移约定同步，无未实现弹层课堆积。 |
| Demo有用 | NOT_RUN：主控新候选浏览器待验 | basic label/Space/Tab与input读数；business mixed/全选/实际FormData/Enter；advanced禁用/旧提交失效/可选分母/解锁/卸载。源码和三条提案已完成，不能把SSR或policy称为浏览器通过。 |
| 源码可迁移 | PASS：静态/严格类型 | 四sourceFiles包含入口、实现、策略和必要CSS；正常排版、无Lab alias/新依赖/外部资产。原生控件与内部监听由SDK管理，应用refs随卸载解除。完整SSR宿主/hydration未验收。 |
| 官方来源可靠 | PASS：固定原文与公开请求证据 | v1.9.0 annotated tag→commit ad7ecda5296b0295b41a51ecb01fce6204acd099；匹配包manifest1.9.0、根/包仅英文README；原文1856B与SHA一致。官网完整headers有CSP/XFO冲突，unknown准确。 |
| 结果可复核 | NOT_RUN：整体交互；局部日志可复核 | SDK2/2、原policy6/6、严格类型、12文件Biome和metadata均exit0，日志/精确cwd/argv/时间齐；真实键盘/DOM indeterminate/FormData/卸载与官网iframe仍待主控，不记content_done。 |

## 匹配版本与官方来源

实际@base-ui/react1.9.0，运行时MIT，React/React DOM peer均^17 || ^18 || ^19，Lab安装19.3.0。Checkbox路径不要求可选日期依赖。源码确认Root默认span、旁侧type=checkbox input、boolean+details回调、layout effect设置input.indeterminate、Enter请求表单提交、name/value/disabled传给真实input。SSR中mixed的ARIA与客户端原生indeterminate属性是两层事实，测试没有把它们混为一谈。

[官方原文](official/readme.md)来自 `mui/base-ui@ad7ecda5296b0295b41a51ecb01fce6204acd099/packages/react/README.md`，1856B，SHA256 `b5444513c6b8cd0d19777a7c7f0031c8f7d287e5ce04093b5ca68e50cab791c6`。实际目录只有README.md，无官方中文候选；原文没有翻译/改写。包manifest同为1.9.0。公开匿名7个GET的原始最终URL、响应头、状态、时间、长度/hash与tag解引用在[source-evidence.json](official/source-evidence.json)，[fetch-official.py](validation/fetch-official.py)可复核；未安装新包或读取.env/凭据。

官网 https://base-ui.com 实际GET200，完整CSP含frame-ancestors *，同时XFO SAMEORIGIN；现代CSP祖先策略覆盖XFO，不能仅看XFO判blocked。未从Lab origin确认iframe内容，metadata保留unknown与直达/重试，没有伪写allowed。

## 实际命令、退出码与产物

完整精确argv、cwd、UTC起止、exit与日志路径见[local-runs.json](validation/local-runs.json)。以下除官方fetch在仓库根，其余cwd均 `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`。

| 实际命令 | exit与产物 |
| --- | --- |
| `python3 /home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab/entries/B10-base-ui/validation/fetch-official.py`（cwd仓库根） | 0，[official-fetch.txt](validation/official-fetch.txt)，保存原文与7请求完整头。 |
| `node --test entries/B10-base-ui/tests/sdk.test.mjs` | 0，2/2、0skip，[sdk.txt](validation/sdk.txt)；真实SSR，无mock/DOM/强退。 |
| `node --test entries/B10-base-ui/tests/permission-policy.test.mts` | 0，6/6、0skip，[policy.txt](validation/policy.txt)；原权限规则。 |
| `pnpm exec -- tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/B10-base-ui/examples/demo.tsx entries/B10-base-ui/validation/browser-proposal.check.ts` | 0，[typecheck-final.txt](validation/typecheck-final.txt)；实际入口与完整Playwright提案。 |
| `pnpm exec -- biome check --write entries/B10-base-ui/examples entries/B10-base-ui/tests entries/B10-base-ui/library.json entries/B10-base-ui/verification.json entries/B10-base-ui/official/source-evidence.json entries/B10-base-ui/validation/metadata-check.mjs entries/B10-base-ui/validation/browser-proposal.check.ts entries/B10-base-ui/validation/sdk-source-audit.json` | 0，12文件，[format-fixed.txt](validation/format-fixed.txt)。 |
| `node entries/B10-base-ui/validation/metadata-check.mjs` | 0，[metadata.txt](validation/metadata.txt)；共享validateEntry/gate、三目标、四源、README字节/hash/版本、官网unknown、formal NOT_RUN。 |
| `python3 /home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab/entries/B10-base-ui/validation/final-check.py`（cwd仓库根） | 0，[final-check.txt](validation/final-check.txt)；本地链接、原AGENTS摘要、四源排版/迁移、README、三提案、无临时/二进制拷贝。 |
| `git diff --check -- packages/library-lab/entries/B10-base-ui`（cwd仓库根） | 0，[diff-check.txt](validation/diff-check.txt)。 |

提案检查时将browser-proposal.txt原样暂存为同目录browser-proposal.check.ts，格式化后同步回.txt，完成即删除.check.ts；复核时可用同样复制步骤重现类型/格式命令。没有维护第二份可执行Demo。

最初[format-source.txt](validation/format-source.txt) exit1：Biome不能静态推断Checkbox.Root会生成input；补显式htmlFor与实际input id后[format-fixed.txt](validation/format-fixed.txt)通过。初次入口类型也exit0，最终包含提案的严格检查已覆盖后续id修改。所有失败原始日志保留，没有把静态label告警称作已复现浏览器缺陷。README原文未交给格式器重写。

## 文件、控件与浏览器交接

修改guide/agent/library/verification、example与CSS；demo出口、permission-policy、原六policy测试仅排版。AGENTS保留。新增真实SSR SDK测试、official原文/完整证据、validation基线/实际源码审计/metadata脚本/日志/摘要/完整三条提案。源清单仍四文件，完整交付清单见validation/final-files.txt，输入摘要见validation/input-hashes.json。

[browser-proposal.txt](validation/browser-proposal.txt)是完整Playwright源码文本，3条精确@B10、无SDK/DOM事件/时钟/网络mock，不直接改input checked/indeterminate。主控接公共e2e后对匹配候选执行：

- basic：真实label点击、Space更新SDK与inputRef读数；Tab跳过隐藏input到读取按钮。
- business：mixed ARIA与真实input.indeterminate；三真实name/value，全选/部分/空FormData；真实Enter提交但不切换父项。
- advanced：锁定使旧输出失效，真实disabled/input不入FormData、父级只计可选两项；禁用label点击/全选不能带回manage，Tab跳过禁用项，解锁不恢复授权；实际旧DOM卸载和重挂默认状态。

区域“Base UI Checkbox 实战”，b10-workshop data-level；Root testid b10-parent/read/comment/manage；b10-input-reading为当次DOM快照，b10-form-data为实际提交数组。“读取实际输入”“提交本地 FormData”是新/原有明确操作。旧单项标签、权限名称、全选和锁定语义保留。

## 剩余项

主控浏览器尚未运行本候选，完整SDK交互/原生FormData/焦点与卸载保持NOT_RUN；实际读屏、触屏、完整SSR hydration、Dialog/Popover/CheckboxGroup、网络授权与服务端冲突没有实现或验收。没有新公共依赖缺口。正式sdk/build/browser的干净提交与匹配收据条件另行满足，禁止用本轮SSR2/策略6或共享build推导整库PASS。

## 主控candidate12真实闭环

真实Base UI三个目标+官方展示4项PASS：label/Space/Tab、SDK root与真实inputRef的checked/indeterminate/disabled/原生FormData一致；mixed父级→全选/清空、Enter提交不切换；锁定管理移除旧权限和提交/读数、disabled真实input/label指针/Tab跳过、解锁不自动恢复、真实卸载重挂。SSR2与policy6有效局部结果复用。

非作者六项无P1/P2。初次advanced测试Locator.click自动重定向disabled label到disabled input并等待enabled导致超时，原trace确认；改实际mouse点可见label坐标，保留禁用/无授权结果断言后完整casePASS，无生产改动或force解除禁用。官网有效frame-ancestors *覆盖XFO，只能unknown。

候选2298输入SHA611cb29d104643bf85ae397fdac06a64146259d4b28b5d85278e6264738d3063，lint/type/build/catalog全部0、stability=[]，browser固定dist无隐式build，实际argv/cwd/exit/产物在docs/library-lab/evidence/quality-upgrade/candidate-12。初次16项10PASS6FAIL、观察修正retry5项5PASS，各条目实际范围单独计；不隐瞒他库失败也不重跑本条已通过项。非作者六项与本地运行闭环，正式sdk/build/browser仍NOT_RUN，等待授权干净提交及recorder，不擅自提交以解锁。
