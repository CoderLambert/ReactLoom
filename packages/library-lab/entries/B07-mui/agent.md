# B07 MUI — Agent 实施说明

## 什么时候选

需要现成 Material Design 控件、一致主题、适配管理后台。此条目实验基线 `@mui/material@9.5.0`、Emotion 11.14。其他项目已选 shadcn/ui、Mantine 或 Headless 原语时不应为一个按钮额外引入整套 MUI。

## 迁移最小集合

`examples/example.tsx` 是实际演示实现；`examples/demo.tsx` 仅用于 Lab。复制时只提取业务数据模型与必要的表单/表格组件，统一在目标应用根部维护 ThemeProvider；包含 `@emotion/react` 和 `@emotion/styled`。不要将 Lab 本地成功模拟挪作真正的 HTTP 成功判定。

## 硬约束

- 稳定 rowKey（实例里直接使用 `row.id`）；真实按钮禁用而不是仅改颜色。
- Dialog 交给 MUI 管理 focus trap/Escape，关闭时检查触发器焦点恢复。
- React19/Emotion/Tailwind 插入顺序先运行生产构建；不可通过粗暴全局 CSS覆盖组件内部。
- 服务端校验（HTTP 409）应按 API 错误形状回填，不要把伪 HTTP fixture当成实测后端。
- 可访问标签、错误提示、表格语义、键盘与窄屏必须保留。

## 验收断言

Theme 生效且未作用于其他 UI；搜索过滤及 Switch 在单一状态模型下可回放；Dialog 通过 Enter/Tab/Escape 操作；模拟409后不新增记录且错误可见；撤销恢复历史状态；卸载后 Portal/Snackbar 不残留。用真实 @mui/material，业务数据可用假记录，SDK 不能 Mock 后记 PASS。

## 授权与文档

官方 https://mui.com/material-ui/ ，安装 https://mui.com/material-ui/getting-started/installation/ 。核心 MIT，不暗示 Pro Data Grid 可免费使用。当前真实SDK与浏览器验证 NOT_RUN。

## 第11轮迁移补充

需要一起复制 `examples/feed-history.ts`：`example.tsx` 已调用 `toggleFeed/addFeed/undoFeed` 处理原子更新。不要复活 `setBefore(rows)` 快照双状态；新的 local-ID 通过单调计数防撤销后碰撞。可独立运行 `node --experimental-strip-types --test tests/feed-history.test.mts` 检查纯规则，真实 MUI Portal/焦点/键盘和 React 构建仍需专测。
