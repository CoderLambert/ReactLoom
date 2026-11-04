# MSW 3.0.3｜同一套 handler，Node 与隔离 Service Worker

Lab 锁定 `msw@3.0.3`（MIT）。它拦截的是本进程或本 Worker 作用域里的客户端请求，不是后端真的收到了这些调用。v2 的 `rest`、`setupWorker` 导入路径和 `worker.stop()` 不等待的写法不要抄过来。

`msw` 已经在根锁文件里。隔离运行器在 `127.0.0.1:4320`，应用在 `4319`。旧笔记「等 PLATFORM 把 msw 加进 lock」作废。浏览器状态仍是 NOT_RUN：没有写入 `docs/library-lab/evidence/runs/` 的收据。Actions 41779873259 里 `@F11` 通过，也不能手改成 PASS。

## Lab 当前示例

执行种类是 `node-ci`。页面可以展示命令；真正的浏览器拦截只从主站的隔离面板启动，不对着整站注册 Worker。

| 文件 | 作用 |
| --- | --- |
| `examples/handlers.mjs` | `http` / `HttpResponse`。文章 GET 200、验证码 POST 200 或 422、重试 GET 200 |
| `examples/routes.mjs` | Node 用 `https://library-lab.invalid/`；浏览器 scope 是 `/lab-runners/msw/` |
| `examples/node-runner.mjs` | `setupServer`，跑 basic / business / advanced，最后关闭 |
| `examples/browser-worker.mjs` | 预检脚本、精确 scope、`setupWorker().start()`，返回必须 await 的 stop |
| `examples/worker-script-preflight.mjs` | 脚本 URL 必须在 scope 内；只接受有界的 200、JavaScript、无重定向 |
| `examples/session-gate.mjs` | 同一时刻一个会话；stop 完成才释放 |
| `examples/registration-policy.mjs` | scope 和 script URL 要精确相等 |

Node 命令：

```bash
node packages/library-lab/entries/F11-msw/examples/node-runner.mjs
```

套件是 `tests/node-scenarios.test.mjs`。策略测试（预检、注册、会话门）不证明 Service Worker 已控制页面。

## 1. 它拦截什么

浏览器里，MSW 用作用域内的 Service Worker 挡住 **这个 scope 下的 fetch**。它看不到其它源，也看不到没经过这个 Worker 的请求。Node 里是 `setupServer` 替换了这个进程的网络栈，和浏览器不是同一条生命周期。

未匹配的请求：Node 示例把未处理策略收紧，避免悄悄打到真网络。不要在测试里请求生产收费接口「看看 handler 是否漏了」。

`worker.stop()` 在 v3 要 await。stop 不是 unregister。Lab 只注销这一次会话自己注册的脚本，不清理用户或其它标签已经存在的注册。

## 2. 三层场景

handler 工厂 `createHandlers(urls)` 是唯一的业务响应。不要在 React 组件里再写一套状态码。

### 基本

GET 文章返回 200 和 JSON：`{ id, title }`。标题是固定的教学字符串。

### 业务

POST 验证码。body 里的 `code === '123456'` 才 200 `{ verified: true }`。其它，包括非法 JSON，返回 422 和 `INVALID_CODE`。应用要把这显示成字段错误，而不是网络异常。

### 进阶

重试 GET。教学点是同一次测试里的隔离：前一个用例的 handler 覆盖不能留给后一个。`node-runner` 在每个场景后 reset。浏览器会话用自己的 scope，停的时候 await stop。

这些都不是「后端真的有这篇文章」。

## 3. 浏览器启动顺序

`startIsolatedWorker` 做的事，少一步都不行：

1. 同步拿走 session gate。拿不到就返回错误，不要等第一次 await 之后才占坑。
2. 计算这一会话的 scope。
3. `preflightScopedWorkerScript`：URL 严格落在 scope 里，再有界 fetch。拒绝 HTML、拒绝重定向、拒绝过大的 body。失败就返回错误，**不要**退回站点根上的 `/mockServiceWorker.js`。
4. `setupWorker(...handlers).start()`，script 和 scope 使用这一会话的地址。
5. 找到精确匹配的 registration，核对 script。再确认当前 frame 的 controller 就是这个脚本，并 `fetch` 一次 scope 内的文章。
6. 返回的 stop：await `worker.stop()`。只有这次新建的注册才尝试 unregister。

主应用入口禁止静态 import `browser-worker.mjs`。

## 4. 反例

### 反例 1：用假 fetch 冒充 MSW

手写 `globalThis.fetch = ...` 没有 handler 生命周期，也没有未处理请求的失败。测试要 import `msw/node` 或 `msw/browser`。

### 反例 2：v2 导入

`import { rest } from 'msw'` 在 v3 不是这条路径。用 `msw/http` 的 `http` 和 `HttpResponse`，Node 用 `msw/node` 的 `setupServer`，浏览器用 `msw/browser` 的 `setupWorker`。

### 反例 3：不 await stop

下一个测试开始时旧的 Worker 还在。`stop()` 的 Promise 必须进 `finally`。

### 反例 4：根 scope

把 Service Worker 注册到源的根上，会拦截整个 Lab，甚至别的标签。scope 保持 `/lab-runners/msw/sessions/<id>/` 这一类唯一前缀。已存在的同 scope 注册不要顺手 unregister，除非你能证明它就是这次会话创建的。

### 反例 5：只检查脚本 URL 字符串

预检要看响应：状态、MIME、不是 HTML、没有重定向、大小有上限。字符串里包含 `mockServiceWorker.js` 不能说明字节是 Worker 脚本。SPA 的 `index.html` 回退是常见的假脚本。

### 反例 6：浏览器去请求 `.invalid`

Node 的基址故意不可解析。浏览器必须用当前源上的 runner 路径。跨源假设「拦截已经生效」会得到失败的真网络，而不是 200。

### 反例 7：用 MSW 打真实收费 API

handler 应短接这些调用。漏掉的请求失败，而不是落到生产。不要把个人数据放进 fixture。

### 反例 8：一个标签的卸载注销了另一个标签

`worker.stop()` 停的是这个 client。普通卸载不要 unregister 可能被共享的 registration。多标签要用独立 origin 或各自的浏览器上下文来证明隔离。Lab 的两个端口是不同源；这不自动让同一源的两个标签安全。

### 反例 9：Node 通过就写浏览器 PASS

`setupServer` 不注册 Service Worker，也不看 CSP。

## 5. 组合

**TanStack Query / 本仓库 API client**：Query 看到的是 MSW 返回的 200 或 422。重试策略不要把 422 当成网络抖动。信号取消和 MSW 无关，取消测试仍要写。

**Orval**：生成的客户端用同一组路径。handler 的路径漂移会让生成代码和拦截对不上。这是契约测试，不是 MSW 自己的单测。

**Storybook**：可以装同一工厂。Story 的 play 不自动等于浏览器 Worker 已控制 iframe。

**Playwright**：`page.route` 是另一套拦截。不要把 Playwright 的 route 写成 MSW 已验证。`@F11` 用例通过之后，仍然用 `verify:record` 决定 verification.json。

## 6. 练习

1. Node 跑三个 level：200、422、再次 200，中间不能串数据。
2. 让预检拿到 `text/html`，确认 start 失败且没有注册根 Worker。
3. 打开隔离面板，停止会话，看 unregister 是否只针对这次的 script。缺 ACK 就记「清理未确认」，不要记通过。
4. 两个标签若共享 scope，不要声称已隔离，除非换了源或独立上下文。

## 7. 证据

策略测试可以在没有浏览器时运行。sdk 收据只来自允许的 `node-scenarios` 或 `sdk` 套件的真实日志。browser 收据只来自带 `@F11` 的 Playwright 命令被记录下来的那一次。仓库绿标不是其中任何一个。

## 8. 资料

- https://mswjs.io/docs/quick-start
- https://mswjs.io/docs/migrations/1.x-to-2.x （读它是为了知道哪些写法已经不能用；实现以 3.0.3 为准）
- https://mswjs.io/guides/integrations/vite
- https://mswjs.io/guides/integrations/browser
- https://github.com/mswjs/msw/releases/tag/v3.0.3

v1 到 v2 的迁移文档不是 v3 API 的全文。以 3.0.3 的 quick start 和本目录源码为准。
