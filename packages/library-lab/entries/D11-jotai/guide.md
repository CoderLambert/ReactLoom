# Jotai — ReactLoom 工程实战

## 定位与适用范围

Jotai 通过一个个 atom 配置组织细粒度共享和派生状态。atom 对象只是定义，实际值保存在 Store 中。适合分散 UI 状态、从多个原子推导数值、嵌入式微应用或多租户子树；复杂流程或远端缓存应与专用机制组合，而不是所有数据塞进默认全局 atom。

## 安装及版本约束

~~~bash
pnpm add jotai@3.0.1
~~~

Jotai v3.0.1 修复 v3.0.0 中 useAtomValue 订阅回归；v3 为 ESM-only，要求 Node 22.12+、React 18+、TS 5.5+。

## 真实代码路径

实际入口为 examples/demo.tsx，完整可迁移实现为 examples/example.tsx。Library Lab 展示的代码由这两份源文件生成并计算 SHA-256；三个 Demo 场景共享真实实现，使用 level 切换学习层次。不得为文档另外维护一份看起来相同但不可运行的伪代码。

## 核心对象

atom(0) 创建原子配置；atom(get=>...) 追踪读依赖；atom(null,(get,set,...args)=>...) 实现只写 action。useAtom、useAtomValue、useSetAtom 分别用于读写、只读、只写。createStore 和 Provider 明确状态所有权；同一个 atom 在两个 Store 中有不同的值。

## 三个场景

入门：点击按钮更新 count，doubleAtom 自动计算。业务：RSS 文章列表有独立稳定 id，通过 toggleReadAtom 更新 articlesAtom，unreadAtom 只从同一 Store 读取。边界：页面同时渲染团队 A/B 的独立 Provider，两端 atom 配置相同，但修改 A 不能改变 B。

## 状态所有权

不要把 atom 本身当作包含值的对象；没有 Provider 时使用默认 Store，SSR/多租户尤其要审慎。此 Demo 使用 useMemo(createStore,[]) 将 Store 绑定组件实例并在退出时释放引用，不触碰站点默认 Store。原子配置放模块级复用，按业务 ID 创建动态 atom 时应使用 memo 化或专门族工厂，避免每次 render 产生新 identity。

## 错误反例

错误一：在组件每次渲染重新 atom(0)，引发循环重新订阅；改为模块级静态 atom 或 useMemo。错误二：将服务端响应全塞到 Provider-less 的默认 Store，租户/SSR 可能串数据；使用请求/租户级 Store 及明确 owner。错误三：把可写派生 atom 的副作用当成事务或服务器回滚；异步失败需独立取消、重试、事务规则。错误四：Jotai v3 引入旧 v2 的已移除 atomFamily/loadable 导出；先阅读迁移指南而不是盲目升级。

## 组合和版本

Jotai v3.0.1 的核心 ESM 导入适合现代 Vite 8/React 19。若需要 localStorage，可评估 jotai/utils 的 atomWithStorage，但需键命名空间和 SSR 水合策略，本 Demo 不将令牌写入 storage。对远端数据使用 TanStack Query，与 Zustand 选型看是否需要原子依赖模型或统一 store。

## 验收范围

node:test 使用真实 createStore/atom，验证派生更新、Store 隔离和订阅；浏览器需验证组件点击及 Strict Mode 重挂载。此处没有对持久化、SSR 并发或大型原子图做性能基准。

## 演示场景与预期

1. **基础 atom 与派生 atom**：同一 store 中 count 与 double 响应式更新
2. **RSS 未读统计与写入 atom**：按稳定行 ID 切换已读，unread derived 自动更新
3. **两个独立 Provider Store**：同一 atom 配置跨两个团队互不干扰

## 练习与迁移

在 NewsHub 加一个不影响后端缓存的阅读筛选面板：每个用户工作区 Provider 分离状态，已读过滤为派生 atom。

## 验证分级与限制

本条目包含真实目标包 import 的示例和 Node 定向测试源码。**SDK、TypeScript、生产构建及 Playwright 本轮均未在依赖完整环境执行，状态为 NOT_RUN**。`tests/sdk.test.mjs` 必须在真实依赖安装后执行；Mock 业务数据不等于 Mock 目标库。测试成功后才能按当前源指纹绑定 evidence，不得沿用历史研究报告的 PASS。

## 官方一手资料

- [Jotai v3 文档](https://jotai.org/docs)
- [atom API](https://jotai.org/docs/core/atom)
- [官方 v3.0.1 发布说明](https://github.com/pmndrs/jotai/releases/tag/v3.0.1)
- [v3 迁移指南](https://jotai.org/docs/guides/migrating-to-v3)

## 授权

该条目源码与文字为独立编写的教学材料；目标库使用上游 MIT 许可，未捆绑第三方图片、字体或付费资源。

## 会话切换与 Store 生命周期（增量实战）

进阶示例新增「退出并新建团队 A 会话」操作。每个 TenantWorkspace 自己用 createStore 创建 Store，外层对该子组件使用随会话编号变化的 React key；退出时旧 Provider 子树卸载，重新挂载时得到新的 Store 与计数、RSS 已读初值。团队 B 组件不受 A 退出影响；离开进阶示例时 B 被卸载，返回后是新 Store。不能只改变页面上的租户名称却复用原 Store，这会让上一账号的 UI 草稿继续存在。

story-policy.mjs 的 toggleStoryRead 在真正的写 atom 中调用，通过不可变数组快照与稳定业务 ID 更新记录。重复或空 ID、非布尔 read 明确抛错，找不到目标 ID 返回原数组，以免无效事件触发不必要的订阅刷新。源文件与 .d.mts 类型声明作为三个场景共同的真实展示源码。

注意：本示例只证明本地 Jotai Store 的所有权生命周期，不负责注销网络请求、清理 TanStack Query 缓存、后端鉴权或服务端租户隔离；正式登录切换必须由应用整体编排这些资源。React StrictMode 与快速切换 UI 仍需浏览器真实验收。

定向纯策略回归：node --test packages/library-lab/entries/D11-jotai/tests/story-policy.test.mjs；SDK 源码：tests/sdk.test.mjs 真正 import jotai，需要已安装的固定依赖。纯策略 PASS 不等于 SDK / tsc / build / Chromium PASS.
