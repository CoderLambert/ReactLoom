# D10 Zustand — 轻量状态、租户隔离与持久化版本迁移

## 为什么选

Zustand v5.0.16（MIT）适合客户端短生命周期的 UI 状态，例如筛选、用户选择、布局和开关；远端数据状态优先由 TanStack Query（D07）负责。示例使用 React 19 + zustand/vanilla、zustand/react hook，以及真正的 persist middleware。不会将客户真实数据写入本地存储。

## 安装

~~~sh
pnpm add zustand@5.0.16
~~~

~~~ts
import {createStore} from 'zustand/vanilla'
import {useStore} from 'zustand'
import {persist,createJSONStorage} from 'zustand/middleware'
~~~

示例实际源码 examples/example.tsx；演示出口 examples/demo.tsx。库版本固定，并优先沿用仓库已有 Zustand 选型。

## 三层场景

基础：用 createStore 定义 action，React useStore(store,selector) 订阅当前 state；组件无须 Context provider，即使同一页出现多个 store 也可以显式指定。

业务：技术团队 A/B 的启用状态按 tenant ID 分离；切换 team 不应沿用另一个 team 的布尔值。选中的 tenant 是页面会话状态，不进入持久化白名单。

进阶：persist + createJSONStorage 将存储限定为 view 与 enabledByTenant。为避免实验污染已有应用，使用当前组件独占的 Map 实现 StateStorage；模拟刷新读取同一内存存储；导入 v1 结构时由 migrate 映射到 v2 对应字段。不要把实验内存存储当做刷新浏览器仍保留数据的证明。

## Zustand v5 的类型与订阅语义

- createStore<StoreState>()(...) 返回可在 React 外测试的 vanilla store，便于多实例隔离和 SSR 请求作用域。
- useStore(store, state => state.enabledByTenant[state.tenant]) 只订阅所需派生值；严格保证 selector 输出稳定，不在 selector 内每次创建新数组或对象。
- persist 的 partialize 决定写入的数据；函数、token、临时 tenant 不入存储。
- version + migrate 是 schema 演进机制；skipHydration 防止初始读取时序不受控，明确在 UI 挂载时 rehydrate。

## 反模式与修复

1. 在模块顶层导出所有用户共用的 store 并用于 SSR：跨请求共享隐患。按请求或应用 session 建立 store。
2. 把服务端列表长期保存 Zustand，又用 Query 缓存同一资源：双份事实源；远端以 QueryClient 为所有权。
3. selector 每次返回新对象：触发不稳定订阅甚至重复渲染；订阅原子字段或用 shallow。
4. localStorage 没有命名空间/版本：不同账号覆盖；使用明确 key、partialize、version/migrate。
5. 无意保存访问 token、医疗或隐私字段：持久存储泄露。持久化白名单只包含非敏感 UI 偏好。
6. persist hydrate 完成前使用默认值发起业务写入：发生覆盖竞态。通过 skipHydration/hasHydrated 控制。
7. 卸载后持有上个租户异步回调：旧 store 继续更新。异步请求使用 AbortSignal/身份版本，不能只靠 set。

## 验证与安全

SDK 测试使用真实 zustand/vanilla 与 persist、独立多 store、版本迁移/部分状态序列化；尚未执行则 NOT_RUN。界面按钮明确状态和团队标签，不用颜色代替状态语义。实验存储退出后清理 Map，不触及真实浏览器存储。

官方：https://zustand.docs.pmnd.rs/ · https://zustand.site/en/docs/persist/ · https://github.com/pmndrs/zustand/releases
