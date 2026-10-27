# D06 Immer — Agent 复用手册

## 快速选型

Immer 让程序在函数体里写可变语法，却产出全新的不可变状态。适合树形/深层数据、React reducer、表单编辑草稿和乐观 UI，但不负责网络请求、持久化和跨租户授权。默认自动冻结生成对象，Patch 功能需显式 enablePatches。

## 实际文件及部署前置

`library.json`（版本与依赖）→ `examples/example.tsx`（完整逻辑）→ `examples/demo.tsx`（Lab 导出）→ `verification.json`（分项证据）。前置依赖：immer@11.2.9。默认不向外部 API 发起请求。

## 迁移指令

把具体 reducer 抽成不依赖 React 的 produce 函数；示例可迁移文件 examples/example.tsx。仅在需要 patches 时调用 enablePatches，不要改变项目已有 Immer 全局配置。保留不可变结果和版本化回滚策略。

## 禁止的反模式

不得泄漏 draft 到异步操作；不得把 Patch 当经过授权的外部命令；不得回滚过期 inverse 到已经变化的最新缓存；不得直接修改 React state 或使用数组索引当稳定业务 ID。

## 必须保留的能力边界

必须先 enablePatches()；produceWithPatches 返回 [next, patches, inversePatches]。applyPatches 不验证请求是否已经过期。JSON Patch 差异并不总是最短的事务变更集，也不能自动充当跨端权限验证。需要回滚时保存请求原始快照、匹配的 revision 或任务 ID。

## 最小测试断言

真实 produce 更新后原对象值保持不变、未修改分支引用稳定；enablePatches + produceWithPatches + applyPatches 回到原数据；进阶 UI 在冲突写入锁定期间不会让操作交错。

## 版本 / 证据

采用 2026-10-22 官方发布的 11.2.9；主要 API 已由官方 Patches 文档确认，目标运行平台仍需进行实际解析。 当前示例未获得实际 SDK、完整类型检查、构建或浏览器 PASS；迁移到目标项目需要按目标锁文件重新测试，不能声称历史 PASS 可继承。

## 选型关系

complements D12：Redux Toolkit 使用 Immer 处理 reducer 的草稿变更，但应用仍需把异步副作用与缓存更新所有权区分开。

complements D07：在 TanStack Query 的乐观更新中可使用 produce 生成不可变缓存状态；回滚必须检查竞态。

## 官方出处

Immer 官方文档：https://immerjs.github.io/immer/

Patches API：https://immerjs.github.io/immer/patches/

官方 v11.2.9 发行：https://github.com/immerjs/immer/releases/tag/v11.2.9

## React updater 竞态修复
对延迟执行的 `setFeed(current => ...)`，不能在 updater 内重新读取稍后会被清空的 `undo.current`。先同步 `const inverse = takeUndo(undo)`，再闭包捕获 `inverse`。迁移时带上 `examples/patch-ownership.mjs`、类型声明和两级测试；纯 Node 策略通过仍不等于真实 Immer/React 浏览器通过。
