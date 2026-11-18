# B17 Floating UI复用指南

适用于自己组合DOM、样式、定位和交互；现成可访问组件先比较Radix/Base UI。锁定@floating-ui/react0.27.20（MIT），React/react-dom>=17；只有定位需求可评估react-dom包。

## 接线与边界

useFloating接open/onOpenChange、placement和middleware；绑定refs.setReference/setFloating并应用floatingStyles。offset10→flip→shift，basic明确传入本地Element碰撞边界及12px padding、禁flipAlignment以便观察水平shift；其他场景默认viewport/clipping。检查器读取SDK真实x/y/placement/isPositioned/shift；坐标不是容器局部值，初次计算前或关闭后的值不能当当前DOM位置。

useClick/useDismiss/useRole通过useInteractions prop getters组合；Portal只换DOM位置，FocusManager明确modal=false/returnFocus。reference始终挂载，浮层仅open时挂载；包装真实autoUpdate的whileElementsMounted返回真正cleanup。显式应用锚点移动后update，不创建逐帧轮询。

returnFocus并非强抢焦点：Escape/内部动作关闭通常返回reference，非模态Tab或点击外部控件后尊重新目标。不要把本例写成焦点陷阱、完整菜单或Combobox。

## 三个独立目标

- basic：同一个Popover改变首选方向和锚点位置，比较requested与resolved、真实shift和DOM边界；确认关闭后订阅active0。
- business：本地收藏/已读独立切换，成功复制才关闭；真实权限失败保持打开。Tab可离开并操作页面下一步。
- advanced：独立滚动容器跟随，草稿query和appliedQuery分离，IME候选Enter不提交，普通Enter/确认使4条变1条或0条。

## 必须保留

带走example.tsx、positioning.ts、business-policy.ts、ime-guard.ts、workshop.css；demo.tsx只适配Lab。Portal浮层独立CSS选择器，不能只依赖section后代样式。

关闭、卸载、下一次复制同步推进clipboardRequest，只阻止迟到UI写回，不声称取消操作系统剪贴板。不同level关闭旧浮层并作废剪贴板所有权。IME guard的ref/isComposing/229/尾随Enter策略、已提交列表的真实变化、FocusManager清理都不能删。

SDK不负责收藏/已读、Unicode搜索或剪贴板权限；这些在示例中自建。b17-lifecycle统计真实autoUpdate建立/cleanup调用，是自建观察，不是SDK公开计数。生产接入应统一焦点/Escape所有者、设计系统层级和数据层失败/回滚。

## 验证与来源

SDK3项：保留真实React hooks SSR语义，新增同源middleware+真实computePosition的正常定位/flip+shift；custom platform只是固定几何输入，不能声称真实DOM。纯IME8项（原4+4个确认事件序列回归）与原文章5项独立记账。browser需真实位置变化/边界、Escape焦点、非模态Tab、滚动跟随、IME、关闭与卸载；提案在validation/browser-proposal.txt，由主控接入。

固定官方标签@floating-ui/react@0.27.20→commit12d94738472e922e1b3fa31b02b2b61b9ed77e6a；原文/语言/version/日期/hash及官网完整响应依据在official和library.json。没有真实Lab-origin浏览器证据不写allowed。正式verification均NOT_RUN，局部检查与六项结论见local-validation.md。

本轮官方根README原文4922字节，英文，SHA256 `b352baf175998877bad6168b0e55cf887690ede7a85acdfea344de996744d123`；同ref没有中文根/目标包候选，React包README仅73字节简介，选择内容完整的根README。官网GET200完整响应头无XFO/CSP，真实Lab-origin iframe未跑，状态为unknown，保留官网直达。

IME增量修正：尾随确认Enter保护限定80ms，不再因任意compositionend无限吞掉下一次普通Enter。Space确认抬键或后续非合成字符清除；鼠标确认无Enter keyup也会到期。保护窗是本例保守事件策略，不能代替实际设备验收；isComposing/229保护保留。
