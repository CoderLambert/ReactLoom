# B06 Ant Design

## 适用

中后台的表单、表格、反馈和 Token 用 `antd`。极轻 widget、自有原子设计系统、超大网格不要默认整库。Pro、Mobile、Charts、icons 不是本包的内建能力。

## 版本

`antd@6.6.7`，React 19.3.0。许可证 MIT。v6 要求 React ≥ 18 和 CSS 变量。不安装 `@ant-design/icons`。不要把 v4/v5 的 `inputProps` 或 v5 React 19 补丁写进新代码。

## 迁移

v5 先清弃用警告再上 v6。图标包若存在必须与主包同主版本，并删除 `@ant-design/v5-patch-for-react-19`。核对 `Form.List`、私有选择器和弹层 DOM。`antd@latest` 不是迁移计划。

## 不可删的清理

`ConfigProvider` 包住 `App`，反馈只用 `App.useApp()`。列表和撤销快照在同一次 `setState`（`feed-history.ts`）。搜索草稿和已提交 query 分开。409 用 `form.setFields` 回到 `url`。`rowKey="id"`。Modal 详情不拥有表单值。

## 反例

`Switch` 放进 `Form.Item` 却不设 `valuePropName="checked"`。只 toast 不回填字段。`initialValues` 当受控更新。`rowKey` 用 index。服务端分页再写本地 `sorter` 函数。静态 `message.success`。`onChange` 里 `trim`。依赖 `.ant-*` 私有结构。

## 测试断言

`tests/feed-history.test.mts` 断言重复 id/url 不追加、撤销恢复上一份且只退一步、开关值不变则返回原状态。不证明 antd 运行时、Portal 或 IME。

## 真实限制

已挂载：主题 Token、Form 规则、内存表、模拟 409、一步撤销、搜索提交时才过滤。未挂载：HTTP、revision、Drawer、断点、`token.motion`、服务端排序。本地 `sorter` 只对这份全量 fixture 成立。

## 证据

sdk、build、browser 为 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有匹配 receipt。Actions run `41779873259` 是仓库级检查，不是本条目 PASS。文档：https://ant.design/docs/react/getting-started
