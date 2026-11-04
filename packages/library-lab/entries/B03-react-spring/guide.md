# B03 react-spring：弹簧物理与列表进出

`@react-spring/web` 用弹簧把多个视觉目标连成连续运动。定长 CSS transition 在目标不断改写时容易拼接生硬；`animated` 把 `SpringValue` 写到 DOM，动画帧不必每次 `setState`。Library Lab 固定 `@react-spring/web@10.1.2`，宿主 React 19.3.0。许可证 MIT。官方 v10 面向 React 19；React 18 项目应留在 v9。11.0.0-beta 不是本条目的稳定基线。不要把 `@react-spring/three` 当成 DOM 入口。

## Lab 当前示例

挂载文件是 `examples/example.tsx`（`examples/demo.tsx` 只再导出）。三层共用一个组件，没有原研究稿的 `workshop/src/App.tsx`、`BasicSpring.tsx`、`NoticeCenter.tsx`、`PointerCard.tsx` 或 Vite `localhost:5173`。

已挂载：

- 所有层都有 `useSpring`：`expanded` 映射到 `opacity` 与 `translateY`，`config` 为 `{tension: 240, friction: 28}`。`immediate: reduced` 让系统减少动画时跳到终值。
- 减少动画来自组件内的 `matchMedia('(prefers-reduced-motion: reduce)')`，订阅 `change` 并在 cleanup 移除。**没有**调用 `Globals.assign` 或官方 `useReducedMotion`（后者会改全局 `skipAnimation`）。
- `business` / `advanced` 使用 **`@react-spring/web` 的 `useTransition`**，`keys: item => item.id`。from / enter / leave 是透明度加 `translateX`。离场节点由 transition 保留到动画结束。
- 列表上限 `MAX_SPRING_ARTICLES = 12`。`appendUniqueArticle` 拒绝重复 id 和超限。id 在点击里自增。
- 焦点：`focusDestinationAfterRemoval` 只在被删按钮持焦时返回目标。未满员时焦点到「添加」；删除后仍处于容量上限则改到始终可用的「恢复默认」。`useLayoutEffect` 等提交后再 `focus()`，并跳过已断开或仍 disabled 的按钮。

未挂载、仍要教的生产模式：指针捕获跟手（`api.start({immediate: true})`）、松手回弹、`AbortController` + epoch 的通知回填、离场节点 `aria-hidden` 并撤掉操作按钮、把通知正文当 HTML 插入。Lab 的移除按钮在 transition 回调里仍然渲染；生产离场项不应继续可点。

## 什么时候使用

适合卡片在多个目标之间连续变化、通知进出、位置/比例/颜色的可中断插值。不适合：静态 hover（CSS）、整页时间线（GSAP）、声明式 layout/手势优先的界面（B01 Motion）、几千行列表（先虚拟化）、排序拖放（B13/B14）。react-spring 不是拖拽系统。

## 概念模型

### 声明式 useSpring

```tsx
import {animated, useSpring} from '@react-spring/web';

function Example({open}: {open: boolean}) {
  const styles = useSpring({
    opacity: open ? 1 : 0.45,
    transform: open ? 'translateY(0px)' : 'translateY(18px)',
    immediate: false,
    config: {tension: 240, friction: 28},
  });
  return <animated.div style={styles}>状态由 React 提供</animated.div>;
}
```

`opacity` 和 `transform` 是活动的 `SpringValue`，不要 `JSON.stringify` 当业务数据，也不要声明成普通 `CSSProperties` 后丢掉类型。Lab 把 `transform` 写成字符串，而不是简写 `y`，避免和别的库抢同一套 style 字段时看不清主人。

### 命令式 api

函数形式 `useSpring(() => ({x: 0}), [])` 返回 `[styles, api]`。`api.start` 改目标，`api.set` 立刻跳，`api.stop` 停止。拿到 api 却从不 `start`，弹簧会停在旧目标。跟手时按住用 `immediate: true`，松开再物理回弹。Lab **没有**这条命令式路径。

### useTransition 不是 React 的 useTransition

```tsx
import {animated, useTransition} from '@react-spring/web';

const transitions = useTransition(rows, {
  keys: row => row.id,
  from: {opacity: 0, transform: 'translateX(22px)'},
  enter: {opacity: 1, transform: 'translateX(0px)'},
  leave: {opacity: 0, transform: 'translateX(-22px)'},
});
```

`keys` 必须是稳定业务 id。离场对象暂时还在画面上，但已经不属于权威数组。官方还列出 `exitBeforeEnter`、`expires`、`trail`、`sort`。Lab 没有打开 `exitBeforeEnter`。

`config.mass` / `tension` / `friction` 没有固定毫秒。`config.gentle` 等是预设。`clamp: true` 可抑制过冲。`onChange` 是每帧回调，不能拿去写库或当保存成功。`onRest` 表示停下，仍要区分取消。10.1.2 的 `onChange` `AnimationResult` 形状有修复，迁移旧代码时看发行说明。

## 三层渐进

### Demo ① 弹簧卡片（已挂载）

按钮切换 `expanded`，`aria-pressed` 暴露开关。数据流：布尔 → `useSpring` → `animated.div`。减少动画时 `immediate` 跳到终值。状态文案写在旁边的 `<strong>` 里，不靠动画是否播完。

### Demo ② 阅读列表（已挂载的进出；异步通知中心未挂载）

添加、移除、恢复默认。权威数组在 React state。`useTransition` 只消费这份数组。status 报「逻辑上还存在 N 条；离场动画元素随后卸载」，把视觉残留和数据分开。

未挂载的生产教学：新请求先 `abort` 旧的 `AbortController`，再用序号丢掉不尊重 abort 的迟到结果；卸载时清理。通知正文只作为 React 文本子节点。`<img onerror>` 一类字符串不得进 `innerHTML`。离场项 `aria-hidden`，并且不再渲染可操作按钮；移除前把焦点移到稳定控件。Lab 只实现了焦点策略的纯函数和 layout effect，没有隐藏离场按钮。

### Demo ③ 偏好与快速操作（部分挂载）

`advanced` 说明焦点规则，并在容量边界使用「恢复」而不是禁用的「添加」。减少动画对 spring 和 transition 都是 `immediate`。

未挂载：`setPointerCapture`、单一 `pointerId`、`pointercancel` / `lostpointercapture` 幂等回位、方向键每次 20px、Escape 复位、`touch-action: none` 只放在手柄。那是位移回弹，不是有排序语义的拖放。卸载时若使用了命令式 api，要 `api.stop()`。

## 反例

```tsx
// 错：不传 keys，或用 index。重排后 A 的内容播 B 的动画
useTransition(items, {from: {opacity: 0}, enter: {opacity: 1}});

// 对
useTransition(items, {keys: item => item.id, /* ... */});
```

```tsx
// 错：这是 React 18+ 的并发 hook，返回 pending 与 startTransition
import {useTransition} from 'react';

// 对
import {useTransition} from '@react-spring/web';
```

```tsx
// 错：函数形式拿到 api 后只改配置
const [, api] = useSpring(() => ({x: 0}), []);

// 对：命令式场景必须 start；声明式场景用对象配置（Lab 的卡片就是这种）
void api.start({x: 100});
```

```tsx
// 错：onChange 每帧 setState
onChange: ({value}) => setX(value.x),

// 对：跟手走 SpringRef；业务状态只在松手或按键确认时变
```

```tsx
// 错：通知正文 innerHTML
node.innerHTML = notice.body;

// 对：React 文本子节点。富文本走独立白名单，动画库不提供净化
```

```tsx
// 错：每个子组件各自 Globals.assign({skipAnimation: true}) 且不恢复
// 对：顶层读 matchMedia，把 immediate 传下去。Lab 的 useLocalReducedMotion 就是这个所有权
```

```tsx
// 错：React 18 硬装 @react-spring/web@10
// 对：React 18 用 v9，或先把应用升到 React 19 再上 10.1.2
```

离开数组之后 DOM 不会立刻消失。离场阶段的焦点、点击和读屏都要单独处理。多指拖动不过滤 `pointerId`、不听 `pointercancel`，卡片会卡在拖动态。Lab 没有实现拖动，不要在指南里假装有。

## 组合

**TanStack Query**：`queryKey` 拥有服务端数组、重试和取消。spring 只画列表。`isFetching` 不能由 `onRest` 改写。不要在 `useState` 和 Query cache 各存一份权威列表。

**dnd-kit**：碰撞和落点归 dnd-kit。spring 只装饰 `DragOverlay` 或结束后的局部弹性。两套库都写 `transform` 时，外层与内层 `animated` 必须分开，或只留一个动画主人。Lab 的键盘替代若要做排序，应是按钮改数组，而不是弹簧自己算索引。

**React Aria**：焦点陷阱、Esc、Portal、角色归无头层。spring 只做进出视觉。焦点归还不能等动画结束才发生。

## 生产清单

- `animated` 减少的是 React 渲染，不是「几千个 Controller 免费」。长列表先虚拟化。本文不编造 FPS。
- 优先 transform / opacity。动画 width/height 会触发布局。
- 请求 abort、命令式 `api.stop()`、pointer capture、定时器都要对称释放。StrictMode 下 effect 会重复 setup/cleanup。
- 不要动画正在组合的 `<input>`，不要在 composition 期间重置 key。
- 动画不是授权，也不是 XSS 过滤器。
- 官方支持 SSR，但本示例只在浏览器里挂载。服务端不要用 `matchMedia` 渲染出和客户端不同的结构。
- 触摸设备上的 Pointer Capture 与 `touch-action` 必须真机看，鼠标通过不等于触摸通过。

## 升级

1. React 18 + v9 → React 19 + web 10.1.2：核对 `useTransition` 的 import、`SpringContext` 改名 `SpringContextProvider`、`onChange` 参数。只有应用整体在 React 19 上才升 v10。
2. CSS / Motion 列表改 spring：稳定 id、enter/leave、退场前迁移焦点。表单和 RSS 数据留在原数据层。
3. 两个请求反序返回时，epoch 必须丢掉旧结果。Lab 没有这条请求，练习时不要把 `setTimeout` 写成已测的网络取消。

## 验收

打开 basic：按钮切换强调，减少动画时卡片立刻到终值。business：添加不超过 12 条，重复 id 不加，移除后 status 数字立刻变，视觉行可以稍晚消失。advanced：焦点只在被删按钮持焦时移动；满员删除后焦点不落在 disabled 的添加按钮上。

`verification.json` 的 sdk、build、browser 为 NOT_RUN。`docs/library-lab/evidence/runs/` 没有匹配 receipt 时，不能把历史领域计数写成 SDK PASS。Actions run `41779873259` 是仓库级 install、typecheck、build、52 个 SDK 文件 / 153 项测试、45 个 Playwright，不是 B03 的 PASS。

```bash
node --experimental-strip-types --test packages/library-lab/entries/B03-react-spring/tests/article-policy.test.mts
```

断言唯一 id、第 13 条被拒绝且不改原数组、未持焦不抢焦点、满员持焦改去恢复按钮。不证明弹簧帧、离场 DOM 或读屏。

## 官方资料

- https://github.com/pmndrs/react-spring
- https://github.com/pmndrs/react-spring/releases/tag/v10.1.2
- https://www.npmjs.com/package/@react-spring/web
- https://www.react-spring.dev/docs/getting-started
- https://www.react-spring.dev/docs/components/use-spring
- https://www.react-spring.dev/docs/components/use-transition
- https://www.react-spring.dev/docs/concepts/imperative-api
- https://www.react-spring.dev/docs/concepts/animated-elements
- https://www.react-spring.dev/docs/advanced/config
- https://www.react-spring.dev/docs/utilities/use-reduced-motion
- https://www.react-spring.dev/docs/advanced/events
