# B01 Motion for React — Agent 生产复用指南

## 选型规则

进入/退出、列表布局和组件状态转场使用 Motion；简单颜色/悬停动画使用 CSS。历史 framer-motion 和当前 motion 的包与 import 地址必须按目标项目版本核对。基线 motion@14.6.0（React 18.2+）。

## 最小复用

读取 library.json、examples/example.tsx、guide.md、verification.json。将 useState 模拟数据替换为目标业务 state，保留 AnimatePresence、稳定 key、MotionConfig 和 reduced-motion 降级。examples/demo.tsx 仅适配显示，不是新业务入口。

## 关键设计和边界

1. state 由 React 维护，不能靠 animation complete 才保存业务。
2. 退出项直接在 AnimatePresence 下携带稳定 key。
3. 重新排序用真实 ID；动画与业务生命周期分离。
4. 删除含 focus 的项要将焦点转移至仍存在的操作控件。
5. prefers-reduced-motion 下关闭位移和缩短动画，不能关闭功能。
6. 不能和 Embla/dnd-kit 同时管理同一 DOM 的 transform。

## 必测

实际 motion/react import、类型和 Vite 构建；Chrome 中 enter/exit、快速重复点击、稳定键重排、StrictMode、读屏语义、系统 reduced-motion、卸载无资源残留。当前全 NOT_RUN，切勿以静态代码声称通过。

官方 https://motion.dev/docs/react-installation

## 第13轮业务状态与焦点安全

保留 `card-policy.ts` 的最大容量与稳定ID；不能在React updater中使用自增ref造成StrictMode身份不稳定。焦点只在被删除DOM自身占焦点时，于commit后的layout effect移动，不用 `queueMicrotask` 盲目抢焦点。需在真实浏览器验证 pointer/keyboard、连续删除、恢复和exit动画；policy套件不代表Motion SDK PASS。
