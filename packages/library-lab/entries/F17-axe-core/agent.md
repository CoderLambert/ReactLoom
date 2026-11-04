# F17 axe-core — 工程手册

## 适用

对教学容器跑 `image-alt`、`label`、`button-name`，并对照修复前后。不是整页 WCAG，也不是读屏。

## 版本

`axe-core@4.14.0`，MPL-2.0。调用 `axe.run(container, { runOnly })`。不要 mock 这三则规则。

## 迁移

带走 `examples/example.tsx`、`examples/audit-queue.mjs` 和 `.d.mts`。上下文保持 ref 容器。换 level 的 `key` 留着。产品复制时用修复后的 DOM，不要复制故意的缺陷。

## 不可删的清理

`running` 在进入时置位，只有当前代号能在 finally 里清掉。generation 在卸载和切换修复时增加。队列跳过已失效的任务，失败不能卡住下一次。扫描中不许改 DOM。不要调用不存在的「取消 axe.run」。

## 反例

- `axe.run(document)`。
- 不设 `runOnly` 却说只检查了 alt。
- 违反数为 0 就标记合规。
- 重叠的 `axe.run`。
- 采用代号已变的结果。
- 只靠颜色显示 impact。
- mock `axe-core`。
- 把未修复的空按钮抄进产品。

## 测试断言

- 未修复的 basic 含 `image-alt`；business 含 `label`；advanced 能同时列出按钮名。
- 修复后这三条不再违反；incomplete 单独计数。
- 排队中的过期任务得到 `skipped`，后续扫描仍可运行。
- `audit-queue.test.mjs` 不 import axe-core。

## 真实限制

规则只有三条。不能物理取消进行中的 `axe.run`。队列只管本模块。placeholder 不是标签。透明 GIF 不是内容图片。没有键盘脚本。换 level 只丢弃结果，不中断已经开始的调用。

## 证据

浏览器收据要证明真实 `axe.run` 的违反与修复，并放在 `docs/library-lab/evidence/runs/`。队列单测不是 SDK。Actions 41779873259 不是 F17 PASS。

其它页面的 axe 日志不能抄到这三则规则。零违反只覆盖 `runOnly` 里的 id。
