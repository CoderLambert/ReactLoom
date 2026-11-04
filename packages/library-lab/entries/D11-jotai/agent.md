# D11 Jotai — Agent 复用手册

## 快速选型

Jotai 通过一个个 atom 配置组织细粒度共享和派生状态。atom 对象只是定义，实际值保存在 Store 中。适合分散 UI 状态、从多个原子推导数值、嵌入式微应用或多租户子树；复杂流程或远端缓存应与专用机制组合，而不是所有数据塞进默认全局 atom。

## 实际文件及部署前置

`library.json`（版本与依赖）→ `examples/example.tsx`（完整逻辑）→ `examples/demo.tsx`（Lab 导出）→ `verification.json`（分项证据）。前置依赖：jotai@3.0.1。默认不向外部 API 发起请求。

## 迁移指令

检查项目是否已有 Zustand/Redux/TanStack Query，避免重复管理同一类状态。仅引入需要的 Jotai Core；模块级定义静态 atom，组件中用稳定 Provider + createStore，写入操作按业务 id 执行。状态需要跨工作区时明确共享边界。

## 禁止的反模式

不要每 render 构造 atom 导致订阅震荡；不要从默认 Store 读取租户敏感状态；不要依赖被 v3 删除的旧辅助 API；不把客户端 atom 当远端数据真相或授权源。

## 必须保留的能力边界

不要把 atom 本身当作包含值的对象；没有 Provider 时使用默认 Store，SSR/多租户尤其要审慎。此 Demo 使用 useMemo(createStore,[]) 将 Store 绑定组件实例并在退出时释放引用，不触碰站点默认 Store。原子配置放模块级复用，按业务 ID 创建动态 atom 时应使用 memo 化或专门族工厂，避免每次 render 产生新 identity。

## 最小测试断言

实际 SDK createStore + store.get/set/sub 测试派生更新；同一 atom 的两 Store 数值相互独立；UI 在 Provider 内点击计数只更新当前团队。

## 版本 / 证据

Jotai v3.0.1 修复 v3.0.0 中 useAtomValue 订阅回归；v3 为 ESM-only，要求 Node 22.12+、React 18+、TS 5.5+。 当前示例未获得实际 SDK、完整类型检查、构建或浏览器 PASS；迁移到目标项目需要按目标锁文件重新测试，不能声称历史 PASS 可继承。

## 选型关系

alternative D10：Zustand 偏向 store-centric 集中管理；Jotai 更适合细粒度原子依赖图与派生值。

complements D07：服务端请求缓存应由 TanStack Query 等持有，Jotai 管组件级可变偏好和展示状态。

## 官方出处

Jotai v3 文档：https://jotai.org/docs

atom API：https://jotai.org/docs/core/atom

官方 v3.0.1 发布说明：https://github.com/pmndrs/jotai/releases/tag/v3.0.1

v3 迁移指南：https://jotai.org/docs/guides/migrating-to-v3

## 账号退出与可迁移会话模式

将 TenantWorkspace 放在能感知真实账号/租户身份变化的 key 边界里：身份变化必须实际卸载旧 Provider、创建新 Store。不要只改 label，也不要把隐藏团队的 Store 永久放在上层 useMemo。旧订阅由 React 卸载，Jotai 不替业务服务取消请求；应用还必须同步取消异步任务并按 tenant 清除远端缓存。

复制 examples/story-policy.mjs 与 story-policy.d.mts，真实 toggleReadAtom 必须使用 toggleStoryRead，不得退回数组下标操作。对重复 ID 和无效 read 数据明确拒绝。独立 story-policy.test.mjs 只验证业务策略，SDK 测试须实际 import jotai；浏览器需检查 A 退出后状态回初值而 B 不变，以及进阶模式离开再进入 B 状态清空。
