# B01 Motion for React

## 适用

进入、离开、列表 layout 和组件状态转场用 `motion/react`。单色 hover 用 CSS。多容器拖放、焦点陷阱、滚动叙事不要把 Motion 当成唯一方案。Motion+ 付费套件不在本条目范围。包名 `motion` 不是历史 `react-motion`，也不是旧 import `framer-motion`。

## 版本

Lab 固定 `motion@14.6.0`，宿主 React 19.3.0。入口只写 `motion/react`。许可证 MIT。官方文档要求 React >= 18.2。不要把 Motion+ 示例当成免费 API。

## 迁移

从 `framer-motion` 改入口前先对锁文件和迁移说明。B21 负责 `react-motion` 的 `Motion` / `spring()` / `TransitionMotion`，不能批量替换 import。`layoutId` 跨页面复用时补 `LayoutGroup`。

## 不可删的清理

`AnimatePresence` 留在条件外，直接子节点用稳定业务 id。`MotionConfig reducedMotion="user"` 与 `useReducedMotion()` 一起用，减少动画时去掉位移。归档焦点只在被删按钮当时持焦时，于 `useLayoutEffect` 提交后移动，不用 `queueMicrotask`。id 在点击事件里自增，不放进可能重放的 updater。容量和身份规则留在 `card-policy.ts`。

## 反例

条件渲染包住整个 `AnimatePresence`，exit 不会播。`key={index}` 在 `moveFirstToEnd` 后张冠李戴。`onAnimationComplete` 里才归档。`motion.div onClick` 冒充按钮。多行列表用 `mode="wait"`。滚动监听里每帧 `setState`。与 Embla 或 dnd-kit 同时改同一节点的 transform。

## 测试断言

`tests/card-policy.test.mts` 断言：追加不改原数组；重复 id 被拒绝；满 12 条不再增长；归档只删目标 id；`moveFirstToEnd` 把首项移到末尾且空列表安全。这些断言不覆盖真实 `motion` 导入、exit 时长或读屏。

## 真实限制

已挂载：提示卡片 presence、任务列表 layout、减少动画、持焦归档后的焦点恢复、第一项移到末尾。未挂载：Reorder、滚动 MotionValue、`layoutId` 筛选条、`popLayout`、搜索筛选。不要把未挂载模式写进示例冒充已实现。

## 证据

`verification.json` 的 sdk、build、browser 保持 NOT_RUN。`docs/library-lab/evidence/runs/` 没有匹配 receipt 时，不得把历史计数写成 SDK PASS。Actions run `41779873259` 是仓库级 install、typecheck、build、52 个 SDK 文件 / 153 项测试、45 个 Playwright，不是本条目 PASS。官方入口：https://motion.dev/docs/react-installation
