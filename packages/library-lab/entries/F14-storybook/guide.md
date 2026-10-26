# Storybook 10 — 组件的可复现场景，而不是截图仓库

## 为什么用它

Storybook 把 React 组件及其特定输入配置为 CSF（Component Story Format）的具名故事。它帮助组件团队隔离状态、写交互测试、审查可访问性、生成文档；却不能替代真实应用路由、网络协议或后端 E2E。ReactLoom SPA 模板已有 Storybook 10.6.1 规范，Library Lab 使用同一版本基线，避免多套互不兼容工具。

## 安装与真实执行入口

平台应以 devDependencies 安装 **storybook、@storybook/react-vite、@storybook/addon-a11y，均 10.6.1**，并真实解析锁文件：

```bash
pnpm --filter @reactloom/library-lab add -D storybook@10.6.1 @storybook/react-vite@10.6.1 @storybook/addon-a11y@10.6.1
cd packages/library-lab
pnpm exec storybook dev -p 6029 --no-open --config-dir entries/F14-storybook/examples/.storybook
pnpm exec storybook build --config-dir entries/F14-storybook/examples/.storybook -o dist/storybook-f14
```

这不是会在主站 Tab 里执行的在线 CLI。实际入口 `examples/.storybook/main.ts` 负责 stories glob、addons、Vite React 框架；组件 `examples/components/StatusCard.tsx`；故事 `examples/stories/StatusCard.stories.tsx`。网页 Demo Tab 仅展示真实文件和可复现命令，PLATFORM 后续可集成静态预览链接，但不得模拟执行通过。

## 三层真实场景

**Basic**：`Basic` story 以 `Meta<typeof StatusCard>`、`StoryObj<typeof meta>` 声明 props，验证标题和默认按钮。Storybook 控件可以切换 title/tone；这比维护单独的 Storybook 截图更具交互价值。

**Business**：`Business.play` 使用 `canvas`、`userEvent` 点击按钮，检查状态文字与回调次数。点击后组件真实 `useState` 改变；测试使用 Storybook 10 的 `storybook/test` 库 `expect/fn`，没有假造点击结果。

**Advanced**：`Advanced` 通过 blocked 态禁用原生按钮，断言按钮不可点、回调没有发生，避免仅 CSS 呈现“灰色”。addon-a11y 可提示规则问题，但不能视为读屏/键盘完整验收。

## 工程最佳实践

1. 每条 Story 对应一项业务状态，避免将所有可能的 props 笛卡儿积堆到单页。状态演变优先使用 `play`，断言真实 DOM 输出。
2. 共享 MSW handlers 可供 Storybook 模拟业务后端，但 Mock 服务并不能证明线上 API 正确；接口契约和 E2E 应另测。
3. 未声明的组件 props 不应该让 Agent 自行猜测，改组件的 props 时同时更新 stories 和稳定的测试断言。
4. 控件里的事件函数应使用 `fn()`，而不是在 React组件外部难以跟踪的真实副作用；不访问用户邮箱、私有Token和付费Provider。
5. `@storybook/addon-a11y` 是自动规则提示，不等于产品无障碍合规；keyboard、IME、屏幕阅读器与触摸设备仍需独立回归。
6. 单独管理 Storybook 执行器，不把 Storybook、MCP 等开发工具静态引入生产 SPA 首页。静态Storybook也应按页面/组件动态加载。
7. `preview.ts` 中的全局 decorators/parameters 可能影响所有故事，保持最小，必要时按 story 层级覆盖。

## 常见问题与反例

- 只是写一个没有 `play` 的 Story，却声称用户交互验证完成。
- 只断言 className 变化，不断言真正的 disabled/focus/ARIA 行为。
- 在 production Vite bundling 中错误打包 Storybook 管理应用。
- 配置故事 glob 错误导致 0 stories，却把服务器启动成功当测试通过。
- 把浏览器中 Storybook 的 Mock 网络响应当成生产 API 已验收。
- 未锁定 addons 主版本，打包或 MCP 工具接口发生变化。

## 后续验收

运行 Storybook CLI 的三条 Story play 与构建，核对 story ID、交互断言和 addon 报告；另用真实浏览器验证 tabindex/移动视图。当前命令未经本环境执行，SDK NOT_RUN、构建 BLOCKED、浏览器 NOT_RUN。官方 [Play](https://storybook.js.org/docs/writing-stories/play-function)、[React Vite](https://storybook.js.org/docs/get-started/frameworks/react-vite)。
