# B18 cmdk

## 适用

少量命令的键盘过滤和分组用 `cmdk`。它不鉴权、不虚拟滚动、不是搜索服务。危险动作必须在数据层再拒绝。React Native 与 Server Component 不在范围内。

## 版本

`cmdk@1.1.1`，React 19.3.0。许可证 MIT。`Command.List` 必填。`Command.Dialog` 才带门户。1.1.1 的输入法修复不能代替应用自己的快捷键判断。

## 迁移

1.0 的 value 大小写和 aria 属性变化要回归。不要把查询 state 写进 Item 的 value。远程结果使用 `shouldFilter={false}`，当前示例没有这条路径。

## 不可删的清理

advanced 的 document 监听必须卸载。`shouldTogglePalette` 在未打开时放过可编辑焦点，并拒绝组合键与 keyCode 229。Enter 抑制保持到组合提交后的 keyup。禁用删除在 UI 和 `select` 里各挡一次。切换 level 重置文章和打开状态。关闭对话框后焦点回到触发按钮。

## 反例

没有 List。全局 Ctrl+K 抢输入框。组字 Enter 执行命令。onSelect 直接删除。把面板当成唯一业务记录。一次渲染两千个 Item。不清理监听。

复用时保留这些不变的约定：

- `Command.List` 必填；查询 state 不是 Item value。
- Ctrl/Cmd+K 的监听在卸载时移除。
- 可编辑焦点且面板未打开时不抢快捷键。
- keyCode 229 与组合结束前的 Enter 不执行命令。
- 删除命令 disabled，处理函数再拒绝一次。

## 测试断言

`keyboard-policy.test.mts` 断言何时切换面板、何时吃掉 Enter。`command-state.test.mts` 断言稍后阅读切换、已读单向、引用和刷新计数。不证明对话框焦点或 IME 候选窗。

## 真实限制

已挂载：内联菜单、分组、关键词、禁用项、本地文章、Ctrl/Cmd+K 对话框。未挂载：远程过滤、Loading、虚拟列表、剪贴板、嵌套页面。

复用检查：

- 版本以该条目 `library.json` 为准，不跟研究稿里的 Vite 脚本或 workshop 目录。
- 未挂载的生产模式留在 `guide.md`，不补进 `examples/`。
- 不修改 `verification.json`。没有匹配 receipt 时 sdk、build、browser 保持 NOT_RUN。

## 证据

sdk、build、browser 为 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有匹配 receipt。Actions run `41779873259` 是仓库级检查，不是本条目 PASS。文档：https://github.com/dip/cmdk
