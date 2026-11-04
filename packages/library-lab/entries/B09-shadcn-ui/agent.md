# B09 shadcn/ui — Agent 复用策略

**选型**：要在项目中拥有组件源码、配合Tailwind主题变量和成熟无障碍原语时使用。shadcn是registry+CLI+复制源码的工作流，不是“npm install shadcn-ui然后import Button”的普通SDK。2026已有Base UI/Radix两种组件方向，选其一建立主要组件标准。

**当前演示**：自写Radix Slot方案，依赖@radix-ui/react-slot@1.5.0、class-variance-authority@0.7.1、clsx2.1.1、tailwind-merge3.7.0。不是官方自动生成的逐字代码；不能代表官方全部变体/主题。真正可迁移文件：examples/ui/button.tsx和引用它的examples/example.tsx；后者带本地业务fixture，勿拷贝进生产。

**最佳接线**：先读取components.json和Tailwind v4现有变量；通过官方CLI查看实际注册表组件源，然后选择性合入；Button variants/size和cn在设计系统中统一维护。asChild时真实DOM可能是链接而非按钮，禁用要另外考虑aria-disabled、导航阻止与权限。原生按钮始终明确type，操作反馈符合ARIA，不能只凭颜色。

**反例**：把shadcn写成运行时SDK；混用Radix/Base UI上下文；升级registry不review diff；将任意服务端字符串直接拼Tailwind类；asChild禁用标志导致链接仍可导航；把局部busy状态代替服务端请求完成。

**测试**：真实CVA variant classes、Slot继承单子节点、键盘Tab/Space、禁用阻止、焦点环、tailwind-merge冲突、不同主题中的可读性；依赖未安装/未跑浏览器就保持NOT_RUN。

官方：https://ui.shadcn.com/docs/installation/vite ; https://ui.shadcn.com/docs/components/radix/button

**2026异步补充**：归档只快照未归档ID，busy期间禁用多选；每次取消、切级别或卸载使operationEpoch失效并清理timer。不能把本地延迟当成HTTP完成。
