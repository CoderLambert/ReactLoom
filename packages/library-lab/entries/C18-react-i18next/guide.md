# react-i18next — ReactLoom 工程实战

## 定位与适用范围

解决 React 组件如何订阅语言变化、如何将资源映射到声明式 UI。核心仍是 i18next，react-i18next 不是另一个翻译后端。尤其适合租户级语言偏好、可访问性提示、SSR hydration 与持续增长的产品文案。示例不加载第三方在线词条。

## 安装及版本约束

~~~bash
pnpm add react-i18next@17.0.16 i18next@26.4.3
~~~

与当前模板配套 i18next 26.4.3 + react-i18next 17.0.16；保留现有 React 19 主版本，不修改 SPA 默认配置。

## 真实代码路径

实际入口为 examples/demo.tsx，完整可迁移实现为 examples/example.tsx。Library Lab 展示的代码由这两份源文件生成并计算 SHA-256；三个 Demo 场景共享真实实现，使用 level 切换学习层次。不得为文档另外维护一份看起来相同但不可运行的伪代码。

## 运行边界

useTranslation 读取 I18nextProvider 的 instance 与 namespace，监听 languageChanged 并触发 React 重新渲染。Trans 使用受控组件映射来处理强调标记，不能因为配置里出现 HTML 就允许任意标签或脚本。示例中 strong 映射为安全 React 元素。

## 三层实战

基础：useTranslation('common') 类型式键名与语言切换。业务：common/feed 两组词条、数量复数与 React Trans 强调文本。进阶：同一个 React 组件套在两个独立 I18nextProvider，工作区 A 切为英语时 B 保持原语言；展示同组件复用而不泄漏单例。

## 生产建议

SPA 通常一个由应用 owner 初始化的实例即可；多工作区和 SSR 才显式隔离 provider。远程 namespace 应统一 Suspense/ready 状态；示例采用内存资源并设置 useSuspense:false，不能照搬到异步缺资源场景。SSR 要确保服务端与客户端首屏语言、资源快照一致，并禁止共享请求可变状态。

## 常见反例

反例一：把 useTranslation 的 t 当作永不变化的全局函数，语言切换视图不刷新；应放在绑定组件内使用。反例二：每个翻译组件都 i18n.use(initReactI18next).init，生命周期混乱；应初始化一次并通过 provider 提供。反例三：把未经审核的资源字符串直接用 innerHTML 插入；应使用纯文本与受控 Trans。反例四：以为渲染一次 SSR 就证明 hydration 无误；还必须实测客户端语言、异步资源加载与焦点稳定性。

## 组合与代价

和 C17 i18next core 组合；与 TanStack Router 可将语言切换反映在路由或设置状态，但不要让 UI 组件自己维护两套真相。国际化字典超过一定规模时按 namespace 延迟加载，而不是首页拉所有区域语言资源。

## 测试要求

Node SSR 可通过真实 react-dom/server + I18nextProvider + hook 验证文本隔离，这是 SDK 运行测试但不等于浏览器 hydration。Playwright 需验证切换语言后的 DOM、键盘焦点、ARIA 提示、异步资源与 IME。

## 演示场景与预期

1. **useTranslation 与按钮切换语言**：真实 useTranslation 订阅当前实例的 languageChanged
2. **多 namespace 和 Trans 富文本**：I18nextProvider 注入本地实例，映射安全 strong 组件
3. **两个独立租户语言 Provider**：同一组资源，两组 provider 互不更改对方语言

## 练习与迁移

把某个复杂设置页中的文案抽成 common/settings 两组资源，独立测试两个 Provider，确保一个租户切换语言不影响另一个。

## 验证分级与限制

本条目包含真实目标包 import 的示例和 Node 定向测试源码。**SDK、TypeScript、生产构建及 Playwright 本轮均未在依赖完整环境执行，状态为 NOT_RUN**。`tests/sdk.test.mjs` 必须在真实依赖安装后执行；Mock 业务数据不等于 Mock 目标库。测试成功后才能按当前源指纹绑定 evidence，不得沿用历史研究报告的 PASS。

## 官方一手资料

- [useTranslation 官方文档](https://react.i18next.com/latest/usetranslation-hook)
- [I18nextProvider 官方文档](https://react.i18next.com/latest/i18nextprovider)
- [Trans 受控富文本说明](https://react.i18next.com/latest/trans-component)
- [官方源代码](https://github.com/i18next/react-i18next)

## 授权

该条目源码与文字为独立编写的教学材料；目标库使用上游 MIT 许可，未捆绑第三方图片、字体或付费资源。
