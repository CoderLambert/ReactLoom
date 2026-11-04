# B20 Sonner

## 适用

短时成功、失败、进行中和有限撤销用 `sonner`。字段错误、必读风险、持久任务列表不要只放在 toast 里。关掉通知不是取消，也不是补偿事务。

## 版本

`sonner@2.0.8`，React 19.3.0。许可证 MIT。使用带 `id` 的单个 `Toaster`。不是 React Native 包。本示例不调用 `toast.promise`。

## 迁移

从自绘通知迁入时保留可见的业务 status。多个 Toaster 必须有稳定 `toasterId`。更新进度用同一 toast id，不要每次新建。

## 不可删的清理

登记本 demo 创建的 id。卸载、换 level、取消时只 `toast.dismiss(id)`。禁止无参数 `dismiss()`。定时器进集合并 clear。两个 `LatestRunGuard` 在清理时 `invalidate`。撤销回调检查 token。loading 使用 `duration: Infinity` 且一定有成功、失败或取消。

## 反例

`toast.dismiss()` 清掉整页。旧撤销按钮作用于新保存。重试堆叠新的 loading。超时回调不看代际。只在 toast 里放失败原因。把 `getActiveToasts()` 当数据库。把关闭 toast 当成 abort 已经回滚服务器。

复用时保留这些不变的约定：

- 只 dismiss 登记过的 id，禁止无参数 `toast.dismiss()`。
- loading 使用 `duration: Infinity`，结束时复用同一 id。
- 撤销检查 `LatestRunGuard` token，只作用于最新一次保存。
- 可见 `role="status"` 保留业务结果。
- 不使用 `toast.promise`，不把通知当成服务器补偿。

## 测试断言

`latest-run.test.mts` 与 `undo-ownership.test.mts` 断言代际和撤销所有权。不渲染 Sonner，不证明 aria-live 或滑动关闭。

## 真实限制

已挂载：一个右下角 Toaster、成功提示、最新保存可撤销、同一 id 从 loading 更新为成功或失败。未挂载：`toast.promise`、第二个容器、HTTP、服务端补偿。

复用检查：

- 版本以该条目 `library.json` 为准，不跟研究稿里的 Vite 脚本或 workshop 目录。
- 未挂载的生产模式留在 `guide.md`，不补进 `examples/`。
- 不修改 `verification.json`。没有匹配 receipt 时 sdk、build、browser 保持 NOT_RUN。

## 证据

sdk、build、browser 为 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有匹配 receipt。Actions run `41779873259` 是仓库级检查，不是本条目 PASS。文档：https://sonner.emilkowal.ski/
