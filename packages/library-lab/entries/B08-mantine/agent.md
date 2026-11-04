# B08 Mantine

## 适用

需要默认主题、表格和弹层、并能接受 Mantine 的 Provider 时使用 core 与 hooks。React 18 不要上 9。无样式系统、Ant Design 密度或 MUI X 网格另选。不要同时挂第二套带皮肤的库。

## 版本

`@mantine/core@9.7.3`，`@mantine/hooks@9.7.3`，React 19.3.0。许可证 MIT。不安装 `@mantine/form` 和 `@mantine/notifications`。样式用 `styles.layer.css`。Mantine 9 要求 React ≥ 19.2。

## 迁移

8 到 9 时 core 与 hooks 一起升，并核对样式入口。非受控 form 的 `form.values` 不是实时值；本示例没有 form 包，不要把教程里的 `useForm` 贴进 `example.tsx`。

## 不可删的清理

根上一个 Provider。`forceColorScheme="light"` 只为这条 Lab 演示，产品级暗色要单独设计。`NumberInput` 草稿保留 `number | string`。`validQuota` 拒绝空串和 `'-'`。debounce 只用于筛选。行 key 用 id。非法保存不写撤销快照。

## 反例

`Number(value) || 0`。`clampBehavior` 默认夹紧后假装用户确认了边界值。每个卡片一个 Provider。两个通知容器。表格 `key={index}`。用未安装的 form 包 API 描述当前示例。

复用时保留这些不变的约定：

- core 与 hooks 同为 9.7.3；React 18 不要使用本主版本。
- `NumberInput` 草稿保留字符串中间态。
- `validQuota` 拒绝空串、减号和非整数。
- 样式入口是 `styles.layer.css`；不安装 form 与 notifications。
- 非法保存不写 `before` 快照。

## 测试断言

`tests/feed-history.test.mts` 断言配额守卫、相同值不记历史、撤销恢复上一份行。不证明 Modal 焦点或 150ms 防抖的浏览器时序。

## 真实限制

已挂载：浅色主题、防抖筛选、开关、配额弹层和中间态。未挂载：useForm、通知、HTTP revision、脏检查关闭。遮罩关闭会丢掉未保存草稿，这是当前边界。

复用检查：

- 版本以该条目 `library.json` 为准，不跟研究稿里的 Vite 脚本或 workshop 目录。
- 未挂载的生产模式留在 `guide.md`，不补进 `examples/`。
- 不修改 `verification.json`。没有匹配 receipt 时 sdk、build、browser 保持 NOT_RUN。

## 证据

sdk、build、browser 为 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有匹配 receipt。Actions run `41779873259` 是仓库级检查，不是本条目 PASS。文档：https://mantine.dev/getting-started/
