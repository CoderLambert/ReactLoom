# B07 Material UI

## 适用

接受 Material 语义的表单、表格和对话框用 `@mui/material`。无样式原语、另一套完整皮肤、或 MUI X 的商业网格不要算进 Core。本条目不安装图标包和 X。

## 版本

`@mui/material@9.5.0`，`@emotion/react@11.14.0`，`@emotion/styled@11.14.1`，React 19.3.0。Core 为 MIT。不用 v10 alpha。TextField 用 `slotProps`，不用已删除的 `inputProps`。

## 迁移

v5 教程的 InputProps、JSS 和 DataGrid 导入不能直接贴。X 的 Pro 许可与 Core MIT 分开。浏览器目标以 v9 文档为准，不要用 React peer 推断旧 Safari 仍支持。

## 不可删的清理

`createTheme` 放在模块作用域，避免每次渲染新建。列表权威是 `feed-history`。Dialog 草稿和错误留在框内，成功后才关闭。Snackbar 关闭不撤销数据。行 `key` 用订阅 id。Switch 的无障碍名字写在 `slotProps.input`。

## 反例

`inputProps`。`key={index}`。只在 Snackbar 报校验错误。客户端 URL 通过后就 `fetch` 用户地址。渲染期 `createTheme`。Dialog 没有 `aria-labelledby`。把 `DataGridPro` 当成已授权依赖。

复用时保留这些不变的约定：

- TextField 用 `slotProps`，不用已删除的 `inputProps`。
- `createTheme` 放在模块作用域。
- 行 key 用订阅 id；错误留在 Dialog 的 Alert 里。
- Snackbar 关闭不调用撤销。
- 不安装 MUI X，不把 Core 的 MIT 延伸到 Pro 网格。

## 测试断言

`tests/feed-history.test.mts` 断言启用切换记快照、重复 endpoint 不追加、撤销恢复 `before`。不证明 Theme、Portal 或焦点回到触发按钮。

## 真实限制

已挂载：固定浅色主题、过滤表、一步撤销、HTTPS 校验、模拟 409。未挂载：暗色、服务端分页、Autocomplete IME、AbortController、revision。过滤是同步内存运算。

复用检查：

- 版本以该条目 `library.json` 为准，不跟研究稿里的 Vite 脚本或 workshop 目录。
- 未挂载的生产模式留在 `guide.md`，不补进 `examples/`。
- 不修改 `verification.json`。没有匹配 receipt 时 sdk、build、browser 保持 NOT_RUN。

## 证据

sdk、build、browser 为 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有匹配 receipt。Actions run `41779873259` 是仓库级检查，不是本条目 PASS。文档：https://mui.com/material-ui/getting-started/
