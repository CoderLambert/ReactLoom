# D12 Redux Toolkit 迁移指南

目标版本 `@reduxjs/toolkit@2.13.0`，MIT，自带类型。适用于多模块共享、事件规则复杂且需要统一action流的客户端状态。小组件用useState；服务端缓存用Query；不要为了一个计数器强行采用Redux。

## 最小落地

在已有React/TSX项目根 `pnpm add @reduxjs/toolkit@2.13.0`。复制 `examples/store.mjs` 与 `store.d.mts`；界面再复制 `example.tsx`，传入basic/business/advanced的level。`demo.tsx`仅Lab适配，可省略。无环境变量、Provider、网络或额外配置；demo CSS类可替换。React/hooks由宿主项目提供。react-redux为多组件可选路线，本例不依赖它。

createFeedStore将slice挂在state.feeds，slice.name=labFeeds只决定action前缀。组件lazy useState创建两个稳定store；useSyncExternalStore订阅active，切换团队只切订阅源。SSR须每请求创建并提供一致初始快照。

SDK createSlice提供Immer draft与action creators，configureStore提供store/default middleware；ID去重、团队store分离、activeRequest比较、ignored计数和timer回包全是本例自建逻辑。fixture不是HTTP、API权限或自动取消。DevTools显式关闭，默认检查保留；序列化警告不是输入校验，不要声称它拒绝非法动作。

## 不可删的规则与清理

- 只通过dispatch写状态，case reducer内部允许改draft；不要在外部修改getState返回值。
- addFeed按稳定ID去重，toggleRead按ID查找；未知ID不影响其他行。
- finishRequest仅在ID匹配时写result并清空activeRequest；不匹配增加ignored。
- timers保留在组件ref，不进state。切换active/卸载clearTimeout并cancelRequest；新一轮及重置也清旧timer。
- useSyncExternalStore负责取消store订阅。没有全局存储/监听需要清空。
- reset完整替换slice，且只dispatch到当前store；不能用UI过滤冒充租户或服务端隔离。

## 错误与生产边界

SDK没有替本例验证任意外部feed载荷；接API时加schema与错误UI。timer无HTTP失败/重试，不能把忽略旧响应当成撤销服务器POST。真实请求在transport传AbortSignal，身份guard仍保留。Promise/AbortController留ref或闭包；不要关闭默认中间件来塞不可序列化对象。

整树useSyncExternalStore会对无关字段更新订阅者；正式多组件应用改react-redux字段选择器。远程缓存交给RTK Query/TanStack Query，避免双份响应数组。

## 验证与来源

`node --test packages/library-lab/entries/D12-redux-toolkit/tests/sdk.test.mjs`真实导入SDK与同一store.mjs，不复制另一套reducer作为证据。断言旧快照不变、独立store、重复/未知ID、两种响应顺序、cancel和完整reset。浏览器另验订阅切换、计时器清理与重置恢复，提案在validation/browser.spec.ts。

官方README为reduxjs/redux-toolkit固定提交370f7eb6403bdfdb1a2ab5b90fbcfd8eaee7d57b的packages/toolkit/README.md；无官方中文README，采用包级英文原文。官网unknown，HTTP200不能推出嵌入允许。原始证据见official/source-evidence.json，本地命令见local-validation.md。正式sdk/build/browser保持NOT_RUN直到匹配committed receipt。
