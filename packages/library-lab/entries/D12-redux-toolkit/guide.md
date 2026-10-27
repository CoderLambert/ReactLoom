# Redux Toolkit 2.13.0：可审计业务状态与单向更新

## 为什么使用
当业务需要跨组件共享复杂、可审计的事件状态、开发工具追踪或统一中间件时，Redux Toolkit 把 `configureStore/createSlice` 作为标准入口。ReactLoom 的简单 UI 状态未必需要 Redux，选型时先比较 D10 Zustand、D11 Jotai。RTK Query 单独解决请求缓存，不能将所有远端数据都塞进 reducer。

## 安装与使用
```bash
pnpm add @reduxjs/toolkit@2.13.0
```
示例直接 `import {configureStore, createSlice} from '@reduxjs/toolkit'`。完整源码在 `examples/example.tsx`；应用使用 React `useSyncExternalStore` 显示当前 store。生产复杂 React 应用可采用与当前版本兼容的 `react-redux`，但本独立示例不偷偷增加共享依赖。

## 三层真实 Demo
**入门：**通过 slice 的 `increment` action 修改计数；`configureStore` 持有 store，组件由 `useSyncExternalStore` 订阅。**业务：**两个团队分别创建独立 store；切换团队时频道状态不会互相泄漏。通过稳定 ID `addFeed/toggleRead` 更新条目。**进阶：**按 request ID `startRequest/finishRequest` 处理两个假设异步返回，第二个请求先完成，旧请求返回时不会覆盖新数据。计时器只是演示业务后端的顺序，Redux Toolkit SDK 为真实依赖。

## 数据所有权
Store 在本示例组件生命周期内创建，每个 tenant 一份；目标项目应根据租户、用户和会话边界决定实例生命周期。RTK reducer 可以使用“可变式”语法，但 Immer 负责产生不可变结果；不能在 reducer 外改写已获取的 state 对象。

`useSyncExternalStore` 的 snapshot 必须在状态未变化时返回稳定引用，RTK store 的 `getState` 满足这一模型。切换租户需要重新订阅目标 store，且异步效果也需要按租户 ID / generation 过滤。

## 典型错误和修复
1. **在每次 render 创建 store：**丢失状态并不断重建订阅；提升所有权或只创建一次。
2. **把所有用户/团队放到同一持久化 key：**产生租户信息串读；使用独立 store 或严格命名空间、退出清理。
3. **在 reducer 外修改 snapshot：**跳过通知、不满足引用一致性；只能通过 action。
4. **只检查 loading，没有请求身份：**慢的旧结果覆盖新的业务数据；在状态里记录 requestId 或使用 RTK Query 的受控缓存。
5. **在 UI 开发时直接分发远端授权状态：**客户端 action 不等于权限；服务端必须重新鉴权。

## 与请求层的关系
D13 RTK Query 与 RTK store 集成，提供 endpoint cache、tags invalidation；D07 TanStack Query 也是远端状态方案。尽量选一个服务端状态事实源，避免重复缓存与含混 invalidation。D06 Immer 可帮助理解 reducer 中的代理更新，但 RTK 已内置 Immer，不必手工在每个 reducer 包裹一次 `produce`。

## 测试
SDK Node test 直接运行 configureStore/createSlice，断言不可变性、租户隔离和旧响应保护。浏览器再验证订阅、切换租户、计时器卸载。网络/服务器权限不由这些单测覆盖，不能声称部署验收。

## 参考
- https://redux-toolkit.js.org/introduction/getting-started
- https://redux-toolkit.js.org/api/createSlice
- https://redux-toolkit.js.org/api/configureStore
- https://www.npmjs.com/package/@reduxjs/toolkit

许可 MIT。
