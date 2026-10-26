# B21 react-motion（历史迁移） — 实战指南

> 此条目按当前官方API重新实现。三层场景是真实源码中的可选模式，不代表三个独立构建；SDK/browser/build 尚待实际执行验证。

## 历史库定位
`react-motion` 是历史弹簧动画解决方案，原API包括 `Motion`/`spring`/`TransitionMotion`。在React19新项目不建议为了回顾历史而强制安装旧运行时。本页面的运行实现使用现代 `motion/react`，明确标记**迁移演示**而非旧SDK现场回放。对现有旧代码需要先整理可观察业务行为，再替换动画实现。

## 安装与真实迁移
```bash
pnpm add motion@14.6.0
```
```tsx
import {motion,AnimatePresence,useReducedMotion} from 'motion/react';
<motion.div animate={{opacity:open?1:0}} transition={{type:'spring',stiffness:260,damping:25}} />
```
其中 transition spring参数与react-motion原物理常数**并非等价映射**，不能机械复制数字。若要保留旧运动曲线，需要在真实设备录屏/比对效果。

## 三层展示与源码
basic将Motion children(render function)的数值插值改为声明式 motion.div animate/exit；business将TransitionMotion的enter/leave改为AnimatePresence，stable id与业务删除操作分离；advanced加入useReducedMotion、撤销和快速删除/恢复的竞态防护。源码统一在 `examples/example.tsx`；旧示例只在本文作为概念说明，不安装两个动画运行时造成包污染。

## 生产风险/最佳实践
1. 错误：把React状态当成每帧插值数值；迁移为语义状态目标，由动画库自己驱动帧。2. 错误：index为key；删除/排序后退出动画串台，改用业务ID。3. 错误：离场动画仅靠CSS opacity，元素直接卸载；由AnimatePresence挂载包装。4. 错误：没有prefers-reduced-motion；用户晕动症偏好失效，使用Motion的动态Hook。5. 错误：把动画完成当持久化成功；数据提交/撤销必须独立验证。

## 练习
选旧项目一个弹性面板：写开合与焦点E2E断言后迁移；复杂列表示例需要对比删行期间与恢复期间的稳定DOM身份。对比B03 react-spring与B01 Motion选型，不以历史星数决定升级路线。

## 官方来源及授权
- [Motion React文档](https://motion.dev/docs/react-animation)
- [AnimatePresence](https://motion.dev/docs/react-animate-presence)
- [reduced motion](https://motion.dev/docs/react-use-reduced-motion)
- [react-motion历史库](https://github.com/chenglou/react-motion)

许可：MIT（请依目标版本复核）；本示例代码和输入数据原创。不调用付费API。
