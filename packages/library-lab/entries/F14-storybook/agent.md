# F14 Storybook — AI Agent 代码复用与测试规范

**推荐场景**：组件 Design System、状态样例、交互回归、开发文档。不要把它当成整个产品的 E2E；F13 Playwright 负责真实业务路由，F12 Vitest 负责细粒度状态/逻辑，F17 axe-core 负责选定无障碍规则。

**当前基线**：storybook、@storybook/react-vite、@storybook/addon-a11y 均 10.6.1；与已有 ReactLoom SPA 模板维持主版本一致，不额外安装另一套无校验大版本。MIT 主体，核对每个 addon 的依赖/许可。

**最小复制文件**：`examples/components/StatusCard.tsx`、`examples/stories/StatusCard.stories.tsx`、`examples/.storybook/main.ts` 和 `preview.ts`。Storybook 用开发态 CLI 运行，不要导入主站生产入口。CSF 3 `Meta/StoryObj` 和 `play({canvas,userEvent,args})` 保留可重放交互，只有真实CLI测试后才标PASS。

**硬性规则**：变更组件 props 时同步 Story args/play；事件回调用 `fn()`；不只靠 Snapshot/颜色证明禁用；mocks与生产Provider分开；避免把私有fixture嵌入公开文档。a11y addon不是手工读屏合规声明。

**真实命令**：`pnpm --filter @reactloom/library-lab exec storybook dev -p 6029 --no-open --config-dir entries/F14-storybook/examples/.storybook`；build 同配置路径输出至dist/storybook-f14。执行环境必须安装所有dev依赖，不能用截图代替。

**必要断言**：Basic 标题/按钮、Business 按钮点击后状态和回调次数、Advanced disabled和回调0次；检查故事确实被发现与注册、产物中不携带应用密钥。当前 NOT_RUN/BLOCKED 见 verification.json。

## 异步mutation迁移警戒（wave17）

复制 `StatusCard.tsx` 时不要把 `setState(done)` 放在 Promise resolve 前，也不要把用户数据异常的详细堆栈直接渲染。状态需要区分 saving/error/retry；异步回调触发旧Story卸载时利用generation阻止过期setState。Storybook `Recovery` 负例通过一次拒绝和第二次成功验证；每条Story应有独立 `fn()` 以避免跨Story调用计数污染。

`storybook build` 不运行play；必须另外接入Storybook官方Vitest addon或test-runner才有CLI交互证据。a11y.test=error仅表示实际执行时违反规则应当失败，而非源码提交后就证明无障碍通过。
