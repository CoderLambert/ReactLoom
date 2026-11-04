# B21 从 react-motion 迁到 motion/react

这条是迁移教学，不是「再装一个旧弹簧库」。2015 年前后的 `react-motion` 用 `<Motion>`、`<TransitionMotion>`、`<StaggeredMotion>` 和 `spring(target, {stiffness, damping, precision})` 做物理插值，render prop 每帧拿到数字。它不是今天的 `motion` 包，也不是 `@react-spring/web`。四个名字必须分开。

旧包 `react-motion@0.5.2` 的 peer 停在 React 0.14 / 15 / 16。仓库可以还在，但长期没有面向 React 19 的发布。**新项目禁止用 `--legacy-peer-deps` 把它装进 React 19。** 本条目的 `library.json` 只声明 `motion@14.6.0`。示例不导入 `react-motion`。许可证：旧库 MIT，现代 `motion` 核心也是 MIT。Motion+ 的付费示例不是这个包。

宿主 React 19.3.0。入口：

```ts
import {AnimatePresence, motion, useReducedMotion} from 'motion/react';
```

## Lab 当前示例

`examples/demo.tsx` 再导出 `examples/example.tsx`。列表事务在 `examples/task-history.ts`。没有 `workshop/legacy/react-motion.jsx`、没有 Mock 服务器、没有 5000 行虚拟数据、没有 `npm run demo:basic`。

已挂载的现代写法：

- basic 起就有一张可折叠卡片：`AnimatePresence initial={false}` 包住条件 `motion.div`，`key="details"`。按钮 `aria-expanded` 指向同一 `id`。减少动画时 y 为 0，时长为 0；否则 `type: 'spring'`，`stiffness: 260`，`damping: 25`。
- business / advanced：`useReducer(reduceTasks)`。添加、删除、选择、撤销在同一个 reducer。id 为 `rss` / `model` / `notes` 或 `local-${nextId}`，`nextId` 只在成功添加时增加。上限 `MAX_TASKS = 24`。
- 列表 `AnimatePresence mode="popLayout" initial={false}`。`motion.li` 的 `key={item.id}`，`layout={!reduced}`。退出是透明度和轻微 scale，减少动画时 scale 保持 1。
- 删除时若按钮正持焦，`pendingFocus` 记下下一项、上一项或 `'add'`。`useLayoutEffect` 在提交后 focus。按钮 ref 放在 Map 里，卸载时删掉。
- advanced 的撤销恢复 `undo` 快照里的 items 和 selected，然后把 `undo` 清空。只能退一步。选择未知 id 不会改状态。
- status 报选中项、数量和减少动画是否启用。

未挂载：旧代码对照文件、`StaggeredMotion` 的「后项跟随前项当前值」、`useSpring` 链、HTTP generation、中文搜索框、5000 条只渲染 50 条。那些差异仍要讲清楚，但不能说页面上有旧运行时。

## 对照表

| 旧对象 | 旧行为 | 迁到 Lab 的做法 |
| --- | --- | --- |
| `spring(180, {stiffness, damping})` | 目标描述，不是 CSS | `animate={{y: 0}}` 加 `transition={{type:'spring', stiffness, damping}}`。数值可以当起点，轨迹不必相同 |
| `<Motion style={{x: spring(180)}}>` | render prop 每帧重渲染子树 | `motion.div` 的 `animate`。要订阅中间值再用 `useMotionValue`，本示例没有 |
| `TransitionMotion` 的 `key` / `willEnter` / `willLeave` | 退出靠样式函数 | 先改 reducer，再让 `exit` 播完。不要 `setTimeout(remove, 300)` |
| `StaggeredMotion` | 后一项的目标可以是前一项的瞬时值 | `staggerChildren` 只是时间错开。跟随链要另设计。Lab 没有这条 |
| `onRest` | 弹簧停下 | `onAnimationComplete` 只做 UI。添加和删除不在回调里 |

`precision` 不要宣称等于 Motion 的 `restDelta`。验收看任务能不能完成、打断时是否回到业务状态，而不是像素级重合。

`AnimatePresence` 的 `mode="wait"` 同时只能有一个直接子节点。折叠卡片是这种形状。列表用 `popLayout`，因为多项要一起进出。不要给列表套 `wait`。

## 三层渐进

### Demo ① 折叠（已挂载）

这是 `<Motion>` 的替代：布尔 `open` 是业务，`motion.div` 是视觉。`initial={false}` 避免第一次挂载就播入场。减少动画时卡片仍展开/收起，只是没有 y。

旧代码若写成 `animate={{x: spring(10)}}`，现代组件不会理解 `spring()` 的返回值。正确是数字目标加 transition。

### Demo ② 列表（已挂载）

添加在末尾，删除按 id。选中用 `aria-pressed`。归档（删除）和动画分开：reducer 立刻减少 `items.length`，exit 期间 DOM 可能还在。status 的数量以 reducer 为准。

未挂载的搜索：composition 期间只存 draft，结束再提交查询。Lab 没有输入框。不要在列表 key 里放入搜索词导致整表重挂。

### Demo ③ 撤销和焦点（已挂载）

撤销把上一份 items 换回来。删除持焦按钮后焦点到邻居或「添加任务」。未持焦的删除不抢焦点。满 24 条时添加禁用。

未挂载：大列表不要给 5000 个 `motion.li` 开 `layout`。先切片或虚拟化，再谈动画。Lab 的上限 24 是教学门禁，不是性能指标。

## 反例

```tsx
// 错：React 19 里强制安装旧包
// npm i react-motion@0.5.2 --legacy-peer-deps

// 对：阅读旧调用点，改用 motion/react。本目录不出现 react-motion 依赖
```

```tsx
// 错
<motion.div animate={{x: spring(10)}} />

// 对
<motion.div animate={{y: 0}} transition={{type: 'spring', stiffness: 260, damping: 25}} />
```

```tsx
// 错：willLeave 译成定时器后才改数据
setTimeout(() => dispatch({type: 'remove', id}), 300);

// 对：先 dispatch remove，AnimatePresence 播 exit
```

```tsx
// 错
{items.map((item, index) => <motion.li key={index} />)}

// 对：key={item.id}，reducer 不重排别人的 id
```

```tsx
// 错：把 staggerChildren 说成已经复刻 StaggeredMotion 的跟随
// 对：两者动力学不同。需要跟随时用 motion value 链，并在卸载时停止订阅
```

```tsx
// 错：render prop 里每帧 fetch
style => { save(style.x); return <div />; }

// 对：请求在事件或 effect 里，动画不写业务
```

```tsx
// 错：删掉正聚焦的按钮后不管焦点
// 对：Lab 的 pendingFocus + useLayoutEffect
```

```tsx
// 错：onAnimationComplete 里才认为删除成功
// 对：reducer 已经删除。动画可以被减少动画跳过
```

```tsx
// 错：列表 mode="wait"
<AnimatePresence mode="wait">{items.map(...)}</AnimatePresence>

// 对：多项用 popLayout。单张卡片才用默认的单个子节点
```

减少动画不能只在 CSS 里把 duration 设为 0，同时 JS 仍做 y 位移。Lab 用 `useReducedMotion()` 改目标。根上若再加 `MotionConfig reducedMotion="user"` 是生产加固；当前文件把决定写在目标值里。

## 组合

**Query + Motion + Sonner**：Query 拥有文章数组，Motion 做进出，Sonner 报失败。失败回滚由数据层恢复数组，动画跟着新目标。不要让 Motion 自己请求。

**dnd-kit + Motion**：拖放拥有拖动中的 transform，Motion 做进入和退出。不要两套库同时写同一节点的 transform。本示例没有拖放。

**Dialog**：焦点和 Portal 归无头组件。Motion 只包内容。exit 未完成时焦点不能留在即将卸载的节点上。

| 方案 | 适合 | 不适合 |
| --- | --- | --- |
| 留着 react-motion | 只读审计旧代码 | React 19 新功能 |
| motion/react | 声明式进出和 spring | 只有一条 CSS |
| react-spring | 命令式弹簧值 | 把旧 render prop 原样搬过去 |
| CSS | 简单过渡 | 列表卸载编排 |

## 生产清单

- 不安装 `react-motion`。
- 稳定 id，单调递增，撤销不重用逻辑错误的选中项（选中 id 若还在就保留）。
- 删除与动画解耦。
- 焦点在提交后移动。
- 减少动画仍能折叠、添加、删除、撤销。
- 不在动画回调里提交事务。
- 大列表先限制 DOM 再开 layout。
- SSR 首屏结构不依赖 `matchMedia` 分支出不同的子树。`useReducedMotion` 的首帧要避免水合警告；本示例在客户端 Lab 里运行。

## 升级练习

1. 从旧仓库列出每个 `TransitionMotion` 的 key 和 `willLeave`。用 reducer 实现增删。验收：id 稳定、焦点回到添加或邻居、减少动画下列表仍可用。
2. 用文字写出 `StaggeredMotion` 的跟随，再决定要不要做 motion value 链。不要把 `staggerChildren` 的录像说成物理一致。卸载后没有残留订阅。

## 验收

basic：折叠按钮的 `aria-expanded` 与卡片是否在 DOM 中一致；减少动画时没有 y。business：添加不超过 24；删除未知 id 无变化；数量立即更新。advanced：撤销一步；持焦删除后焦点在邻居或添加按钮；未持焦删除不移动焦点。依赖里没有 `react-motion`。

sdk、build、browser 为 NOT_RUN。没有匹配 receipt 就不能写成 Motion PASS，更不能写成旧库 PASS。Actions run `41779873259` 是仓库级 install、typecheck、build、52 个 SDK 文件 / 153 项测试、45 个 Playwright，不是 B21 的 PASS。

```bash
node --experimental-strip-types --test packages/library-lab/entries/B21-react-motion-migration/tests/task-history.test.mts
```

断言上限、单调 id、撤销、未知选择。不证明弹簧轨迹。

## 官方资料

- https://github.com/chenglou/react-motion
- https://github.com/chenglou/react-motion/blob/master/package.json
- https://github.com/chenglou/react-motion/blob/master/LICENSE
- https://motion.dev/docs/react-installation
- https://motion.dev/docs/react-animate-presence
- https://motion.dev/docs/react-transitions
- https://motion.dev/docs/react-use-spring
- https://www.npmjs.com/package/motion
- https://www.react-spring.dev/docs/components/use-spring
