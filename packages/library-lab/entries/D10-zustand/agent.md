# D10 Zustand — Agent 移植契约

## 适合
已采用 React19，需要共享 UI 状态、无复杂重放需求，不希望 Redux 级别协议。远端缓存/请求参考 D07 TanStack Query；流程状态机比较 D14 XState。

## 可复用源码
examples/example.tsx：createChannelStore(storage) 是 vanilla + persist 模式；makeMemoryStorage() 是防污染教学适配器，**生产业务应注入经过审查的 storage，不能复制它并宣称跨刷新持久**。examples/demo.tsx 只是页面出口。

## 必须保留
- 每个用户/租户状态具有明确所有权，SSR 不共享一个模块级 mutable store。
- useStore 使用稳定 selector，避免每次返回新对象。
- persist 只 partialize 非敏感字段，key 具备应用与版本隔离。
- version/migrate 管理旧 schema，hydrate 完成前业务不能盲目写。
- Async 业务使用身份/请求取消；Zustand 本身不提供远端请求清理。

## 禁止
重复维护 Query 缓存、把 token/秘密写入 localStorage、共用 session 之外的单例、在 render 创建 store、把旧研究中“通过”搬到当前代码版本。

## 验证
node --test entries/D10-zustand/tests/sdk.test.mjs，必须真加载 zustand/vanilla 与 middleware；再应用 typecheck/build、租户切换和迁移浏览器检查。未跑 NOT_RUN。依赖声明向 PLATFORM 申请 zustand@5.0.16。

官方：https://zustand.docs.pmnd.rs/
