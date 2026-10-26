# C17 i18next — Agent 复用手册

## 快速选型

负责资源加载、复数、插值、回退和语言决策，而不是机器翻译。适合客户端、Node、SSR 共享相同翻译词条的业务。React 的视图订阅应交给 react-i18next，单独调用核心 t 并不会自动让所有 React 组件刷新。本示例只使用本地数据，无翻译服务和网络依赖。

## 实际文件及部署前置

`library.json`（版本与依赖）→ `examples/example.tsx`（完整逻辑）→ `examples/demo.tsx`（Lab 导出）→ `verification.json`（分项证据）。前置依赖：i18next@26.4.3。默认不向外部 API 发起请求。

## 迁移指令

先查目标项目是否已有 i18next 实例和资源命名；不要再初始化第二个默认实例。模块化复用 resources 与 createInstance，服务端每请求单独生成实例，UI 借助 react-i18next 绑定。对用户输入只通过 t 插值输出文本，切换语言需等待 Promise 并加 generation/卸载保护。

## 禁止的反模式

禁止将翻译结果用 dangerouslySetInnerHTML 输出；禁止把同步 t() 输出缓存为永不刷新的模块级常量；禁止通过全局 changeLanguage 操作租户间共享模块；资源缺失或 sdk 未运行不可标 PASS。

## 必须保留的能力边界

初始化在读取 t 之前完成。服务端为不同请求单独创建实例并注入当前用户语言，避免共享 singleton 泄漏状态。资源应按语义分 namespace 并具备提取与审核工作流；长列表避免每一行重复加载语言包。切换语言时对 pending Promise 做版本保护，组件卸载 destroy 并忽略旧回调。

## 最小测试断言

Node SDK 实际断言：en 的1条/2条复数、中文回退英文、两实例语言隔离、未知键 defaultValue。生产接线补 browser 切换和 SSR 不串语言的断言。

## 版本 / 证据

采用现有 ReactLoom SPA 已固定的 i18next 26.4.3，不擅自升级模板；2026-10-25 官方发布过更新版，未来由平台统一做兼容核验。 当前示例未获得实际 SDK、完整类型检查、构建或浏览器 PASS；迁移到目标项目需要按目标锁文件重新测试，不能声称历史 PASS 可继承。

## 选型关系

complements C18：React 组件订阅语言变化应使用 react-i18next 的 Provider/hook；核心 i18next 可用于服务端与框架无关工具。

## 官方出处

i18next 官方 API：https://www.i18next.com/overview/api

配置选项与初始化：https://www.i18next.com/overview/configuration-options

官方项目：https://github.com/i18next/i18next
