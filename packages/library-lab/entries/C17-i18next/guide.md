# i18next — ReactLoom 工程实战

## 定位与适用范围

负责资源加载、复数、插值、回退和语言决策，而不是机器翻译。适合客户端、Node、SSR 共享相同翻译词条的业务。React 的视图订阅应交给 react-i18next，单独调用核心 t 并不会自动让所有 React 组件刷新。本示例只使用本地数据，无翻译服务和网络依赖。

## 安装及版本约束

~~~bash
pnpm add i18next@26.4.3
~~~

采用现有 ReactLoom SPA 已固定的 i18next 26.4.3，不擅自升级模板；2026-10-25 官方发布过更新版，未来由平台统一做兼容核验。

## 真实代码路径

实际入口为 examples/demo.tsx，完整可迁移实现为 examples/example.tsx。Library Lab 展示的代码由这两份源文件生成并计算 SHA-256；三个 Demo 场景共享真实实现，使用 level 切换学习层次。不得为文档另外维护一份看起来相同但不可运行的伪代码。

## 核心模型

createInstance 为每个工作区或请求创建独立实例；init 加载资源并设置默认 ns、fallbackLng 和支持的语言。t('news:article',{count}) 使用 Intl.PluralRules 选择资源复数后缀；en 区分 one/other，zh 常落入 other。changeLanguage 返回 Promise，UI 需处理并发切换，不能假设同步完成。

## 三层实战

基础：切换中文/英文、输入昵称并观察 HTML 文本插值。业务：通过 common 和 news 命名空间渲染 RSS 文章数和栏目标签。进阶：中文没有 editorial 键，使用 fallbackLng:'en' 返回英文；不存在的键显式给 defaultValue，避免将原始 key 直接展示为产品文案。

## 生产实践

初始化在读取 t 之前完成。服务端为不同请求单独创建实例并注入当前用户语言，避免共享 singleton 泄漏状态。资源应按语义分 namespace 并具备提取与审核工作流；长列表避免每一行重复加载语言包。切换语言时对 pending Promise 做版本保护，组件卸载时先 dispose 切换队列，再通过 off('languageChanged') 解除私有实例的事件监听并忽略旧回调。i18next 26.4.3 没有 destroy() API；本例仅使用内嵌资源，无后端句柄需要关闭。

## 错误示例与修正

错误一：模块初始化期间 const title = i18n.t('title')，之后语言切换不会更新；改为语言变化时重新计算。错误二：每个组件调用 default i18next.init，彼此覆盖当前语言；改为由应用 owner 初始化一次，隔离场景使用 createInstance。错误三：用字符串替换自行实现复数、将 HTML 字符串直接注入 DOM；改为真实 t 复数规则与 React 安全文本，富文本交给受控组件映射。错误四：省略 fallbackLng，默认为 dev，导致部署环境出现原样键名；显式指定主语言和可观测的缺失键策略。

## 组合方案

与 react-i18next 组合时由 I18nextProvider/hook 订阅语言变化；与 SSR 服务组合时根据请求 Accept-Language/用户偏好建立隔离资源上下文。若只有单一页面几个静态文本，不一定需要引入整个资源管理体系。

## 边界与验收

生产环境需要校对语言资源、XSS/HTML 输出策略、翻译缺失指标和中文 IME。取消旧切换 Promise 的结果回写不等于真正取消语言包加载。示例的成功标准是官方 SDK 的初始化、切换、复数与 fallback 断言，不是仅测试一份自己写的字典对象。

## 演示场景与预期

1. **切换语言、插值与数量复数**：独立实例与欢迎语，真实使用 i18next.t/changeLanguage
2. **RSS 多命名空间资源**：common/news 分离，单复数以及共享文本
3. **缺失键、回退与生命周期**：未配置中文资源时回退英文；卸载释放独立实例的队列和事件监听

## 练习与迁移

将一个 NewsHub RSS 分组页抽离 common/feed 两个 namespace，编写请求隔离、中文缺失回退与英语 1/2 条复数断言。

## 验证分级与限制

本条目包含真实目标包 import 的示例和 Node 定向测试源码。**SDK、TypeScript、生产构建及 Playwright 本轮均未在依赖完整环境执行，状态为 NOT_RUN**。`tests/sdk.test.mjs` 必须在真实依赖安装后执行；Mock 业务数据不等于 Mock 目标库。测试成功后才能按当前源指纹绑定 evidence，不得沿用历史研究报告的 PASS。

## 官方一手资料

- [i18next 官方 API](https://www.i18next.com/overview/api)
- [配置选项与初始化](https://www.i18next.com/overview/configuration-options)
- [官方项目](https://github.com/i18next/i18next)

## 授权

该条目源码与文字为独立编写的教学材料；目标库使用上游 MIT 许可，未捆绑第三方图片、字体或付费资源。

## 第16轮：语言切换并发所有权

真实 `changeLanguage` 返回 Promise；只用请求编号阻止旧 `setState` 不足以阻止旧 Promise **修改 i18next 实例本身**。本版 `examples/language-switch.mjs` 将每个独立实例的切换操作串行化，队列只保留最后一次意图；仅最终操作完成时提交当前语言或错误，卸载后 `dispose()` 抛弃未执行请求。不能取消底层语言包 I/O，释放实例前必须 dispose 队列，并解除本实例的 languageChanged 监听。可复制 `examples/language-switch.d.mts` 为 TS 类型契约。

无第三方依赖的策略测试：`node --test entries/C17-i18next/tests/language-switch.test.mjs`，覆盖快速切换、旧失败、卸载和之后重试；**真正 SDK 验证**必须另外执行 `node --test entries/C17-i18next/tests/sdk.test.mjs`（其中真实 import i18next，需安装依赖）。浏览器还需覆盖实际语言切换、复数文案、错误和 React Strict Mode 卸载，当前均未执行。
