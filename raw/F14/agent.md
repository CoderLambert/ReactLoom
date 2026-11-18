# F14 Storybook工程复用

固定storybook/react-vite/addon-a11y10.6.1 MIT，组件开发隔离，不是产品6006/6007，也不是Lab在线Shell。

迁入4原件：StatusCard.tsx、StatusCard.stories.tsx、main.ts、preview.ts；目录保持components/stories/.storybook。React19/TypeScript/Vite及三包。staticDirs空；autodocs标签不保证Docs页（未装addon-docs）。guide给独立dev/build/静态server命令；Lab复制的现有dev配方为6029，本次build静态验收为6037，两用途可兼容，不占4319/20/21。

三个任务：Basic状态合同、Business归档play、Advanced禁用+Recovery拒绝后重试。回调为fn fixture，不是HTTP。inFlight同步先置、generation屏蔽旧结果/错误/finally；title/tone变化与unmount失效。没有实际取消Promise；held回调+args/unmount未运行验收，只静态审计。Recovery mockReset保留。

真实build exit0；静态站Chromium同iframe切Basic/Business/Advanced/Recovery/Business，storyFinished成功且addon实际axe4.14报告均0violations/0incomplete。addon10.6.1普通story afterEach也扫描；test:error仅报告，普通build不替浏览器抛失败。validation/browser-check.mjs必须显式assert report，不能只检测iframe加载。没有运行addon-vitest或test-runner。

完整raw和来源local-validation；固定包code/core README与MIT LICENSE原文、三个package字段；homepage200未知嵌入。正式verification无receipt仍NOT_RUN，不推广为整站WCAG/真实服务/视觉基线。
