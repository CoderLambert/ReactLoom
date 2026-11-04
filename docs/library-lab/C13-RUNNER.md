# C13 专用浏览器运行器

## 范围与设计决定

C13 的三个场景在 `http://127.0.0.1:4321`（或对应的 `localhost:4321`）新文档中运行规范 React 示例。主站为对应的 4319 origin；F11 的 4320 运行器保持独立。本设计选择完整示例进入 iframe，保留同一份键盘表格、领域校验和源码。另一可行方案是仅隔离图表、表格留在主站，但需要额外的任务/视图传输协议和过期更新处理。

这只注册 C13、`browser-frame`、`examples/demo.tsx` 与 basic/business/advanced；不接受代码、模块 URL、其他条目或额外权限。上游 1.2.2 的 document mouseup 闭包没有公开释放 API；删除 SVG 或 React unmount 不能证明释放。

## 协议与销毁

每次启动和重置使用新的 UUID 路径 `/lab-runners/gantt/sessions/<uuid>/`。双方检查固定 origin、对应 Window、协议、session 和有限消息结构。父页面只发送 start 和三种 level；子页面只报告 ready/running/有界 error。只有显式启动才创建 iframe，只有握手后的 start 才挂载示例。沙箱只允许 scripts/same-origin；不允许表单导航、弹窗、下载或顶层导航。

停止、重置、切换场景/Tab 和卸载同步使会话失效、清除自己的定时器/消息监听并移除自己的 iframe。**完整文档 realm 销毁才是 Gantt 资源的释放边界。** 不发清理 ACK，也不把 unmount 标为上游监听器已释放。迟到消息不会改变新会话。官方样式由运行器构建配置定位已固定发布包的 CSS，开发只放行所需源码/依赖资产；不复制上游实现。一个活文档只构造一个 Gantt；任务和视图变化使用发布包中的 refresh/change_view_mode，并复制任务后交给 SDK。

## 实施步骤

1. 用协议/真实 HTTP 回归先固定 origin、消息、URL、Host 和销毁边界，再实现专用会话和 middleware。
2. 接入固定 runner、单实例规范示例、现有显式启动/重置/停止操作，以及 dev/build/preview 第三个服务。
3. 通过真实 Chromium 检查三个场景、业务编辑、日期/409 拒绝、文档监听数量和旧 frame/context 销毁；延迟真实 SDK chunk 验证卸载不等待 import。
4. 运行定向检查，再由集成 CI 执行冻结安装、完整类型/三个构建、SDK/Vitest/浏览器回归。未生成匹配收据前不提升 verification.json 的 PASS。

## 运行与验收

`pnpm --filter @reactloom/library-lab dev` 启动主站、F11 与 C13；`build` 生成三个产物；`preview` 同时供应三个服务。仅监听 loopback。生产和开发使用同一固定 session 路由；HTML/SVG 源码仍通过 raw 文本传输。

浏览器验收必须观察真实 Gantt：父文档 mouseup 监听数保持基线，重复任务/视图修改后子文档保持一个 mouseup 监听；停止后旧 frame detach、旧执行上下文销毁。覆盖重新启动/重置、场景切换不继承启动授权、离开 Tab、延迟真实 chunk 后停止以及双页面相互独立。运行器没有 Worker；不能用 Worker 指标或 SVG 消失代替文档销毁证据。
