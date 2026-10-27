# F11 · MSW：让业务场景可重复，而不是在组件里伪造接口

## 用途与选型

Mock Service Worker 在网络层拦截实际请求。React、Fetch、Axios、TanStack Query 无需为了测试而使用另一套业务 API。适合验证码、订单提交、错误回填、延迟、断网及权限异常的 **Scenario Matrix**。MSW 不是实际后端，不代替契约校验、网络环境验证或生产后端集成测试。

本条目采用 `msw@3.0.3`（MIT，2026-10-10 发布）。与历史 MSW v2 的关键差异：ESM-only、Node ≥22、TS ≥5.9，推荐 `http` / `HttpResponse` 从 `msw/http` 导入，Node 从 `msw/node` 导入；v3 `worker.stop()` 异步返回 Promise，务必等待。不要照搬 v2 `onUnhandledRequest` 配置到新 API；本案例使用 v3 的 `onUnhandledFrame`。实际版本还需以新安装的锁文件核验。

## 安装与可复现入口

```sh
pnpm add -D msw@3.0.3
# 需先由 PLATFORM 安装并提交锁文件
cd packages/library-lab
node entries/F11-msw/examples/node-runner.mjs basic
node entries/F11-msw/examples/node-runner.mjs business
node entries/F11-msw/examples/node-runner.mjs advanced
```

文件职责：
- `examples/handlers.mjs`：定义独立于 UI 的请求处理器与固定假数据。
- `examples/node-runner.mjs`：Node 实际 intercept fetch、执行断言并输出 JSON；**不是假的网页终端**。
- `examples/browser-worker.mjs`：供 PLATFORM 独立 iframe runner 接入，默认不在站点上运行。

当前 DemoHost 对 `node-ci` 的展示是复现命令和真实源码；页面不会悄悄运行 shell。没有执行这些命令之前，`sdk` 一律 NOT_RUN。

## 三层示例

### 基础：读取文章

`http.get` 匹配固定文章 URL，真实 `fetch` 得到 status 200 和 JSON。固定 `library-lab.invalid` 域名，拦截处理时应没有任何网络对外请求。若路由不匹配，`onUnhandledFrame: 'error'` 使测试失败，而不是静默调用外网。

### 业务：短信验证码成功/失败

对同一 `POST /api/verify` 发送正确和错误代码：分别返回 200 或 422，错误响应具有业务码 `INVALID_CODE`。这些验证码完全是虚构 fixture，不关联真实短信服务。页面组件应把 422 显示为字段错误，并允许重试；不要在提交按钮旁硬编码“失败”来模拟 API。

### 进阶：临时故障与恢复

通过 `server.use` 增加临时 handler，第一轮返回 503，第二轮返回 200；断言请求次数与状态，执行完成 `resetHandlers`，finally 调用 `server.close`，避免测试间污染。若后续添加超时、取消，要明确传递 AbortSignal，而不是只更改 UI 文案。

## 浏览器 Worker、作用域与安全

MSW 浏览器使用 Service Worker。Worker script 必须真正存在并能通过同源 HTTPS/localhost 访问；同源默认并不等于安全隔离。当前 Library Lab 的首页在根路径，绝不能直接把全站 root scope 授权给示例。浏览器 runner 约定页面位于 `/lab-runners/msw/`，worker 也位于该路径，并指定 `scope: '/lab-runners/msw/'`。注册后用 `navigator.serviceWorker.getRegistration()` 核对 scope，切换场景需显式 `worker.stop()`；**stop 不等于 unregister**，需要 runner 生命周期管理注册清理策略。

MSW v3 在 Vite 提供 `msw/vite` 插件与 `virtual:msw`，但官方明确开发态 plugin 不生成生产 worker。Library Lab 若要部署正式在线 Demo，必须由 PLATFORM 为隔离 runner 配置受控 worker script、静态路径和生命周期；不能简单地在全站 vite.config.ts 打开 plugin 后宣称生产可运行。

不要把真实生产 OAuth、密钥、个人数据、收费 API 或未受信任代码接到 Mock 演示里。Mock URL 与真实环境严格隔离。

## 项目级最佳实践

业务代码只依赖正常 HTTP 客户端；场景集合集中在 `handlers.mjs`；测试统一 reset handlers。场景矩阵覆盖成功、错误、过期、连续错误、延迟及取消，并在用例中断言业务结果。MSW 不验证后端真正返回此数据；契约和实后端接口变更还需要 API/Schema 检查和 smoke test。测试 React 组件时区分 `msw/node` 进程拦截和浏览器 `msw/browser` Worker 拦截，不能以 Node PASS 替代浏览器 Worker PASS。

## 常见反例

1. 组件根据状态直接返回假响应：跳过网络层、API Adapter 和实际错误流程。应使用 MSW 拦截真实请求。
2. 生产入口无条件注册全局 Service Worker：污染用户请求，难清理。应隔离 origin/scope 且只允许实验资源。
3. 测试更换 handler 后不重置：场景互相污染，顺序影响结果。每次测试后 reset，全部测试后 close。
4. 把没有执行的 CLI 脚本截图当执行报告：只记录真实 stdout、exit code 与锁文件哈希。
5. 用 MSW Mock 自身 API 后声称目标 SDK 通过：目标验证必须使用真实 msw package。

## 关联

F12 Vitest 适合断言 Node handler 场景；F13 Playwright 用来验证浏览器实际 fetch、UI 错误和 Service Worker scope。与 Playwright 的 page.route 方案是不同注入层，需在测试计划中明确。

## 当前结果

当前仅完成真实 API 的源码与复现脚本，依赖、Node SDK 与 browser scope 尚未运行；`verification.json` 保持 NOT_RUN/BLOCKED。平台任务拥有依赖安装与 iframe/Service Worker runner 的建设权。

## 独立浏览器场景 URL 修正（本批）

旧版本固定使用 `https://library-lab.invalid/api/...`，这只适用于 Node 拦截；隔离浏览器 iframe 直接 fetch 到该域名会涉及跨域/CORS/未匹配预检，不能据此验证本地 Worker。现在 `examples/routes.mjs` 的 `scenarioEndpoints(base)` 由同一规则生成两种地址：Node 仍用 `.invalid`，浏览器从 `location.origin + /lab-runners/msw/` 生成同源 scoped API。`handlers.mjs` 的 `createHandlers(urls)` 复用同一真实 MSW handler，避免两套业务假数据漂移。

`examples/browser-worker.mjs` 拒绝顶层页面和非 scoped 入口，启动后对 registration 的 scope 及 scriptURL 做精确断言。`worker.stop()` 是停止监听，不是注销注册；真正的隔离 iframe、worker 脚本、注册卸载策略和 Chromium 截获验证仍由 PLATFORM 承担。纯 `node --test tests/routes.test.mjs` 只检查 URL 合同，**不构成 MSW SDK/Service Worker PASS**。

## 浏览器真实截获证明与回收（第12轮）

`registration-policy.mjs`验证严格scope和精确scriptURL，不能把根scope的Service Worker当成本runner注册。browser-worker启动前拒绝外来注册；成功后除了检查注册，还要验证当前frame controller实际为预期脚本，并真实`fetch` scoped article断言响应，否则失败及清理。stop会await MSW v3异步stop；只有当前会话新建的注册才尝试unregister，不私自注销已有注册。此防护**仍假设runner独占该scope**；同源多tab并发启动时需要PLATFORM独立origin或跨标签协调，否则不可声称完全隔离。

PLATFORM必须接入真实iframe/同源mockServiceWorker.js，使用Chromium检查`worker-src`、`script-src`、MIME、frame-ancestors、控制权、反复启动/停止和页面关闭后注册残留。纯`node --test entries/F11-msw/examples/registration-policy.test.mjs`仅检查Scope策略，不等于msw SDK/浏览器PASS。
