# Floating UI：锚点移动后，位置、交互和焦点分别由谁负责

文章旁边的操作面板不能只写一组固定top/left：页面滚动、按钮移动或屏幕变窄后，它仍要跟着锚点，并在空间不足时换边。键盘用户还需要知道打开后焦点去哪、怎样离开、关闭后回到哪里。

`@floating-ui/react@0.27.20`（MIT）提供定位与交互原语，适合需要自己组合DOM、样式和行为的Popover、Tooltip等。它没有替你做好业务组件；需要现成可访问组件时先比较Radix或Base UI。只有定位需求可评估较小的`@floating-ui/react-dom`。本例数据与动作均为本地教学，复制调用浏览器真实Clipboard API，没有外部新闻服务。

## 从输入到可见浮层

| 输入/步骤 | 实际调用与输出 | 所有者 |
| --- | --- | --- |
| 打开状态、首选方向、两个DOM节点 | `useFloating({open, onOpenChange, placement})`，绑定`refs.setReference/setFloating` | React拥有状态，SDK计算位置 |
| 偏移与碰撞 | `offset(10)` → `flip(...)` → `shift(...)` | SDK middleware按顺序运行 |
| 应用计算结果 | `floatingStyles`给浮层；返回的`placement/x/y/isPositioned`供观察 | 应用真正输出DOM与样式 |
| 点击、Escape、外部按下、ARIA | `useClick/useDismiss/useRole` → `useInteractions`的prop getters | SDK交互组合，应用保留清晰命名 |
| Portal与焦点 | `FloatingPortal`改变DOM挂载位置；`FloatingFocusManager`管理进入/离开 | Portal本身不管理焦点 |
| 文章状态、过滤、复制完成代际 | `business-policy`、`ime-guard`、`clipboardRequest` | 示例自建逻辑，不是定位SDK能力 |

参考按钮始终挂载；仅`open`时挂载浮层。`whileElementsMounted`包装真实`autoUpdate`，在两节点存在期间建立滚动/resize/元素变化跟踪，并返回真正cleanup。仅用CSS隐藏的常驻浮层不能照搬这种条件，应在effect里明确启动与清理。默认autoUpdate不是逐帧动画循环；transform动画跟踪需要另行决定是否启用animationFrame。

[核心源码](examples/example.tsx)的接线如下，完整运行文件都在源码区：

```tsx
const {refs, floatingStyles, context, placement} = useFloating({
  open,
  onOpenChange: setPopoverOpen,
  placement: requestedPlacement,
  middleware,
  whileElementsMounted: trackAutoUpdate,
})
const click = useClick(context)
const dismiss = useDismiss(context, {escapeKey: true, outsidePress: true})
const role = useRole(context, {role: 'dialog'})
const {getReferenceProps, getFloatingProps} = useInteractions([click, dismiss, role])
```

prop getters合并事件；不要另外覆盖它们的onClick/onKeyDown。定位时需要渲染后的元素尺寸，不能把首次默认坐标当最终结果。检查器的`isPositioned`为true后再读；关闭后保留的坐标不代表仍有浮层。

## 实验一：首选方向不是最终方向

工程问题：同一个锚点从左上移动到右下后，怎样证明浮层真的翻转、平移，而不是只改一句提示？

1. 打开basic，先让虚线框完整进入视口。点击“打开详情”，展开“查看真实定位结果”；默认锚点左上、首选bottom-start，在空间足够时实际结果保持bottom-start。
2. 浮层里的“锚点位置”改为“右下”，首选方向保持bottom-start。SDK会尝试换到top-start，再水平平移；看浮层真实DOM位置、`resolvedPlacement`与`shift.x`的变化。
3. “首选方向”改为top-start，再把锚点放回左上。上方空间不足时，实际方向可能重新变为bottom-start。改变请求方向不等于承诺那个方向一定放得下。
4. 按Escape或点击“确认并关闭”，浮层消失、焦点返回触发器，autoUpdate实际订阅变为0。重新打开仍能正确定位。

虚线框是**本例明确指定的Element碰撞边界**；root viewport仍参与限制。不是所有浮层都天然以最近的视觉容器为边界。基础实验使用[同源middleware](examples/positioning.ts)：offset留10px，flip禁止alignment自动从start换到end，以便单独观察换上下边和shift的水平修正。shift默认在该placement的主轴修正：top/bottom布局时主要修正x；它不是自动缩小浮层的size middleware。任何候选方向都放不下时，flip的best-fit也不能保证没有溢出。

检查器读取真实SDK返回值，不计算一套替代坐标。x/y属于返回strategy所使用的定位坐标系，不直接等同于虚线框内的局部坐标；浏览器验收用实际DOMRect比较边界。锚点位置是应用状态，变更后effect调用update重新读取布局；位置仍由SDK计算。小屏保留max-width，具体尺寸和滚动依然是应用责任。

## 实验二：非模态操作要真正改变文章

工程问题：面板只是操作入口，关闭之后业务数据是否还在？

1. 打开business的“新闻操作”，选择“加入稍后阅读”。面板关闭，页面上的文章状态变为“已稍后阅读”；再打开并移出，布尔值恢复。已读状态独立切换，不影响收藏。
2. 再打开，用Tab/Shift+Tab移动。`modal={false}`允许离开；页面后面的“浮层外的下一步”是可操作目标，点击会增加本地次数。焦点已经进入外部控件时，不应再被强行拉回触发器。
3. 选择“复制示例引用到剪贴板”调用真实`navigator.clipboard.writeText`。成功才显示“已复制”并关闭；缺API、非安全上下文或权限失败会保持打开并显示alert，不伪造成功。
4. 复制尚未完成时按Escape关闭，再打开或离开页面。旧Promise无权改写新的成功/错误状态。系统复制本身没有因此被取消；本例只撤销迟到UI回调的所有权。

`returnFocus`默认true，但浮层已经失焦时SDK会尊重新目标；不能断言外部点击、Tab离开、Escape三种关闭都强抢回按钮。Escape或内部动作关闭时，焦点仍在浮层内，通常返回reference。Portal保留React树的Tab次序，浮层渲染在reference之后，外部下一步在浮层之后。此处不是模态对话框，也没有焦点陷阱、滚动锁或菜单方向键导航。

关闭路径同步递增`clipboardRequest`，下一次复制和卸载也递增；只允许当前编号写结果。若只在open变化的effect中撤销，关闭和Promise完成可能竞争。文章状态和复制完成提示分开，不从floatingStyles恢复业务状态。

## 实验三：滚动与中文输入都不能丢掉所有权

工程问题：浮层Portal到body后，怎样跟随独立滚动容器，并避免输入法选字的Enter误提交？

1. 打开advanced的“编辑过滤条件”，初始焦点进入“筛选关键词”。滚动虚线框，观察浮层随锚点重新计算；Portal使DOM不被那个overflow容器裁切，但不会自动修好定位，跟随来自autoUpdate。
2. 输入React。草稿变了，本地结果仍是4项。合成中、原生isComposing、keyCode229或合成刚结束的同一次Enter都不应用过滤；后续普通Enter或点击“应用过滤”才提交，结果变为1项“React 浮层焦点管理”。
3. 重新打开，清空再应用，回到4项；输入无匹配文本应用后明确得到0项。查询规范化和匹配由本例[业务函数](examples/business-policy.ts)处理，SDK不搜索文章。
4. Escape关闭后焦点回触发器；关闭时订阅active应归零。运行中切换场景或宿主停止时，浮层、FocusManager和autoUpdate生命周期结束，剪贴板代际也失效；重新启动为新实例。

[IME守卫](examples/ime-guard.ts)保持在ref上同步读取，不依赖React批量状态的更新时间。compositionend只建立80ms保守尾随保护窗；Enter/Space keyup、后续非合成字符或失焦清除，鼠标确认没有keyup也会到期；不能用这套示例事件策略替代真实设备输入法验收。没有VirtualElement、选区工具条、完整Combobox或ListNavigation实现。

## 可迁移文件与取舍

```sh
pnpm add @floating-ui/react@0.27.20
```

React/react-dom peer均>=17。复制example.tsx、positioning.ts、business-policy.ts、ime-guard.ts、workshop.css并保留相对路径；demo.tsx只是Lab出口。CSS是必要资源，Portal到body的浮层有独立`.b17-dialog`选择器，不依赖section后代样式。z-index9999是本例选择，迁移时接设计系统的层级。

把本地文章动作换成服务端更新时，用应用数据层管理请求、失败和回滚；不能因为浮层关闭就丢掉提交结果。clipboard API只适用于允许的安全上下文。本例没有第三方资源、网络请求或存储持久化。

条件挂载+whileElementsMounted负责定位订阅清理，FocusManager/interaction hooks负责自己的监听与焦点清理。`b17-lifecycle`统计包装器实际建立/调用cleanup的次数，active不是简单把open转成0/1，更不是SDK公开指标；它只帮助观察本例生命周期。不要再增加一套document级Escape监听与SDK争抢处理。

## 官方来源和验证边界

固定官方React0.27.20标签解析到`12d94738472e922e1b3fa31b02b2b61b9ed77e6a`。本地检查React adapter types/esm、实际react-dom及DOM/core传递依赖；当前官网文档用于机制解释，精确API以本地0.27.20类型为准。官方原文与语言回退、完整响应头、sha256见library.json和official/source-evidence.json，与本地中文教学分开。

- [官方React接入](https://floating-ui.com/docs/react)
- [autoUpdate](https://floating-ui.com/docs/autoUpdate)
- [flip](https://floating-ui.com/docs/flip)与[shift](https://floating-ui.com/docs/shift)
- [非模态焦点管理](https://floating-ui.com/docs/FloatingFocusManager)

真实SDK套件包括React hooks语义接线与公开custom platform上的真实computePosition/碰撞算法；后者的几何输入是固定fixture，不是浏览器DOM。IME和文章策略测试独立记账。它们不能证明焦点返回、Portal、实际滚动、复制权限或卸载清理。局部命令/日志/六项状态见local-validation.md；正式verification保持NOT_RUN，浏览器由主控在匹配候选执行。

本轮官方根README原文4922字节，英文，SHA256 `b352baf175998877bad6168b0e55cf887690ede7a85acdfea344de996744d123`；同ref没有中文根/目标包候选，React包README仅73字节简介，选择内容完整的根README。官网GET200完整响应头无XFO/CSP，真实Lab-origin iframe未跑，状态为unknown，保留官网直达。

IME增量修正：尾随确认Enter保护限定80ms，不再因任意compositionend无限吞掉下一次普通Enter。Space确认抬键或后续非合成字符清除；鼠标确认无Enter keyup也会到期。保护窗是本例保守事件策略，不能代替实际设备验收；isComposing/229保护保留。
