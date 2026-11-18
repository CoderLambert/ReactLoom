# B12 React Aria Components 本地质量整改记录

实际仓库cwd `/home/lambert/githubRepos/lambert/ReactLoom`；下列检查cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`（diff在仓库根）。Git HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`；原10文件，主控给定条目输入摘要 `ac71c945034fa2afafcc5b642a024916822f5b6c923948e5847c65c76991cb5d`，各文件实际sha见[baseline](validation/baseline.json)。输入摘要不是Git提交。

只拥有B12，保留其他工作者修改；未动公共src/scripts/e2e/依赖锁/索引/queue/results，未提交、推送或发布；未运行全目录generate/typecheck/build或隐式build浏览器。按要求candidate11期间保持原10文件0写入，明确释放后实施。B08独立报告的两P2关闭附记按主控单独授权落盘，不改其产品；不把该审查算B12结果。

正式[verification](verification.json) sdk/build/browser全部 **NOT_RUN**，本地SDK/策略/静态检查独立记录，未伪造固定fixture收据。完整真实浏览器由主控匹配候选运行，整体运行NOT_RUN。

## 六项独立结论

| 项目 | 状态与证据层级 | 依据和边界 |
| --- | --- | --- |
| 技术准确 | PASS（匹配安装类型/源码、限定真实SSR） | RAC1.21.0/React19.3与Apache-2.0已核。旧选择属性已deprecated但兼容，同时支持value/onChange；修正旧文“新接口不存在”。实际SDK2检查真实隐藏key与受控文本、两实例描述id；不当客户端键盘/Portal证明。 |
| 解释清楚 | PASS（静态） | RSS发现主线，身份/文本/候选三值、SDK/应用分界、输入/处理/结果、分类过滤与禁用、本地异步对齐及迁移取舍。去掉无关未实现RHF/Query/422等大段方案和历史CI叙述。 |
| Demo有用 | NOT_RUN（真实浏览器） | 保留3个独立目标：键盘/表单身份→分类/禁用/空态→异步对齐/取消与IME。真实组件/操作/观察齐，局部类型通过，完整真实Playwright提案3case已给，运行未执行。 |
| 源码可迁移 | PASS（静态/入口类型） | 4个必要sourceFiles含实际前缀CSS，无Lab alias/远程素材；正常排版，useId每实例描述，公开level变化重置语义保留；timer/controller/代际归应用，SDK拥有Popover/键盘资源。SSR hydration/设备集成未测。 |
| 官方来源可靠 | PASS（固定原文/hash、完整HTTP） | npm与安装gitHead一致，完整未截断tree246 README候选无中文；目标包英文原文1915B、路径/version/lang/date/sha齐。官网200 enforced frame-ancestors self明确跨源blocked，有全部头与直达，不虚称浏览器allowed。 |
| 结果可复核 | NOT_RUN（整体运行）；局部日志可复核 | 实际SDK2、policy4、入口/提案strict类型、Biome/metadata、13输入摘要和原始失败/修正日志齐；不把纯规则、SSR或类型当浏览器PASS。剩余真实Portal/键盘/OSIME等明确列出。 |

## 实现与保持的有效边界

保持selectedKey/inputValue分别受控；onSelectionChange确认存在且未禁用，再同步完整名称；onInputChange保留原串并清掉不匹配旧身份。confirmedChannel要求enabled和名称完全匹配，submit再核真实FormData.channel等于id。保持ListBoxItem稳定id/textValue、真实Label/Input/Button/Popover/ListBox组合，不重写键盘系统。

保留高级240ms本地setTimeout、AbortController、generation检查；cleanup清timer、abort并推进代际。busy或resolvedQuery未对齐时queryRows仍返回空，避免旧候选闪回。保留组合期submit直接return，不新增尾随Enter吞键守卫、全局监听、手写Portal或网络。

最小功能修正：固定hint id换useId；显式allowsEmptyCollection使真正ListBox在空项/查询中仍可打开，原默认false会关闭空集合，仅renderEmptyState无法兑现可见空态。增加b12-workshop/state/query-status/submit-status，JSON只直读受控值/实际候选id/查询状态和代际，不预填SDK结果。CSS正常排版并加窄视口最大宽度与状态pre换行，无额外动画。

原channel-policy4项语义保留，仅正常排版/等价模板字符串；公共level prop变化有意重置身份/输入/message，为保留迁移语义对该effect作精确Biome依赖解释，不机械删依赖。没有引入双重数据主人或修改其他条目。

## 版本与匹配源码

实际 `react-aria-components@1.21.0`，依赖react-aria3.52.0/react-stately3.50.0。安装manifest许可证Apache-2.0；React/ReactDOM peer为`^16.8.0 || ^17.0.0-rc.1 || ^18.0.0 || ^19.0.0-rc.1`，宿主19.3满足。peer可接受不代表所有组合运行通过。

关键安装证据：RAC `dist/types/src/ComboBox.d.ts`及`dist/private/ComboBox.mjs.map`内原始sourceContent，react-stately匹配`useComboBoxState`类型/源码。ComboBox默认formValue=key生成hidden input；allowsEmptyCollection默认false且空集合会关菜单；ListBox items属于真实collection。useComboBoxState明确优先props.value并回退selectedKey，新旧回调兼容；deprecated不是不存在或失效，本文不改有效旧实现来机械迁移。真实SSR两个接口各验证一次。

## 实际命令 / cwd / exit / 原始日志

以下均在Lab cwd，完整argv/UTC/exit及stdout/stderr已存；没有fake DOM/canvas、force-exit、跳过占位或mock SDK。临时提案.ts与txt内容相同，只为类型/格式检查，结束后删除。

| 实际命令 | exit / 结果 | 日志 |
| --- | --- | --- |
| `pnpm exec -- biome check --write entries/B12-react-aria/examples entries/B12-react-aria/tests` | 首次1；修正后0，6文件 | [format-initial.txt](validation/format-initial.txt)、[format-code.txt](validation/format-code.txt) |
| `pnpm exec -- tsc --ignoreConfig --noEmit … entries/B12-react-aria/examples/demo.tsx` | 0，局部strict含实际imports | [types.txt](validation/types.txt) |
| `pnpm test:sdk --entry=B12` | 0；真实SDK2 PASS / 0 SKIP，自然退出 | [sdk.txt](validation/sdk.txt) |
| `pnpm test:policy --entry=B12` | 0；纯策略4 PASS / 0 SKIP | [policy.txt](validation/policy.txt) |
| `python3 entries/B12-react-aria/validation/fetch-official.py` | 0；五个真实200请求 | [source-fetch.txt](validation/source-fetch.txt) |
| `pnpm exec -- biome check --write entries/B12-react-aria/library.json entries/B12-react-aria/verification.json entries/B12-react-aria/validation/metadata-check.mjs entries/B12-react-aria/validation/browser-proposal.check.ts` | 0；4文件 | [format-metadata-proposal.txt](validation/format-metadata-proposal.txt) |
| `pnpm exec -- tsc --ignoreConfig --noEmit … entries/B12-react-aria/validation/browser-proposal.check.ts` | 0；提案strict类型，不执行浏览器 | [proposal-types.txt](validation/proposal-types.txt) |
| `node entries/B12-react-aria/validation/metadata-check.mjs` | 0；schema/completeness、3目标4源码、版本/许可、原文/来源/blocked、formal/13输入 | [metadata.txt](validation/metadata.txt)、[input-hashes.json](validation/input-hashes.json) |
| `git diff --check -- packages/library-lab/entries/B12-react-aria` | 0；仓库根、仅B12 | [diff-check.txt](validation/diff-check.txt) |

首次Biome的exit1原始日志保留：effect只借level变化触发reset，lint建议删额外依赖会破坏迁移契约；现精确说明该依赖意图，另修等价模板字符串info。最终6文件exit0，不用unsafe批量改逻辑。代码随后无变化，SDK/策略/类型均不重复运行；提案/metadata单独新增检查。

SDK2真实导入RAC与ReactDOMServer：兼容选择属性输出key hidden input与独立受控文字；新value/onChange同样可用、两个实际实例描述id不冲突。只得到908B/1827B真实SSR标记，不声称Portal/设备或DOM样式通过。policy4只过滤/禁用/名称匹配/未对齐查询，不证明计时和SDK交互。

## 官方原文与官网

精确registry GET `react-aria-components/1.21.0`与安装manifest的gitHead均为 **`0a2a7e68e4d896b3ac46c3647fe48fac9ea3ae2e`**，不是浮动main/tag。官方repo adobe/react-spectrum，目标 [`packages/react-aria-components/README.md`](https://github.com/adobe/react-spectrum/blob/0a2a7e68e4d896b3ac46c3647fe48fac9ea3ae2e/packages/react-aria-components/README.md)。实际recursive tree未截断，246 README候选无中文，优先目标包英文完整原文，不翻译拼接覆盖。

[原文](official/readme.md) **1915B**，SHA-256 **`654cbc0c1d8939a0bd808883ebf1a1cca965e86b9ff657dfdf4378592fcb2960`**；同步UTC **`2026-11-10T13:40:27.470745+00:00`**。版本/语言/固定路径/date/hash在library和[来源证据](official/source-evidence.json)；registry、tree、rawREADME、rawpackage、homepage共5个真实200请求各含完整headers，前四正文各有字节/sha，官网明确未读body，不捏造正文hash。可复现[fetch脚本](validation/fetch-official.py)完整执行exit0。

[官网](https://react-aria.adobe.com/) 此次GET200、finalURL同请求，enforced `Content-Security-Policy: frame-ancestors 'self';` 明确限制跨源Lab，**blocked**并保留直达；browserFromLabOrigin NOT_RUN，不将政策blocked冒充实际浏览器运行，也不写成unknown或allowed。没有改公共frame-src/嵌入权限。

## 浏览器提案与剩余

完整3个真实Playwright案例在[browser-proposal.txt](validation/browser-proposal.txt)，提案类型/格式通过，主控统一接公共e2e。真实控件保留：combobox“选择 RSS 频道”、Button“显示可选频道”、原生“提交真实表单”“清空选择”；region“React Aria Components 可访问组合框实战”。观察b12-state直接读selectedKey/inputValue/visibleIds与busy/resolvedQuery/generation，b12-query-status和submit-status分开，读值用根testid避免误把overlay aria-hidden背景当不存在。

- basic实际ArrowDown/Enter选第一项，真实Portal不在表单section内，FormData提交react；半文本清旧key且提交拒绝，清空恢复。
- business名称/分类过滤含disabled安全通告，真实坐标指针不能确认禁用项，键盘跳过禁用，原生表单确认opensource；真正零数据候选ListBox空态（不把SDK占位option计为业务候选）、Escape/清空恢复。
- advanced真实240ms本地时钟、快速查询只对齐最后一次，旧结果不覆盖；透明的合成CompositionEvent只针对应用提交guard，结束后真实按钮/FormData仍可提交；390px真实Popover边界；待处理查询和真实打开Popover时browser Back切回先前basic，检查同文档DOM卸载与恢复状态，不伪造SDK cleanup计数。

**未测**：全部以上浏览器运行；实际OS中文IME候选窗口的Enter/Space/鼠标确认（合成事件不算）、触摸与读屏公告；SSR hydration；跨浏览器/缩放；完整监听/timer资源普查；官网真实Lab-origin运行；真实HTTP错误/取消/后端授权。SDK/纯策略/类型不能抵消这些NOT_RUN。没有请求额外公共接线，formal仍NOT_RUN。

## 文件与交付

修改example、CSS、demo、channel-policy及原测试只按上述最小功能/正常排版；精简guide/agent、更新library/verification但不升级正式状态。新增真实SDK2测试、official原文/完整来源、fetch脚本/metadata validator、三目标浏览器提案、13输入摘要及原始日志/本记录。AGENTS未改；完整文件见[final-files.txt](validation/final-files.txt)，日志sha见[log-hashes.json](validation/log-hashes.json)。最终稳定后停止全部B12写入（含文档/日志/metadata），主控决定内容完成与下一共享候选。

FINAL STABLE：`2026-11-10T13:49:55.258740+00:00`。13输入sha复读一致，scope diff exit0。停止B12全部写入，正式verification三项NOT_RUN，真实browser由主控。

## candidate12输入丢失的定向修复

先前FINAL STABLE是首轮内容/静态交付，不是浏览器通过。主控candidate12实际basic通过；business的零role-option断言错误（真实SDK空态占位有option角色，由root改观察，不改SDK）；advanced出现真实产品缺陷：已选opensource并真实FormData成功后，输入React被异步null选择回调清成空串。原始公共失败日志/trace位于`docs/library-lab/evidence/quality-upgrade/candidate-12/`，没有擦除或改输入规避。

本工作者暂停B15，在既有4319预构建candidate12上启动独立真实Chromium复现。命令`node entries/B12-react-aria/validation/reproduce-input-loss.mjs`，cwd Lab，exit0；[原始诊断](validation/input-loss-old-dist.txt)记录：SELECTED key=opensource/input=开源趋势→真实表单ID=opensource→fill React后立即input=React/key=null/generation7→500ms后input/resolvedQuery均空、generation9、message选择已清空，pageerror空。**此exit0是成功复现旧缺陷，不是修正源码浏览器PASS。** 没有mock SDK、替换回调、改dist或运行全目录构建。

安装1.21.0对应react-stately useComboBoxState源码显示双受控commitSelection会发onSelectionChange(selectedKey)，包括已清身份的null；selection/collection回调与直接文本输入是不同通知。原app在所有选择回调都执行setInputValue(selected?.name??'')，把null等同用户清文本，因此覆盖新查询。最小修正只在有效selected存在时同步完整名称；null仍清身份/通知但不写inputValue。显式“清空选择”和level重置仍负责同时清文本；后续Escape修复见下一增量，按SDK revert撤销未确认文本。generation/AbortController/clearTimeout、确认规则、IME和FormData均未改变。

guide/agent同步该分工。提案保留原“选中→真实FormData→窄屏fill React”序列，增加立即/查询完成后inputValue仍React断言；basic也检查编辑保留，不能仅验证旧key已空。business按真实visibleIds=[]和空态文字观察，不按role option总数断言业务数量。合成composition仍只是应用guard，不升级OSIME状态。

新增真实定向检查（cwd Lab）：

| 命令 | exit / 范围 | 日志 |
| --- | --- | --- |
| `pnpm exec -- biome check --write entries/B12-react-aria/examples/example.tsx entries/B12-react-aria/validation/reproduce-input-loss.mjs entries/B12-react-aria/validation/browser-proposal.check.ts` | 0；3文件，无额外产品改动 | [input-loss-format.txt](validation/input-loss-format.txt) |
| `pnpm exec -- tsc --ignoreConfig --noEmit … entries/B12-react-aria/examples/demo.tsx entries/B12-react-aria/validation/browser-proposal.check.ts` | 0；入口和完整提案strict | [input-loss-types.txt](validation/input-loss-types.txt) |
| `node entries/B12-react-aria/validation/metadata-check.mjs` | 0；更新13输入sha，来源未变 | [input-loss-metadata.txt](validation/input-loss-metadata.txt) |

保留[input-hashes-before-input-loss](validation/input-hashes-before-input-loss.json)绑定修正前输入；当前input-hashes为修正后13项，日志/清单更新。原真实SDK2静态选择序列化/描述与policy4过滤确认未受影响，有效结果复用，未重复。六项的技术/解释/迁移静态问题已修，Demo及整体结果仍NOT_RUN；修正后的真实browser由root下个匹配构建定向运行。正式verification继续全NOT_RUN，不把旧dist诊断或类型当修复成功验收。

RE-STABLE：`2026-11-10T14:09:08.001151+00:00`。13当前输入摘要一致，停止B12全部写入；修正后真实browser NOT_RUN，交主控匹配候选。

## candidate13 Escape关闭后重开的控制边界修复

主控candidate13确认原advanced新输入React不丢失已PASS，但basic/business单次Escape后Popover关闭又重开；原公共browser日志/trace保留。不是要求多按Escape或绕过aria-hidden背景操作。

真实被动探针`node entries/B12-react-aria/validation/reproduce-escape-reopen.mjs`在现有4319固定candidate13运行，cwd Lab、exit0，仅被动监听Input原生keydown及aria-expanded MutationObserver，不改SDK/state/回调。原始[escape-old-dist.txt](validation/escape-old-dist.txt)记录basic React与business ZZ_NO_MATCH两组：单次Escape前expanded=true，后续属性mutation的oldValue先true再false，最终expanded=true/listbox1，query文本原样保留。**这证明实际true→false→true，而非测试等待不足；诊断exit0不代表修复源码浏览器PASS。**

匹配官方安装source-map的`packages/react-aria/src/combobox/useComboBox.ts:239–243`明确Escape调用state.revert；`packages/react-stately/src/combobox/useComboBoxState.ts:510–518`注释/实现是撤销输入并关闭，双控commitSelection(:532–548)发送选择回调、将lastValue设为所选itemText、再close。此前null通知保留query后，inputValue非空但lastValue为空，自动打开effect又开菜单。保留输入补丁没有完整参与SDK的revert契约，因此是应用控制边界回归，不是SDK应关闭两次。

最小修正：Input局部onKeyDownCapture仅在Escape且composing ref=false、nativeEvent.isComposing=false、keyCode非229时，把受控文本同步到当前有效selected的完整名称或空串。**不preventDefault、不stopPropagation、不设置open、不聚焦、不加全局键监听/尾随flag/timeout**；之后仍由SDK执行真实revert/关闭/焦点与ARIA。普通输入/异步null选择通知继续不改文本。组合期间Capture不改草稿，原composition提交guard保留。

guide/agent明确Escape撤销未确认查询，而非承诺保留搜索。提案保留单次Escape，新增aria-expanded=false、未确认input=''与真实listbox卸载断言；原advanced选中→FormData→React输入及settled React断言保留，不改原失败输入，不绕mask点击背景。没有新增自制菜单或独立open模型。

新增定向检查（cwd Lab）：`pnpm exec -- biome check --write`仅example、完整提案临时ts与被动诊断脚本3文件，exit0，[escape-format.txt](validation/escape-format.txt)；入口+提案strict tsc exit0，[escape-types.txt](validation/escape-types.txt)；metadata/13当前输入更新exit0，[escape-metadata.txt](validation/escape-metadata.txt)。原真实SDK2/纯policy4不受影响，未重复，来源/原文完全未改。保留修前[input-hashes-before-escape.json](validation/input-hashes-before-escape.json)。

六项静态技术/说明/源码边界随本修正更新，Demo和整体运行仍NOT_RUN；所有正式verification仍NOT_RUN。主控将对匹配新构建同时复验普通输入保留、单次Escape与原advanced流程；未把旧dist被动探针或类型/metadata写成修复后browser PASS。

RE-STABLE（Escape）：`2026-11-10T14:24:50.221145+00:00`。13当前输入摘要核对一致；停止B12全部写入，修复后真实browser待主控。

## 主控candidate14真实闭环

真实React Aria三场景全部PASS：原生键盘选择/真实FormData key/编辑不复用旧身份；分类筛选和disabled跳过/真实空态placeholder；240ms真实延迟查询对齐最新值、composition提交守卫(仅事件协议)、窄屏Popover与SPA Back取消/卸载。原官方原文/blocked展示PASS复用；真实SDK SSR2与policy4局部有效结果另记。

两个真实控制缺陷均保留复现并最小修正：null选择通知不再覆盖新查询；单次Escape先close再reopen有true→false→true原生mutation证据，局部非composition capture同步受控文本，不prevent/stop/自控open，SDK继续revert/关闭。非作者初审+两次增量无新P1/P2，candidate14同时验证普通输入保留与单次Escape文本撤销/closed，未多按键绕过。

候选2423输入SHA8202199ea4076e8df8e69be8c7156aee6698716329c1b2ac190d1d43c97a657f，type/build/catalog全部0、stability=[]；公共e2e lint有效PASS复用，B19源level定向lint0。browser.txt共15项14PASS1FAIL，本条受影响/首次用例完整通过；其他B19展示失败保留独立修复，不能代替或抵消本条证据。正式sdk/build/browser仍NOT_RUN，不为记证提交。之后公共HTML-only README安全fallback不改本条SDK/普通Markdown路径，targeted22单元通过、匹配公共浏览器另验，未扩推为逐库SDK结果。
