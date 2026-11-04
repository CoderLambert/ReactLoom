# C18 react-i18next — Agent 复用手册

## 快速选型

解决 React 组件如何订阅语言变化、如何将资源映射到声明式 UI。核心仍是 i18next，react-i18next 不是另一个翻译后端。尤其适合租户级语言偏好、可访问性提示、SSR hydration 与持续增长的产品文案。示例不加载第三方在线词条。

## 实际文件及部署前置

`library.json`（版本与依赖）→ `examples/example.tsx`（完整逻辑）→ `examples/demo.tsx`（Lab 导出）→ `verification.json`（分项证据）。前置依赖：react-i18next@17.0.16，i18next@26.4.3。默认不向外部 API 发起请求。

## 迁移指令

复制 examples/example.tsx 中 ScopedTranslation/LocalizedPanel 的模式；生产项目已有 i18n owner 时复用它，只有需要请求或租户隔离才 createInstance。保留 provider 的实例清理和异步状态；避免与全局 initReactI18next 的所有权冲突。

## 禁止的反模式

禁止将 Trans 当任意 HTML 注入器；禁止一边使用 Provider 一边修改未受控的 default singleton；禁止声称有 Suspense 的默认解决方案能处理全部异步加载；不得将服务器端渲染测试冒充浏览器 hydration。

## 必须保留的能力边界

useTranslation 读取 I18nextProvider 的 instance 与 namespace，监听 languageChanged 并触发 React 重新渲染。Trans 使用受控组件映射来处理强调标记，不能因为配置里出现 HTML 就允许任意标签或脚本。示例中 strong 映射为安全 React 元素。

## 最小测试断言

实际 React SSR 两个 Provider 的文本不同且无交叉，语言切换后各自 DOM 更新；每种语言的复数和 rich Trans 安全标签正确。

## 版本 / 证据

与当前模板配套 i18next 26.4.3 + react-i18next 17.0.16；保留现有 React 19 主版本，不修改 SPA 默认配置。 当前示例未获得实际 SDK、完整类型检查、构建或浏览器 PASS；迁移到目标项目需要按目标锁文件重新测试，不能声称历史 PASS 可继承。

## 选型关系

complements C17：i18next core 决定资源、fallback 和 t；react-i18next 负责 React 订阅、Provider 与 Trans。

## 官方出处

useTranslation 官方文档：https://react.i18next.com/latest/usetranslation-hook

I18nextProvider 官方文档：https://react.i18next.com/latest/i18nextprovider

Trans 受控富文本说明：https://react.i18next.com/latest/trans-component

官方源代码：https://github.com/i18next/react-i18next

## 最新语言意图和组件生命周期（第16轮）

同时迁移 `examples/example.tsx`、`examples/language-switch.mjs` 与声明文件；将队列与 provider 的实例 identity 绑定，unmount 先 dispose 后释放实例。不要只加请求序号：这无法阻止旧 `changeLanguage` Promise 本身更改词库当前语言。保留真实 react-i18next hook 与 Trans，不得声称纯策略 PASS 等于组件已完成浏览器验收。
