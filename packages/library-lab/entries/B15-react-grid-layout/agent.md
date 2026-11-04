# B15 react-grid-layout

## 适用

离散格子上的拖动和缩放仪表盘用 v2 `GridLayout`。单列文章、自由画布、左右分栏不要用它。库不负责键盘拖放规范，所以要另有按钮。

## 版本

`react-grid-layout@2.3.0`，`react-resizable@4.0.2`，React 19.3.0。许可证 MIT。不要写 v1 的 `WidthProvider` 或 `data-grid`。研究笔记里的 2.2.4 不是本锁。不要使用有缺陷记录的 2.2.0。

## 迁移

v1 改为 `width`、`layout`、`gridConfig`、`dragConfig`、`resizeConfig`。保存时按断点分份，不要只存当前 `layout`。回调对象按只读处理。

## 不可删的清理

`useContainerWidth` 在 `mounted && width > 0` 之后才渲染。宽窄布局分开。`key` 用断点。相等几何不增加变更计数。手柄与按钮 class 分离。锁定项同时 `static` 并用上一份坐标盖回。键盘规则在 `layout-policy.ts`。不写 localStorage。

## 反例

`onLayoutChange` 里 PUT。用 0 宽度渲染。`i` 用数组下标。把像素存进 `x`。输入框放进拖动手柄。只保存当前断点覆盖另一份。直接修改回调里的 layout 对象。

复用时保留这些不变的约定：

- 包版本是 2.3.0，不是研究笔记里的 2.2.4。
- v2 必须传入测得的 `width`，不要用 WidthProvider。
- 宽窄两份布局分开存；`onLayoutChange` 不发请求。
- 手柄 class 与按钮 class 分离。
- 锁定同时写 `static` 并在纯函数里拒绝。

## 测试断言

`tests/layout-policy.test.mts` 断言列投影、窄布局独立堆叠、几何比较、锁定拒绝键盘移动和改宽。不证明 compactor 或指针。

## 真实限制

已挂载：12/6 列、手柄拖动、右下缩放、锁定、键盘、JSON 投影。未挂载：`Responsive` 五断点、HTTP 修订、图表 resize、持久化。

复用检查：

- 版本以该条目 `library.json` 为准，不跟研究稿里的 Vite 脚本或 workshop 目录。
- 未挂载的生产模式留在 `guide.md`，不补进 `examples/`。
- 不修改 `verification.json`。没有匹配 receipt 时 sdk、build、browser 保持 NOT_RUN。

## 证据

sdk、build、browser 为 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有匹配 receipt。Actions run `41779873259` 是仓库级检查，不是本条目 PASS。文档：https://github.com/react-grid-layout/react-grid-layout
