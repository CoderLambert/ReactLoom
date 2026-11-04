# F14 Storybook — 工程手册

## 适用

隔离的状态卡、CSF3 args 和 play。不是产品站 6006/6007，也不是端到端。

## 版本

`storybook@10.6.1`、`@storybook/react-vite@10.6.1`、`@storybook/addon-a11y@10.6.1`，MIT。play 从 `storybook/test` 引入 `expect` 和 `fn`。

## 迁移

带走 `StatusCard.tsx`、stories、`main.ts`、`preview.ts`。命令使用端口 6029 和本目录 config。不要把故事挂进 Lab 主站冒充已启动。`staticDirs` 保持空。

## 不可删的清理

`inFlight` 在 await 之前置位。generation 在卸载以及 title/tone 变化时增加。过期的成功或失败不能写状态。Recovery 的 `mockReset` 留在 play 里。离开 dev server 时停掉 6029，不要留着占端口。

## 反例

- play 不 await。
- 用含糊的 `getByText('归档')`。
- catch 里设成已归档。
- 模块级 fn 不复位。
- 把 `a11y.test: 'error'` 写成已经扫描。
- 在网页里画假终端或假 iframe。
- staticDirs 指向用户文件或密钥。
- 用 dev 启动代替 build 或 play 收据。

## 测试断言

- Basic：待处理、按钮可用、回调 0 次。
- Business：任务成功 → 点击后已归档、按钮禁用、回调 1 次。
- Advanced：等待审核、按钮禁用、回调 0 次。
- Recovery：第一次失败且可再点，第二次成功，回调 2 次。

## 真实限制

Lab 页面不渲染组件。没有视觉基线，没有 MSW。a11y 参数没有执行器记录。四个故事里只有三个对应 demo id，Recovery 仍在同一文件。页面命令不会监听 6029。

## 证据

`storybook dev`、play 和 build 分别要收据，放在 `docs/library-lab/evidence/runs/`。Actions 41779873259 不是 F14 PASS。在那之前 sdk、build、browser 都是 NOT_RUN。

端口能打开也不等于四则 play 已执行。a11y 参数要另有一次规则运行才算扫过。
