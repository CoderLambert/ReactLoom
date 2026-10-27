# B21 react-motion（历史迁移） — Agent 迁移卡

**典型任务**：从停滞的react-motion Motion/spring模式迁移至现代motion/react的状态驱动动画。当前参考依赖：motion@14.6.0。

**适用任务** 迁移旧react-motion代码，不将其包装成推荐的2026全新项目技术。现代目标包motion@14.6.0，MIT；旧包仅文档对照不进入Lab运行依赖。

**核心映射** `<Motion style={{x:spring(1)}}>{value => ...}</Motion>` → `<motion.div animate={{x:target}} transition={{type:'spring',...}}/>`；`TransitionMotion` → `AnimatePresence`（稳定id及exit）；旧spring常量与Motion stiffness/damping不能机械视为相同物理意义。

**生命周期** React中的AnimatePresence负责退出元素的存在期，业务状态由React持有；focus/aria-expanded要跟数据而不是帧过渡。减少动画使用useReducedMotion并实时响应。

**验证** 快速开合、连续删除/撤销、列表稳定ID、键盘焦点、关闭系统动画后的零位移；不要宣称旧SDK本身执行通过。

**可信边界**：`examples/example.tsx` 是真实示例源码，`examples/demo.tsx` 只负责重导出；`library.json` 是元数据，`verification.json` 的 NOT_RUN 不能自动升级为PASS。执行目标仓库的具体类型、构建、SDK、浏览器验证并记录证据后才能复用。

**迁移流程**：先读条目用途和版本→判断业务状态与React/UI元素所有权→提取最小代码→接入目标项目的依赖/许可证/样式→测试触摸、键盘、IME、快速重挂载和异常回滚→记录源码指纹。不要把演示输入或未经验证的安装版本视为生产承诺。

官方：[Motion React文档](https://motion.dev/docs/react-animation) / [AnimatePresence](https://motion.dev/docs/react-animate-presence) / [reduced motion](https://motion.dev/docs/react-use-reduced-motion) / [react-motion历史库](https://github.com/chenglou/react-motion)。


**状态事务和焦点（wave20）**：复制`examples/example.tsx`时也要复制`examples/task-history.ts`，由Reducer序列化删除/添加/撤销；禁止在`setUndo(items);setItems(...)`中抓取过期render闭包。删除持有焦点的按钮需在提交后显式转移焦点；reduced-motion应同时控制layout动画。核对`tests/task-history.test.mts`，SDK/TSX/Chromium继续NOT_RUN。
