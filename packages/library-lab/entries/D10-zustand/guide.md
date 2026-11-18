# Zustand：把界面偏好变成可独立创建的 store

同一个工作台里，团队 A 和 B 各有频道启用偏好，列表/网格视图需要跨组件共享。Zustand 5.0.16（MIT）把这些客户端状态放入一个外部 store；React 用选择器订阅需要的字段。适合状态不只属于一个组件、又不需要复杂事件流程的场景。一个组件的开关直接用 useState；请求缓存、重试与失效用 TanStack Query；有明确互斥阶段的业务流程比较 XState；细粒度原子派生图比较 Jotai。

此例没有网络、账号或权限系统。两个团队的布尔值是本地偏好 fixture；字段分开不构成安全隔离。凭据、远程文章和权限决定不要放进这个 store 或 persist。

## 从更新到画面：vanilla 与 React 的分工

[`store.mjs`](examples/store.mjs) 从 `zustand/vanilla` 导入 `createStore`，返回具有 `getState`、`setState`、`subscribe` 的对象；它不要求 React。动作调用 `set` 更新状态，默认只浅合并顶层，因此 toggle 必须展开 `enabledByTenant` 才能保留另一团队。`setState(next, true)` 会整体替换，包括动作函数，要谨慎使用。

[`example.tsx`](examples/example.tsx) 的 `useStore(store, state => state.view)` 把外部 store 接到 React。v5 使用 `useSyncExternalStore`，选择结果按 Object.is 比较；原始值没有变化时不需要由该订阅更新组件。这里父组件还有其他选择器，所以整个面板可能因其他字段渲染，不能用面板刷新来判断单个选择器失效。新对象/数组选择结果需要稳定引用或 `zustand/react/shallow` 的 useShallow；不要每次返回一个新对象导致快照不稳定。

最小业务调用：

```ts
const memory = makeMemoryStorage();
const store = createChannelStore(memory.storage);
await store.persist.rehydrate();
store.getState().setView('grid');
const unsubscribe = store.subscribe((next, previous) => {
  if (next.view !== previous.view) console.log(next.view);
});
unsubscribe(); // 非 React 订阅由调用方清理
memory.dispose(); // 只删除此实例私有 Map 的偏好键
```

React 内选择字段：`useStore(store, state => state.view)`。store 创建放入组件的惰性 useState，不在每次渲染重新创建。SSR 按请求创建并提供给对应组件树，不使用跨请求模块单例；初始服务端快照与客户端首次快照要一致。

## 三个独立实验

### basic：一个 store 的读写与订阅

点击“切换当前频道启用状态”，JSON 的 team-a 在 true/false 间变化，team-b 保持 false。动作真实执行 Zustand；React 通过字段选择器展示状态。点击“重建 store / 从当前内存恢复”，新对象从同一 Map 读取偏好。按钮不是浏览器刷新：真正刷新页面、离开 Demo 再回来都会丢掉 Map。

### business：团队字段和 store 实例是两层隔离

页面同时出现两份面板；第二份标为“独立实例 B”。在第一份切换到团队 B 并翻转启用状态，只有第一份的 team-b 改变。切回团队 A，A 的值仍在。第二份无变化，即使两个存储使用相同键名，因为每份有独立 Map 和 store。

视图在每份实例内共享，不是每团队独立视图。把第一份视图改为 grid、选择团队 B，再重建：偏好恢复为 grid，身份回到 team-a，因为 tenant 不在白名单。这个例子展示客户端实例隔离和字段分区，生产权限仍必须由服务端验证。

### advanced：白名单与 v1 → v2 迁移

点击“导入旧版 v1 数据并迁移”，把 `{state:{enabled:false,view:'grid'},version:1}` 种入当前 Map，再由真正的 persist rehydrate 调用迁移函数。结果 team-a=false、team-b=false、view=grid。展开存储，JSON 只含 view 和 enabledByTenant，version=2；没有 tenant 和动作函数。

[`migration-policy.mjs`](examples/migration-policy.mjs) 是业务策略，不是 Zustand 自带数据验证器。它只接受 v1 对象，布尔必须 typeof 为 boolean；`"false"` 回默认 true，未知版本回默认 list/A=true/B=false，函数不修改输入。`partialize` 是输出白名单，不能验证读入的同版本 v2 数据。正式接入应在 storage 或 merge 边界验证所有入站形状；本例仅导入受控 v1 fixture。

## 最小迁入

安装固定依赖 `pnpm add zustand@5.0.16`，React 绑定需 React 18+；本项目已有 React 19。复制 store.mjs、store.d.mts、migration-policy.mjs、migration-policy.d.mts；React 页面可按 example.tsx 接入，demo.tsx 只是 Lab 出口。无 CSS、环境变量、Provider 或 bundler 插件要求，demo-controls 类可删。

内存版本可以直接运行，但不会跨刷新持久化。要落浏览器持久化：在客户端创建 store 时传入 localStorage（符合 StateStorage），保留 createJSONStorage、version、partialize、migrate、skipHydration，并在可用时显式 rehydrate；SSR 不直接访问 window。按应用/账号命名键，登出只 removeItem 自己的键并重建 store，不调用 localStorage.clear。默认 merge 是浅合并；设计新版字段时考虑显式验证与合并。

只升级 version 才能读同键旧版本并 migrate；改 name 会换存储键，旧键不会自动迁移。生产若改键，需要自己设计搬迁，不能假设 middleware 能找到旧键。不要把 JSON 中 Date 当成可自动恢复的 Date。

## 错误、清理和验证

无键会使用默认值。非法 JSON 的解析错误发生在 migrate 之前；persist 用 onRehydrateStorage 的完成回调报告，本例记录控制台并保留默认状态，hasHydrated=false。不能说“所有坏 JSON 都由 migrate 兜底”。生产应把失败状态展示给用户，并提供只重置自有键的恢复操作。同步 storage 配额错误也应处理，不能因无法保存清掉其他应用数据。

React 的 useStore 自己取消订阅。非 React subscribe 必须保留并调用 unsubscribe；store 没有 v5 destroy API，放弃旧对象前取消自己的监听即可。本例没有定时器、网络或全局事件；组件卸载 effect 删除私有 Map 键。重建按钮保留这份 Map 以模拟本次挂载内恢复；第二个面板从来不共享它。Strict Mode 会额外执行 effect，本例同步内存空键恢复可重入，不代表任意异步生产 storage 已解决竞态。

真实 SDK 测试直接导入本例 store.mjs，验证实例/团队隔离、白名单、重建、迁移、订阅取消、非法 JSON 与清理。策略测试另测迁移输入，不替代 SDK。浏览器提案在 validation/browser.spec.ts，需主代理接线运行；正式 sdk/build/browser 仍以 verification.json 与有效收据为准，局部执行见 local-validation.md。

## 官方资料

官方原文与中文教学分开。README 固定 commit、摘要和版本见 library.json 与 official/source-evidence.json。该固定树的 README 候选已保存：无官方中文 README，因此保存根 README 英文原始字节，未自行翻译冒充官方原文。官方 homepage 已实际 GET 并保存响应头，但没有从 Lab origin 验证嵌入，状态 unknown；请用官网页签的直达入口。API 核对基于固定 tag 的 src/react.ts、src/middleware/persist.ts，原文证据在 official/。
