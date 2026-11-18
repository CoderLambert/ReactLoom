# Redux Toolkit：用动作组织共享状态

同一新闻工作台里，计数、频道已读和异步结果由不同控件更新。组件越来越多时，需要回答“发生了哪个事件、它改了哪一份状态、旧请求为什么不能覆盖新结果”。Redux Toolkit 将事件组织成 action，由 slice reducer 计算新状态，store 保存状态并通知订阅者。

本例有三个独立实验：动作与不可变更新、两个团队的状态隔离、乱序回包的身份守卫。数据全部是本地 fixture；团队 store 分离是客户端组织方式，不能充当服务端权限校验。

## 什么时候选它

多个模块共享复杂客户端流程、希望统一事件约定与可调试状态流时，Redux Toolkit 比散落的 setState 更容易维护。代价是 action、reducer、store 和订阅层的组织成本。单个开关用 useState，轻量共享状态可评估 Zustand，细粒度原子可评估 Jotai。服务端查询缓存交给 TanStack Query 或已采用 Redux 的项目中的 RTK Query，避免复制一份响应数组到 slice。本条不实现 RTK Query、createAsyncThunk、真实 HTTP 或服务端权限。

锁定 `@reduxjs/toolkit@2.13.0`（MIT）。库包含 TypeScript 类型，不需要另装 @types。示例显式关闭 DevTools，避免向扩展发送演示动作；这不会禁止业务代码调用 dispatch。

## 核心模型：输入动作，输出新快照

`createSlice({ name, initialState, reducers })` 生成 reducer 和 action creators；这里 `increment()` 生成的 type 是 `labFeeds/increment`。`configureStore({ reducer: { feeds: feedsSlice.reducer } })` 将切片放到根状态的 `feeds` 下。注意 slice 名决定动作前缀，reducer 的挂载键决定状态路径。

```js
import { actions, createFeedStore } from './store.mjs';
const store = createFeedStore();
const before = store.getState();
store.dispatch(actions.increment());
console.log(before.feeds.counter);           // 0，旧快照没有被修改
console.log(store.getState().feeds.counter); // 1
```

slice 的 case reducer 中 `state.counter += 1` 修改的是 Immer draft，SDK 生成不可变的新状态。不能在 reducer 外改 `store.getState()`，也不要把 draft 带出 reducer。`reset` 返回完整初始对象，替换这个 slice。默认中间件保留 thunk；开发态还会检查不可变性、序列化及 action creator 误用。序列化检查通常输出诊断警告，不能当成业务校验或安全拒绝机制。不要把 Promise、函数或 AbortController 放进 state。

React 使用 `useSyncExternalStore(active.subscribe, active.getState, active.getState)` 订阅当前 store；它订阅整棵小状态树。多组件项目通常采用 react-redux 的 Provider 和字段选择器，减少无关字段变动引发的渲染。这是迁移选项，本例没有用到它。

## 最小接入与可迁移文件

在已有 React/TSX 项目根执行 `pnpm add @reduxjs/toolkit@2.13.0`。复制 [`store.mjs`](examples/store.mjs) 与 [`store.d.mts`](examples/store.d.mts)，它们是计算与类型入口；复制 [`example.tsx`](examples/example.tsx) 得到完整界面。`demo.tsx` 只是 Lab 的默认导出适配，可以不复制。组件接收 `level="basic" | "business" | "advanced"`，例如 `<ReduxExample level="business" />`。无 Provider、环境变量、网络、持久化或特殊 bundler 配置；demo CSS 类可替换成项目样式。使用的标准 React hooks 由现有 React 依赖提供。

store 必须在稳定生命周期创建，示例用 lazy useState 创建团队A/B两份 store。不要每次渲染调用 configureStore。SSR 应按请求创建 store，并保证服务端与客户端初始快照一致；这个本地示例没有 SSR 数据注入。

## 三个操作实验

### 1. 基础：动作驱动计数

点“计数 +1”，输出从当前A计数0变为1；“只重置当前工作区”回到0。真实路径是按钮 → action creator → dispatch → Immer reducer → 新快照 → React订阅。SDK用例同时断言旧快照仍为0，避免仅凭画面判断不可变性。

### 2. 业务：两个团队与稳定频道ID

团队A点击“增加频道”，得到 `A-1`；勾选复选框后该ID对应 `read=true`。切到B时计数和列表独立，添加B频道再回到A，A的已读保留。重置只派发给当前store。`addFeed` 按ID去重，`toggleRead` 按ID定位，找不到则不修改其他行；正常按钮生成唯一ID，重复ID分支由真实SDK测试覆盖。

两个configureStore互不共享状态，不是通过画面过滤实现的。后端仍须验证团队身份及资源访问权限；本例没有登录或服务器。

### 3. 进阶：新请求先回、旧请求后回

页面不重复展示频道表单。点“模拟先后返回的两个请求”，输出显示带团队前缀的old/new ID与计划：先登记old，再登记new。约350ms后new完成，结果为“新请求已采用”；约1000ms后old完成，忽略计数加1，结果保持不变。实际计时受调度影响，不承诺毫秒级网络性能。

`finishRequest` 的 `activeRequest === payload.id` 判断是**示例自己编写的业务规则**，不是RTK自动阻止旧响应。匹配后清空activeRequest；不匹配只增加ignored。先到的旧响应也会被拒绝，SDK用例覆盖两个顺序。start仅替换当前身份，不取消真实网络；忽略回包不代表服务器未执行写操作。

请求计划文字保留最近一次操作的说明；切走再返回可能仍看见旧计划，不表示计时器仍在执行。切换团队或卸载会清除本组件持有的timeout并cancelRequest；启动新一轮会清除上轮timeout；重置也清除timeout，避免稍后旧回调再次改变已重置状态。store.subscribe返回的取消订阅由useSyncExternalStore管理。没有外部存储或全局监听要清空。换成真实请求时，还要传AbortSignal并处理失败/重试；本例timer不演示HTTP失败。

## 验证与生产取舍

在仓库根执行 `node --test packages/library-lab/entries/D12-redux-toolkit/tests/sdk.test.mjs`。套件真实导入SDK以及浏览器使用的同一个store模块，验证旧快照、双store隔离、稳定ID去重/已读、两种响应顺序、取消与完整重置。界面重置、订阅切换与timer卸载需要另做浏览器检查，证据见 `local-validation.md`，不能由Node通过推出。

生产改造时保留默认中间件；输入DTO由边界schema验证，不依赖序列化警告拒绝非法值。客户端租户隔离不能替代API鉴权。需要排队而非“最后发起者胜出”时，应设计任务队列，不能继续用单个activeRequest。远程缓存接入RTK Query时，应删除重复的本地响应缓存与fixture timers。

## 官方资料

包级官方英文README来自固定v2.13.0提交 [`370f7eb6403bdfdb1a2ab5b90fbcfd8eaee7d57b/packages/toolkit/README.md`](https://github.com/reduxjs/redux-toolkit/blob/370f7eb6403bdfdb1a2ab5b90fbcfd8eaee7d57b/packages/toolkit/README.md)，原文在官方README页签；固定提交递归树未发现官方中文README，本页为独立中文教学。[官网](https://redux-toolkit.js.org/)提供完整API。当前HTTP200与响应头已保存，但未确认从Lab origin嵌入，官网状态为unknown，保留预览尝试和直达。
