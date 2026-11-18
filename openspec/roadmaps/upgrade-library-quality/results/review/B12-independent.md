# B12 React Aria 非作者独立复核

结论：**未确认P1/P2，无阻断**。仅新增本报告，未修改产品或公共文件，未重跑有效SDK/policy/type/browser。实际cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`，HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。

读取AGENTS、library/guide/agent、全部examples/tests、verification/local-validation、official原文/完整来源、validation输入摘要/已有日志/浏览器提案；对照实际安装1.21.0/3.50.0类型和source map内原始源码，重新计算原文与声明输入摘要。

## 六项结论

| 维度 | 独立状态 | 依据与边界 |
| --- | --- | --- |
| 技术准确 | PASS（静态/匹配源码与既有SSR） | RAC1.21.0依赖react-stately3.50.0；新value/onChange存在，selectedKey/onSelectionChange已deprecated但兼容。真实allowsEmptyCollection、FormData与受控模型对应源码；SSR2不证明客户端。 |
| 解释清楚 | PASS（静态） | 三目标按身份/文本、分类禁用、异步对齐讲输入/API/结果；本地240ms/AbortSignal不是HTTP，合成composition不冒充OS输入法。 |
| Demo有用 | NOT_RUN（真实浏览器） | 键盘、Portal、真实零项空态、禁用与确认、代际/IME路径有实际控件与三项提案；尚未执行浏览器。 |
| 源码可迁移 | PASS（静态与既有strict类型） | 四sourceFiles含CSS齐，无Lab alias；实例useId描述、自己timer/controller cleanup与SDK子树所有权清楚，level切换重置有意保留。 |
| 官方来源可靠 | PASS（固定原文/HTTP政策） | 精确npm/安装gitHead0a2a7e68e4d896b3ac46c3647fe48fac9ea3ae2e，目标1915B/hash独立匹配；完整tree无中文。官网enforced frame-ancestors self→blocked，未冒称iframe运行。 |
| 结果可复核 | NOT_RUN（整体客户端运行） | 已有SDK2/policy4/类型/格式/metadata/提案日志可复用且边界准确；13声明输入摘要独立匹配，formal三项NOT_RUN。 |

## 重点核对

- `examples/example.tsx:103–120`分别控制selectedKey与inputValue；选中同步完整名称，编辑立即清除不完全匹配旧key。defaultFilter始终true，ListBox items由应用按名称/分类过滤，避免SDK二次过滤删掉分类命中项。
- 安装react-stately3.50.0的useComboBoxState类型将selectedKey/onSelectionChange标deprecated；source map原文优先props.value回退selectedKey，新旧回调都存在。两值同时受控时，自动文本/选择清理由应用负责；本例实现符合此路径，未机械删有效兼容接口或混控两套。
- `example.tsx:105`显式allowsEmptyCollection，配合`142–153`真实ListBox renderEmptyState使空项/查询中列表仍可打开。仅有空态渲染函数不足以保证弹层可见的旧问题已解决。
- `example.tsx:43–64`每次输入/level创建新代际，timer callback检查signal与generation；cleanup clearTimeout+abort+generation++，不是假定timer自动响应AbortSignal。`channel-policy.ts queryRows`在busy或resolvedQuery不等当前输入时返回空，阻止旧候选暂留。level重置触发的新查询也清旧代际。
- `example.tsx:73–82`立即preventDefault，composition ref为true时拒绝提交，随后读取实际FormData(event.currentTarget).channel并与enabled/完整名称确认的ID比对；不把文本或旧key直接提交，不在异步updater中读事件。
- `example.tsx:124–140`compositionstart/end只维护ref，描述id来自useId、显式aria-describedby与真实Text slot关联。SDK仍拥有Enter/Arrow/IME基本行为，无全局键盘或吞掉尾随Enter的额外状态。合成事件只测应用guard，OS候选框/读屏/触摸仍未测。
- `example.tsx:155–163`ListBoxItem稳定id/textValue分离、isDisabled真实传SDK；confirmedChannel再拒绝禁用或名称不匹配。Popover物理Portal和CSS前缀齐；没有手工伪造列表或网络结果。

## 来源与复用证据

原文实际1915字节，重算SHA-256 `654cbc0c1d8939a0bd808883ebf1a1cca965e86b9ff657dfdf4378592fcb2960`，与library/来源证据一致。完整tree246 README候选未截断且无官方中文；package/npm/安装gitHead与固定版本匹配。官网https://react-aria.adobe.com/的真实GET200头为enforced `Content-Security-Policy: frame-ancestors 'self';`，独立于GitHub/raw资源的XFO，足以支持blocked；未变更公共frame-src或宣称Lab-origin browser已跑。

既有SDK2是真实ReactDOMServer/RAC兼容与现代接口的静态hidden key/input value/描述id，不证明Portal/时序。policy4只过滤/查询对齐/业务确认。输入摘要13文件独立核对无差异；未重跑这些有效命令，不把已有共享build当逐库收据。

## 剩余

无新P1/P2修复要求。真实键盘/禁用指针/空态/Portal、240ms取消与卸载、FormData交互、合成composition guard和窄屏几何待root按稳定候选统一browser；实际OS中文输入法、触摸/读屏、SSR hydration、监听/timer普查仍NOT_RUN。正式sdk/build/browser继续NOT_RUN。

## candidate12 null回调覆盖草稿：增量非作者复核

2026-11-10，quality_e11，实际cwd仍为Lab；候选13构建后按授权只追加本节。原首轮“无阻断”只是当时静态复核结论，未覆盖已由主控candidate12发现的实际异步输入缺陷；不得将原报告当作该运行路径已通过。

修正范围只读核对 `examples/example.tsx:107–120`、guide15/agent7、已有诊断/定向类型格式日志与提案。未修改产品或重跑SDK/policy/browser。

原app在null选择通知中也setInputValue空串，导致已选opensource并提交后，输入React在后续SDK null通知中丢失。现107–114只在有效selected存在时同步完整名；null仍清身份和通知，但不写独立文本。117–120编辑保留输入草稿并清不匹配旧key；显式清空按钮183–185及level reset67–70仍同时清身份与文本。新分工符合双受控inputValue/selectedKey的实际SDK通知契约，没有把null假装有效选中，也没有用延迟重填旧文本规避。

240ms generation/AbortController/clearTimeout、确认规则、FormData同步读取、IME guard均未改。guide/agent已解释null通知与明确清空的差异；browser提案basic编辑断言及advanced140–146保留“选择→真实提交→输入React”序列，检查立即和查询完成后输入仍React，不只检查旧身份清空。旧dist诊断exit0明确是复现失败，不是修复后browser PASS。

增量结论：未确认新P1/P2；此次技术/解释/迁移静态问题已修，既有局部类型/格式/metadata真实exit0可复用，未重测。修正后的真实客户端结果仍NOT_RUN，主控对candidate13定向运行后才能关闭产品运行缺陷。原官方原文/头及其他有效静态结论不变，formal sdk/build/browser不提升。

## candidate13 Escape局部桥接：增量非作者复核

candidate14释放后按授权只追加本节，未改源或重测。只读核对Input129–143、guide/agent、既有escape-format/types/metadata日志及单次Escape提案。

非组合Escape捕获时同步当前有效selected完整名称或空串，随后让SDK继续revert/close。检查composing ref、nativeEvent.isComposing与keyCode229；没有preventDefault/stopPropagation、open状态/焦点覆盖、全局监听或额外timeout。普通null通知保留独立草稿的修正仍在，明确clear/level重置仍可清文本。该最小桥接补足双控revert后lastValue与inputValue对齐，避免关闭后自动打开effect看到旧query又重开。

guide/agent准确说明Escape撤销未确认文本，不再承诺保留查询；提案同时保留普通React输入立即/settled不丢失以及一次Escape的expanded=false、空文本/listbox移除。旧dist诊断是复现true→false→true，不是修正源码运行通过。

未确认新P1/P2；静态技术/讲解/迁移核对通过，既有受影响类型/格式/metadata exit0复用。修正后实际浏览器与真实OS IME仍NOT_RUN，由主控candidate14同时复验输入保留和单次Escape后才可闭环；formal不提升。
