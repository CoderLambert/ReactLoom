# B01 Motion for React：声明式动画与无障碍

## 什么时候使用

Motion（旧称 Framer Motion）提供 React 组件动画、AnimatePresence 退出流程、layout 过渡和手势能力。适用于 UI 状态转场、增删列表、布局变化。简单 hover 过渡首选 CSS，不应默认引入完整动画运行时。

## 安装与引入

    pnpm add motion@14.6.0
    import {motion, AnimatePresence, MotionConfig, useReducedMotion} from 'motion/react';

当前仓库 React 19.3.0，Motion 官方文档要求 React >=18.2。本例固定 14.6.0，API 需在依赖真实安装和浏览器实测后才能标记 PASS。examples/example.tsx 为同源可迁移源码，examples/demo.tsx 仅出口。

## 三层场景

**basic**：在同一个 React 条件渲染位置展示进场和离场，AnimatePresence 等待 exit 动画完成再卸载；初次渲染 initial=false 避免不必要的初次入场。

**business**：增删真实任务列表。Card 的 key 使用稳定业务 id；每项使用 motion.li，focus 在点击归档后回到添加按钮，避免删除聚焦节点后键盘位置丢失。

**advanced**：将第一项移至末尾，layout 过渡由 Motion 计算；快速重复操作仍受 React 状态控制，动画不写回数据；useReducedMotion 与 MotionConfig 尊重系统减少动画偏好。

## 工程最佳实践

- React state 是事实源，动画仅为视觉表达。不能通过 onAnimationComplete 才提交关键业务操作，以免关闭动画后状态不变。
- AnimatePresence 的直接子节点需要稳定 key，退出动画不要依赖会在 exit 前被销毁的数据。
- 列表重排依赖稳定 ID，不能用数组索引作 key；动态删除后主动管理焦点。
- MotionConfig reducedMotion=user 按系统设置调整动画，位移和缩放尤其需要替代方案。opacity 也可能需要缩短或取消。
- 不将 Motion transform 与 Embla/dnd-kit/图形引擎同时作用于同一 DOM 层，否则出现所有权竞争和抖动。
- 高频滚动性能要以浏览器真实 trace 为准；不要让几百张卡片每帧创建新布局动画。
- 不使用动画来隐藏错误、禁用状态和焦点，按钮应有真实 disabled/aria-pressed/文字反馈。
- 动画容器退出后确保监听、定时器、全局操作由拥有它们的组件按 effect cleanup 解除。

## 五组反例

1. key 使用 index，重排时旧 DOM 与新数据错配：改为稳定业务主键。
2. 显示开关在 AnimatePresence 外，把动画容器整个删除：调整为在 Presence 内条件渲染带 key 子节点。
3. 只处理进入没有 exit，内容突然消失：分别指定 initial/animate/exit。
4. 把退出动画结束当作保存业务事件的时机：状态与副作用应独立，动画可被关闭或中断。
5. 忽视 prefers-reduced-motion，强制大幅位移和持续循环：用 MotionConfig/useReducedMotion 为用户提供降级。

## 与其他库组合

B19 Embla：Motion 动画卡片内部内容，Embla 单独拥有容器的位移；不可双重 transform。B03 react-spring：物理弹簧连续交互可更自然，是否替换应比较复杂度与重绘机制。B21 react-motion 为历史方案，迁移应逐个检查 spring 参数与运行时依赖。

## 练习与验收

练习：将新闻收藏列表的插入、归档和排序迁移为真实服务状态；加入取消/回滚并验证动画不覆盖缓存。开启系统 Reduce Motion，确认没有明显空间位移。浏览器检查快速重复点击、页面卸载、焦点恢复以及 StrictMode。

源码不等于 SDK 验收；本轮 sdk/build/browser 均 NOT_RUN，由平台安装、typecheck、build、Chromium 后更新 evidence。官方：
- https://motion.dev/docs/react-installation
- https://motion.dev/docs/react-animate-presence
许可证 MIT。

## 第13轮加固：并发列表状态与焦点所有权

`card-policy.ts` 确保12项上限、稳定唯一ID、确定性删除和重排。candidate ID 只在点击事件产生，不在React可能重试的 updater中自增。原来的 `queueMicrotask(focus)` 在Concurrent React尚未完成DOM提交时可能抢焦点；现在仅当即将归档的按钮确实为 `document.activeElement` 时设置标记，`useLayoutEffect([cards])` 在列表提交后恢复焦点，鼠标在其它控件操作不会抢焦点。恢复列表时清除待转移标记。

`node --experimental-strip-types --test entries/B01-motion-for-react/tests/card-policy.test.mts` 验证容量与身份规则，不证明真实 AnimatePresence 退出、焦点行为或减少动画浏览器验收。
