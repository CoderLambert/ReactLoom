# D09 Axios — 拦截器、取消和错误语义

## 选型与依赖

使用 axios@1.20.0（MIT），与 D08 Ky 二选一按项目基础设施取舍：已有 Axios 拦截器、请求改写、上传能力或 Node 适配器时保留 Axios；只需要 Fetch 风格 API 时可比较 Ky。2026年 npm 出现恶意 axios@1.14.1 / 0.30.4，团队安装时必须使用确认的受信标签、锁文件与安全扫描，避免浮动安装中招。

~~~sh
pnpm add axios@1.20.0
~~~

~~~ts
import axios from 'axios'
const client=axios.create({baseURL:'/api',timeout:5000})
const response=await client.get('/sources',{signal:controller.signal})
~~~

## Demo 的真实边界

三个场景共用 examples/example.tsx：真正 import 并执行 Axios.create、interceptors.request.use、interceptors.response.use、.get、.post、axios.isAxiosError 和 AbortSignal。适配器是每次页面挂载创建的严格 https://lab.invalid 内存 fixture，不会联网；它模拟 HTTP 409/503，因此不能把这项单测叫做真实服务器兼容性验收。

**基础**：实例独立、请求头仅属于当前实例、请求/响应拦截链。

**业务**：租户 A/B 搜索时每次发新查询均 abort 上一请求，加自增 generation 避免上轮 Promise 回写。IME 合成时不启动关键词查询。后端数据必须校验结构；TypeScript 泛型本身不会验证 JSON。

**进阶**：GET 503 仅再试一次；POST 409 作为版本冲突直接失败，不能悄悄重复写入。Fixture adapter 自行构造 AxiosError，保留 status 与业务信息。

## 反例与修复

1. 把所有功能放进全局 axios.defaults：造成跨页面、跨租户隐式共享拦截器。改用 axios.create()，配套 eject/dispose。
2. 每次 render 注册 interceptors：重复追加 header、日志和刷新 token。一个实例只注册一次，卸载 eject。
3. 将超时与取消混用：timeout 是请求预算，AbortSignal 表示业务主动取消；需要分别记录原因与重试策略。
4. 任何状态都自动重试：POST 409 常代表写入冲突，默认禁止；429/503 GET 应尊重 Retry-After 与总预算。
5. 响应类型使用 get<MySchema> 就不校验 JSON：必须在网络边界显式验证。
6. 不带请求身份写 UI：慢请求会覆盖快请求；abort 外再加 generation 保护。
7. 自定义 adapter 直接 resolve 409 后误称 Axios 默认 validateStatus 将拒绝：自定义 adapter 自己负责状态转换或调用正确 settle；本实验显式构造 AxiosError。

## 组合策略

Axios + TanStack Query：HTTP transport 不应拥有第二份可变 server-state 缓存；由 D07 QueryClient 管理 key、cancellation、invalidation。Axios + p-queue：服务端速率配额由队列和 Retry-After 处理，客户端拦截器不要叠多套无限重试。

## 可访问性、安全与验证

业务内容与错误必须以文本公布，不把 token 写到 URL 或 console；不将用户输入直接拼接不可信 URL。实例级 adapter 便于安全注入真实 API 和测试替身，但当前 fixture 并非外网。Node SDK 测试文件 tests/sdk.test.mjs 使用真实 Axios 包直接断言拦截器链、AxiosError 和取消；TypeScript、Vite、Chromium 未执行前为 NOT_RUN。

官方：https://axios-http.com/docs/interceptors · https://axios-http.com/docs/cancellation · https://github.com/axios/axios/releases/tag/v1.20.0
