# react-spring 10.1.2：从 React 状态到弹簧动画

## 为什么需要这个库
在卡片展开、浮层过渡、数据列表新增/删除时，弹簧模型给出连贯的物理运动。与 B01 Motion 相比，它更强调 spring 值与组合；与 B02 GSAP 相比，不需要为简单状态过渡另建时间线。目标包是 `@react-spring/web`，不是安装整个跨端的 `react-spring` 聚合包。

## 安装与入口
```bash
pnpm add @react-spring/web@10.1.2
```
```tsx
import {animated,useSpring,useTransition} from '@react-spring/web';
const style=useSpring({opacity:visible?1:0,immediate:prefersReduced});
return <animated.div style={style}>状态动画</animated.div>;
```
`examples/example.tsx` 是唯一真实实现，`examples/demo.tsx` 只作惰性入口；不会通过 `setInterval` 伪造动画。

## 三层示例
基础：点击按钮修改 `expanded`，`useSpring` 平滑过渡卡片透明度和 translateY。业务：新增/删除文章，`useTransition` 按 stable id 处理进场与离场；React DOM 元素不会因为数据数组过滤就立即消失。进阶：监听 `prefers-reduced-motion`，用 `immediate` 跳到终态，同时测试删除后键盘焦点的稳定位置。

## 正确的资源所有权
React hook 创建的 spring controller 由组件生命周期管理；无论切换哪个 Tab 都必须卸载组件。系统偏好监听由演示局部 effect 订阅并清理，不随意修改 `Globals.assign({skipAnimation:true})` 等进程级全局配置，因为多个 Demo 可能互相影响。适当使用 `immediate` 保持行为可访问。

## useSpring / useTransition 的界限
`useSpring` 用于已存在元素的值变化；`useTransition` 用于进入或离开数组的节点。动态列表必须传稳定 key；从索引生成 key 会导致元素错位、状态错乱、离场串台。移除当前聚焦的按钮后必须将焦点转移至有意义的操作入口，不能仅靠动画保存焦点。

## 专属反例与修复
1. **全局跳过动画开关**：一个局部示例修改全局 Globals，会影响其他组件；此 Demo 使用 per-hook immediate。
2. **数组下标当 key**：排序后动画身份错配；改用业务 ID。
3. **只写淡出，不做退出管理**：删除数据后 DOM 立刻消失；用 useTransition 的 `leave`。
4. **reduce-motion 只读一次**：设置变化后仍运动；添加 media query change 监听与 cleanup。
5. **删除当前焦点**：会让键盘用户失去上下文；将焦点转给新增按钮并播报逻辑条数。

## 组合与生产验证
动画状态应尽可能来自领域状态（例如提交成功、列表变化），不要把动画是否结束作为保存业务数据的唯一依据。可用 D10 Zustand 储存列表顺序，但不要在全局 store 储存逐帧 spring 值。生产测试需要真实 `@react-spring/web` import、点击动态列表、prefers-reduced-motion 模拟、键盘焦点、快速切 Tab 资源清理。SDK/typecheck/build/Chromium 当前均 NOT_RUN。

## 官方依据
- [useSpring](https://www.react-spring.dev/docs/components/use-spring)
- [useTransition](https://www.react-spring.dev/docs/components/use-transition)
- [useReducedMotion 机制](https://www.react-spring.dev/docs/utilities/use-reduced-motion)

MIT 许可。


## 键盘焦点与列表资源补丁（2026-10-27）
初始`prefers-reduced-motion`读取matchMedia，避免先动画再停；列表限制12条并去重业务id，禁止无限量离场节点。删除按钮只有在自身确实持有document.activeElement时才恢复焦点到新增按钮，不得在其他元素持有焦点时抢走焦点。通过`article-policy.ts`独立检验身份、上限和焦点意图，真实spring/离场/焦点仍需浏览器回归。

**满额焦点回退**：12条满额时“添加”按钮disabled，不可向该节点调用focus；删除当前聚焦行时将焦点转到始终可用的“恢复默认数据”按钮。此处仅完成源码与规则测试，浏览器焦点需要验证。
