# B01 Motion for React：声明式 UI 动画

Motion（npm 包 `motion`，入口 `motion/react`，旧称 Framer Motion）把 React 状态、布局变化和视觉过渡关联起来。它不是表单库、拖放排序系统，也不是焦点管理工具。Library Lab 固定 `motion@14.6.0`，宿主 React 为 19.3.0。代码只使用免费核心 API，不需要 Motion+。许可证为 MIT；网站上的 Motion+ 示例、组件和开发工具另行计费，免费 API 不等于官方展示的全部 UI 套件可免费使用。`motion` 与历史包 `react-motion`、旧入口 `framer-motion` 不是同一个包。

## Lab 当前示例

挂载入口是 `examples/demo.tsx`，它只再导出 `examples/example.tsx` 的默认组件。Lab 按 `level` 切换三层，三层共用同一文件，不存在原研究稿里的 `src/App.tsx`、`src/components/BasicMotion.tsx`、`TaskBoard.tsx`、`ReorderWorkspace.tsx` 或 `localhost:5173`。

已挂载的模式：

- `basic`：`AnimatePresence initial={false}` 包住条件渲染的 `motion.article`，`key="notice"`。显示/隐藏走真实 `<button aria-pressed>`。`initial` / `animate` / `exit` 在减少动画时去掉位移，时长改为 0。
- `business` 与 `advanced`：任务数组是事实源。`appendUniqueCard` / `archiveCard` 来自 `examples/card-policy.ts`，上限 `MAX_MOTION_CARDS = 12`，拒绝重复 id，不改原数组。`motion.li` 的 `key` 是 `card.id`。列表父级 `motion.ul layout={!reduced}`，子项同样 `layout={!reduced}`。
- 焦点：只有被归档的按钮当时就是 `document.activeElement` 时才置标记；`useLayoutEffect([cards])` 在提交后把焦点交给「添加任务」。鼠标点别的控件不会抢焦点。候选 id 在点击里自增，不放进可能重放的 React updater。
- 全树包在 `<MotionConfig reducedMotion="user">` 里，并读取 `useReducedMotion()`。`advanced` 用 `role="status"` 报出偏好是否开启，并提供 `moveFirstToEnd` 与恢复初始列表。

当前 demo **没有挂载**、仍作为生产教学保留的模式：`Reorder.Group` / `Reorder.Item`、拖动手柄与 `dragListener={false}`、`useScroll` + `useSpring` 的滚动进度、`LayoutGroup` + `layoutId` 的筛选指示条、`AnimatePresence mode="popLayout"`（列表现在用默认同步进出）、筛选/搜索派生列表、中文 IME 组合期拦截。不要把这份示例说成完整看板或滚动叙事。

## 什么时候使用

| 需求 | 是否优先选 Motion | 理由 |
| --- | --- | --- |
| 按钮 hover、单色过渡 | 否，优先 CSS | 一两条 transition 不必增加运行时 |
| 列表增加/删除且要 exit 与位置过渡 | 是 | AnimatePresence 等到 exit 结束再卸载 |
| 跨组件共享卡片、选项卡指示条 | 是 | `layoutId` 与 `LayoutGroup` 表达布局连续性 |
| 简单一维拖动排序 | 可选 | Reorder 上手快，仍要补键盘替代 |
| 多容器看板、碰撞、完整拖放无障碍 | 不作为唯一方案 | 交给 B13 dnd-kit 或 B14 Pragmatic |
| 复杂时间线、广告转场 | 优先对比 GSAP | 时间线控制粒度可能更合适 |
| 滚动进度条 | 可以，先判断 CSS | `useScroll` 避免每帧 `setState` |
| 完整弹窗 / 菜单 | 否 | 焦点陷阱、ARIA、Escape 交给 B10/B11/B12 |

## 概念模型

`<motion.div>` 接收常规 DOM 属性，另接 `initial`、`animate`、`exit`、`transition`、`whileHover` / `whileTap` / `whileDrag`、`layout`、`layoutId`。业务事实放在 React，Motion 只负责可视变化。状态变了，React 给出新目标，Motion 启动或打断过渡。不要让动画驱动业务事实，也不要把 `onAnimationComplete` 当成保存成功。

`AnimatePresence` 必须留在条件分支**外面**，用稳定 `key` 跟踪即将卸载的直接子节点，exit 完成后再移除。`mode="sync"` 同时进出。`mode="wait"` 只适用于**同时一个孩子**的顺序切换。`mode="popLayout"` 让其余项立刻重排，但父级需要定位上下文，自定义直接子组件必须把 ref 转到真实 DOM。Lab 列表没有使用 `popLayout`，生产列表若要「删一行、其余立刻靠拢」，再单独加上并测定位。

`layout` 测量 React 提交造成的位置/尺寸变化并补间。`layoutId` 让两处 DOM 看起来连续。同一页面多实例必须用 `LayoutGroup` 隔离共享 id。`useMotionValue` / `useTransform` / `useSpring` 在视觉层逐帧更新，避免滚动或指针事件每帧 `setState`。MotionValue 不是任务存储，不能写进 TanStack Query cache。

底层可能走 Web Animations API。是否进入合成线程取决于属性和浏览器。优先动画 `transform` 和 `opacity`，用 Performance 面板确认。不要承诺固定 60/120fps，也不要承诺 0 次 React render。

## 三层渐进

### Demo ① 入场与退出（已挂载）

按「隐藏/显示提示卡片」。`visible` 改变后，presence 保持挂载，子节点带 `key="notice"` 播放 `exit`。`initial={false}` 避免第一次挂上整棵树就播入场，减轻 SSR/首屏闪动。减少动画时 `enter` 为 `false`，`leave` 只剩 `opacity`。

预期：卡片颜色区域淡入淡出；减少动画时没有 y 位移。点击的是真实 button，Tab 能到达且焦点可见。浏览器里的实际帧还没有本条目 receipt，见文末证据。

### Demo ② 任务列表（已挂载的增删；筛选是未挂载的生产教学）

Lab 的 business 层做新增和归档。新任务用单调整数 id，`appendUniqueCard` 在满 12 条或 id 冲突时返回新数组副本但不追加。归档调用 `archiveCard`，按 id 过滤，不重排其他人的身份。添加按钮在达到上限时 `disabled`。

生产里还应有搜索词、全部/未完成/已完成。过滤必须是派生值，不能把过滤结果写回权威数组。选中的筛选按钮可以用 `LayoutGroup` 里的 `motion.span layoutId="selected-filter"` 做指示条，语义仍用 `aria-pressed`。Lab **没有**挂这组筛选。空列表要有明确文案；Lab 允许归档到 0 条，此时 status 报「当前任务：0 项」。

### Demo ③ 重排与减少动画（部分挂载）

`advanced` 把第一项移到末尾：`moveFirstToEnd` 返回 `[...slice(1), head]`，空数组和单元素保持原样。`layout` 只在未减少动画时打开。恢复初始列表会清掉待转移焦点标记。

未挂载的生产教学：`Reorder.Group axis="y"`、`dragControls`、手柄上的 `touch-action: none`，以及每项「上移/下移」。非指针用户必须能完成同样的顺序变更。滚动进度应是 `useScroll` → `useSpring` → `scaleX`，减少动画时直接用 `scrollYProgress`。这只覆盖简单纵向排序，不包含跨列、碰撞、自动保存。需要可访问拖放时换 B13/B14。

## 反例

### AnimatePresence 放在条件里面

```tsx
// 错：open 变 false 时 presence 一起卸载，exit 没有时间跑
{open && (
  <AnimatePresence>
    <motion.aside exit={{opacity: 0}} />
  </AnimatePresence>
)}

// 对：presence 保持挂载，稳定 key 跟踪退出
<AnimatePresence initial={false}>
  {open && <motion.aside key="help" exit={{opacity: 0}} />}
</AnimatePresence>
```

Lab 的提示卡片就是第二种：presence 在条件外，`key="notice"`。

### 用数组下标当身份

```tsx
// 错：插入、归档、moveFirstToEnd 后下标变了，旧 DOM 套上新文案
{cards.map((card, index) => (
  <motion.li layout key={index}>{card.title}</motion.li>
))}

// 对：业务 id 不随位置变
{cards.map(card => (
  <motion.li layout key={card.id}>{card.title}</motion.li>
))}
```

### 滚动每帧 setState

```tsx
// 错：scroll listener 迫使 React 参与逐帧调度
useEffect(() => {
  const onScroll = () => setProgress(window.scrollY);
  window.addEventListener('scroll', onScroll);
  return () => window.removeEventListener('scroll', onScroll);
}, []);

// 对：只追踪视觉值；业务抽样再另订阅
const {scrollYProgress} = useScroll();
const scaleX = useSpring(scrollYProgress);
return <motion.div style={{scaleX}} />;
```

Lab 没有滚动条 demo。不要为了「看起来完整」在列表里加 scroll listener。

### 忽略减少动画

```tsx
// 错：大位移无视系统偏好
<motion.div animate={{x: isOpen ? 0 : -500}} />

// 对：hook 在组件顶层调用；根上再设 MotionConfig
const reduce = useReducedMotion();
return (
  <motion.div
    animate={{
      x: reduce ? 0 : isOpen ? 0 : -40,
      opacity: isOpen ? 1 : 0,
    }}
  />
);
```

`MotionConfig` 的默认 `reducedMotion` 是 `never`。Lab 显式写成 `"user"`，并在位移目标上再分支。只靠全局配置不够：自定义的 rotate/x 仍要自己关掉。

### 用 motion 元素冒充按钮

```tsx
// 错：div 没有按钮的键盘语义
<motion.div onClick={submit} whileTap={{scale: 0.96}}>提交</motion.div>

// 对：动画是渐进增强
<motion.button type="button" onClick={submit} whileTap={{scale: 0.96}}>
  提交
</motion.button>
```

Lab 的添加、归档、移动都是 `<button type="button">`。

### 多子节点误用 mode="wait"

```tsx
// 错：wait 只支持一个直接子元素
<AnimatePresence mode="wait">
  {tasks.map(task => <motion.li key={task.id} exit={{opacity: 0}} />)}
</AnimatePresence>

// 对：多行用 popLayout，父级要有定位上下文
<ul style={{position: 'relative'}}>
  <AnimatePresence mode="popLayout">
    {tasks.map(task => (
      <motion.li key={task.id} layout exit={{opacity: 0}} />
    ))}
  </AnimatePresence>
</ul>
```

Lab 列表目前是默认 mode。若改成 `popLayout`，自定义行组件必须 forwardRef 到 DOM，否则测量失败、行会突然消失。

另外：不要在 `onAnimationComplete` 里才提交归档；不要每次 render 新建动态组件类型；避免动画 width/height 把周围内容打回布局。删除按钮若正持有焦点，必须在提交后把焦点交给仍然存在的控件——Lab 用 layout effect，而不是 `queueMicrotask`。

## 交互边界

Motion 的 `whileTap` / `whileHover` 不实现对话框焦点陷阱、Popover 关闭或菜单键盘模型。正式 Dialog 用 B10、B11 或 B12 管语义、焦点、Escape、Portal 和回焦，再用 Motion 做内容进出。exit 期间还要处理 inert、焦点迁移和滚动锁定。验收至少包括 Tab / Shift+Tab、Enter / Space、Escape、系统减少动画。

不要动画 `input` 的 value、光标，也不要在每次按键时改外层 key。中文输入的组合阶段不能把 Enter 当成提交。Lab 没有文本框；生产搜索必须把 draft 与已提交 query 分开。

Portal 里的 presence 仍要包住条件内容。定位库和 Motion 不要写同一个 `transform`。`popLayout` 的样式注入可以指向 ShadowRoot；带 CSP nonce 的应用用 `MotionConfig` 的 `nonce`，并在目标 CSP 下实测，不要靠 `unsafe-inline` 绕过。

## 组合

**Motion + Radix / Base UI / React Aria**：定位、焦点、触发器、关闭归无头组件；Motion 只淡入和轻缩放。浮动层与视觉 transform 分层。不要用一个 `motion.div` 自制生产 Dialog。

**Motion + TanStack Query**：Query 拥有缓存、mutation、错误。React 把结果映射成稳定 id。Motion 只做视觉。删除请求成功后立刻改数据，exit 动画不能挡住已发生的删除。乐观更新失败由数据层回滚，动画跟着新目标走。不要把 MotionValue 放进 query cache。

**Motion + dnd-kit / Embla**：拖放意图、键盘传感器、吸附和容器位移各有主人。Motion 可以装饰卡片内部。两个引擎不要同时改同一 DOM 的 transform。先看专用库自己的动画够不够。

## 生产清单

1. 能用 CSS 解决的 hover/focus，不要先上 JS 动画。
2. 主要动 `transform` / `opacity`。高频滚动用 MotionValue。
3. `layout` 要测量。成百上千项同时 layout 会贵，配合虚拟列表或局部过渡。
4. 低端设备录 Performance、长任务和布局偏移。不要编造 fps。
5. `prefers-reduced-motion: reduce` 时减弱位移和缩放。功能按钮保持可用。
6. SSR 首屏与 hydration 一致。需要时 `initial={false}`。`motion/react-client` 是服务端组件场景的入口，不是 SPA 默认入口。
7. 卸载时清掉自己注册的监听、定时器和观察器。AnimatePresence 会推迟 DOM 移除，业务 effect 仍要对称清理。
8. 列表 key、焦点接收者、容量上限放在可单测的纯函数里。Lab 的 `card-policy.ts` 就是这层。

## 升级

从 `framer-motion` 迁到 `motion/react`：先核对锁文件里的主版本和迁移说明，再改 import。不要批量把 `react-motion` 的 `spring()` 描述对象塞进 `animate`。B21 记录那条历史迁移。记录包版本、类型检查和浏览器回归之后再删旧依赖。

| 候选 | 首选时机 | 不适用 |
| --- | --- | --- |
| CSS | 单元素 hover/开合 | 卸载退出、跨元素共享布局 |
| Motion | React 状态驱动的进出和适度 layout | 完整拖放键盘模型、复杂时间线 |
| GSAP | 精细时间线、滚动叙事 | 只要列表自然出现/消失 |
| react-spring（B03） | 需要弹簧物理和命令式 api | 普通 exit 不一定更省代码 |
| dnd-kit（B13） | 多容器、键盘拖放 | 没有拖拽、只要排布动画 |

## 故障排查

| 现象 | 先检查 |
| --- | --- |
| exit 不播放 | presence 是否一直挂着；直接子节点有没有稳定 key；exit 是否写在内部 motion 上 |
| 行从错误位置进入 | 是否用了 index key；是否在动画回调里改了 id |
| layoutId 串到无关组件 | 多实例是否缺 LayoutGroup |
| popLayout 下自定义组件消失 | 是否把 ref 转到 DOM；父级是否 `position: relative` |
| 弹层偏了 | 定位库和 Motion 是否抢同一个 transform |
| 手机整页不能滚 | `touch-action: none` 是否写到了整列而不是手柄 |
| 减少动画仍在旋转 | MotionConfig 是否为 `user`；自定义 rotate 是否按 `useReducedMotion` 分支 |
| 首屏闪或 hydration 不一致 | `initial` 与服务端结构是否一致 |
| 归档后焦点丢了 | 是否在被删按钮持焦时，于 commit 之后再 focus；不要用 microtask 抢在 DOM 提交前 |

## 练习与验收

练习 A：给任务加优先级筛选。权威状态不复制，过滤是派生，key 稳定，空状态可见，exit 完整。练习 B：在保留上移/下移的前提下说明何时必须改用 dnd-kit。练习 C：系统开启减少动画后，位移关闭，添加/归档/恢复仍然可用。

本条目 `verification.json` 的 sdk、build、browser 均为 NOT_RUN。`docs/library-lab/evidence/runs/` 没有与本条目指纹匹配的 receipt 之前，不能把历史计数写成 SDK PASS。GitHub Actions run `41779873259` 是仓库级检查（install、typecheck、build、52 个 SDK 文件 / 153 项测试、45 个 Playwright），不是 B01 的 PASS。

可运行的窄测试：

```bash
node --experimental-strip-types --test packages/library-lab/entries/B01-motion-for-react/tests/card-policy.test.mts
```

它断言容量、唯一 id、归档不重编号、`moveFirstToEnd`。它不证明 AnimatePresence、焦点或减少动画的浏览器行为。

## 官方资料

- https://motion.dev/docs/react
- https://motion.dev/docs/react-motion-component
- https://motion.dev/docs/react-animate-presence
- https://motion.dev/docs/react-layout-animations
- https://motion.dev/docs/react-reorder
- https://motion.dev/docs/react-motion-config
- https://motion.dev/docs/react-use-reduced-motion
- https://motion.dev/docs/react-use-scroll
- https://motion.dev/docs/react-motion-value
- https://motion.dev/docs/performance
- https://www.npmjs.com/package/motion
- https://github.com/motiondivision/motion/blob/main/packages/motion/LICENSE.md
