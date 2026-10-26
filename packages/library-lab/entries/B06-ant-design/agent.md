# B06 Ant Design — Agent 选型与工程迁移

**目标**：采用成熟React UI设计系统组装企业表单、表格、反馈，不重新自造Button/Input/Table。版本antd@6.6.7 / MIT，真实依赖/TypeScript/浏览器未验证。

**如何迁移**：先读`examples/example.tsx`、`guide.md`与`verification.json`。在目标产品配置独立ConfigProvider主题，根部App容器供App.useApp()获取modal/message；保持Form值、Query远端状态和Table分页的所有者边界，避免重复。

**必须保留**：`rowKey='id'`；Form字段级setFields回填服务器错误；搜索表单避免中文IME期间错误提交；异步真实请求时AbortSignal/请求代次防过期写回；Modal关闭/focus和Portal可访问；撤销只针对当前业务状态，不重置全站。

**禁止照搬**：用本地假409当成真实HTTP测试；在应用根直接引入 Lab 主题；使用全局Message静态API忽视Context；全仓套antd/reset CSS；两个表单库双重控制同一Input。

**最低验证**：pnpm依赖与锁文件、typecheck、Vite build、真实Chromium。浏览器断言错误回填、列表稳定行、移动端滚动与键盘可访问，长列表另加服务端分页，不能靠当前本地fixture宣称生产规模通过。

**官方**：https://ant.design/components/overview/ 。