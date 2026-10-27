# B18 cmdk — Agent 复用决策

目标：在 React 仪表盘中复用可访问命令选择/搜索。它不负责授权、复杂模糊排序、全局热键冲突仲裁或执行后端 API。

## 最小迁移

读取 library.json、examples/example.tsx、guide.md 和 verification.json。安装 cmdk 1.1.1；将 actions 换成经过权限过滤的业务动作；将 select(action) 接入具体应用服务，但保留每项的稳定 value、key、disabled 和状态反馈。examples/demo.tsx 只导出示例，不是业务逻辑。

## 强制保留

- v1 Command.List 包裹 Command.Item/Group。
- 热键 effect cleanup；跳过 input/textarea/contentEditable 的快捷键抢占。
- IME 合成期间不允许 Enter 提交命令。
- 关闭后焦点应回到触发器，Escape 关闭，必须有按钮替代快捷键。
- 业务权限服务端验证而非仅 UI disabled。
- 大规模自定义搜索需要 shouldFilter=false，避免 cmdk 默认再次筛选。

## 反模式

document 永久绑定 Ctrl+K、不同命令使用相同 value、模糊搜索结果改变实际 Action ID、危险操作只靠 aria-disabled、命令实现中调用未授权后台接口。

## 测试清单

实际 SDK import + TS build + Chromium 键盘/IME（中文组词）、Tab 焦点、Escape、disabled 与卸载监听计数。React StrictMode 重挂载后 Ctrl+K 只触发一次。当前 SDK/build/browser NOT_RUN，不得冒充通过。

官方参考 https://github.com/pacocoursey/cmdk

## 必须迁移的键盘守卫

`examples/example.tsx` 依赖 `examples/keyboard-policy.ts`；快捷键只在本 Demo 生命周期中注册。关闭面板时不拦截其他编辑器 Ctrl/Cmd+K；打开后允许同快捷键关闭。IME candidate 的 compositionend → keydown Enter → keyup Enter 期间，必须抑制“确认候选”被 cmdk 误识别为提交命令。Node纯函数测试不能替代真实操作系统中文输入法E2E。
