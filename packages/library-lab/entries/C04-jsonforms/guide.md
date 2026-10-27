# JSON Forms：动态业务表单工程实践

## 使用定位
JSON Forms 使用 JSON Schema 描述数据校验，以 UI Schema 控制布局/字段显隐，以 renderer 将 schema 变成 React 控件。适合由服务端定义字段和复杂表单；简单固定字段表单先考虑 C01 React Hook Form，避免引入完整表单引擎。

## 版本与安装
基于 @jsonforms/react、@jsonforms/core、@jsonforms/vanilla-renderers 3.8.0，Ajv 8.20.0。目标安装命令：

    pnpm add @jsonforms/react@3.8.0 @jsonforms/core@3.8.0 @jsonforms/vanilla-renderers@3.8.0 ajv@8.20.0

真实导入及运行源码位于 examples/example.tsx。宿主 Demo 只重导出，不另造展示代码。

## 入门：双 Schema 与状态
JSON Schema 的 required/minLength/if/then 管校验，UI Schema 的 VerticalLayout/Control/rule 管呈现，二者独立。onChange 会在初始校验时触发；新数据与旧数据等值时保持引用稳定，避免受控循环。vanillaRenderers 与 vanillaCells 都需要传入。

## 业务：RSS 渠道管理
演示以 Subscription 为状态事实源。切换 feedType 时 URL 控件隐藏，但隐藏字段仍可能存在于 data；提交必须使用 toSubscriptionPayload 白名单映射，manual 不传 url。为 name/url 指定 maxLength；UI 的控制不能代替服务器端授权、内容安全、SSRF 防护与数据校验。服务端不应抓取用户提交的私网 URL。

## 进阶：真实交互边界
输入 duplicate 映射到模拟 HTTP 409，并将 ErrorObject additionalErrors 回填字段；非 HTTPS RSS 模拟策略 422。保存采用 AbortController + generation 双栅栏，取消与重置均使旧结果失效。演示不会调用真实服务器，只有 JSON Forms 渲染/校验使用真实 SDK。

## 三个反例
1. 只用 UI rule 隐藏字段，却将完整 data 发给后端：必须做 payload 白名单。
2. 将异步响应直接 setState，导致旧请求覆盖当前编辑：必须保持请求身份、取消与卸载清理。
3. onChange 每次无条件建新对象，引发回环或不必要渲染：比较并保持稳定引用，但不要牺牲字段更新。

## 生产核验
固定 Schema/renderer 版本、内部多语言文本和可访问性 labels；Ajv 仅负责格式及结构，跨字段业务语义另做服务器二次校验。动态 renderer 不应执行来自不可信来源的代码。验证模式、额外错误和中文 IME 需 Chromium 测试。真实 SDK、tsc 与浏览器状态由 verification.json 单独记录。

## 推荐资料
https://jsonforms.io/docs/integrations/react/
https://github.com/eclipsesource/jsonforms
