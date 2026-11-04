# Workbox 7.4.1｜只在临时目录生成 Service Worker

Lab 只锁定 `workbox-build@7.4.1`（MIT）。三条示例都是 Node 脚本：[`examples/basic.mjs`](examples/basic.mjs)、[`examples/business.mjs`](examples/business.mjs)、[`examples/advanced.mjs`](examples/advanced.mjs)。它们调用 [`examples/workshop.mjs`](examples/workshop.mjs) 的 `runWorkshop`。

这些脚本用 `workbox-build` 的 `getManifest` 和 `generateSW` 在操作系统临时目录里写文件。返回值里 `registrationExecuted` 固定是 `false`。入口脚本打印：产物留在专用临时目录，没有注册 Service Worker。

不要在 Library Lab 的页面、布局或主源上调用 `navigator.serviceWorker.register`。不要把生成的 `sw.js` 拷进应用的站点根，也不要使用 `/` 作为 scope。隔离范围常量是 `/__library_lab_workbox__/`。`skipWaiting` 和 `clientsClaim` 都是 `false`，因此即便有人误把文件注册到别处，它也不会自己接管已打开的客户端。本条目的正确做法仍是根本不注册。

没有匹配收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 是仓库级结果，不是本条目 PASS。仓库级 Playwright 没有把这个临时 Service Worker 安装到 Lab 源。

## Lab 当前示例

`runWorkshop` 用 `mkdtemp` 得到 `reactloom-workbox-` 前缀的目录，站点文件写在它下面的隔离路径里。内容是教学用的 `index.html`、`app.js`、`offline.html`，以及 `private/tokens.js`。`globIgnores` 排除 `private/**`、`sw.js` 和 `workbox-*.js`。清单若包含 `private/` 会抛错。单文件上限 512 KiB。`globFollow` 为 false，不跟随链接。

`getManifest` 的 warnings 或 `generateSW` 的 warnings 都会使本次失败。生成后的文件数必须和清单条数一致，`sw.js` 不能是空文件。

- basic：只有预缓存，`runtimeStrategy` 为 `precache-only`。没有 `runtimeCaching`。
- business：增加一条运行时规则。`urlPattern` 是 [`examples/cache-policy.mjs`](examples/cache-policy.mjs) 的 `matchPublicRssRequest`。方法只允许 GET，`credentials` 必须是 `omit`，协议 `https:`，origin 必须是 `https://lab.example.test`，路径必须恰好是 `/__library_lab_workbox__/api/public/rss`。带 `authorization`、`cookie` 或 `proxy-authorization` 的请求不匹配。策略名是 `NetworkFirst`，只缓存状态 200，最多 12 条，最多 1 小时，网络超时 2 秒。缓存名 `rl-workbox-public-rss-v1`。
- advanced：在上述规则之外设置 `navigateFallback: 'offline.html'`。私有文件仍不进预缓存。

默认 `keepOutput: false` 时，`finally` 递归删除临时目录。三个入口为了打印结果传入 `keepOutput: true`，目录留在本机临时路径，仍然没有 `register()`。

没有挂载：`workbox-window`、`injectManifest`、Background Sync、页面上的“立即更新”按钮。`library.json` 没有钉那些运行时包。生产若要它们，单独评审，并且 scope 不能是 Lab 主应用。

## 什么时候用

需要在构建期得到带修订版本的预缓存清单，或给公开 GET 写运行时缓存策略时，用 `workbox-build`。离线可用还要求浏览器真的安装了 Service Worker 并且用户留下了缓存。只运行本示例不会让 Lab 离线打开。

不要用 Workbox 做授权、不要缓存带 Cookie 的 HTML、不要把唯一副本只放在 CacheStorage、不要在 SSR 里访问 `navigator.serviceWorker`。结构化记录用 Dexie。服务端状态用 Query。极小的缓存需求可以手写 Cache API，避免无范围的生成器。

## 模型

`generateSW` 根据选项写出完整的 `sw.js`。`self.__WB_MANIFEST` 那类注入点属于 `injectManifest` 流程；Lab 没有手写 SW 源文件，所以用的是生成器而不是注入。

预缓存清单是文件内容的修订版本，不是运行时再去拉一份 JSON 配置。`private/tokens.js` 被忽略，是为了证明排除规则，不是为了把秘密放进仓库再指望忽略总能生效。秘密不该出现在会被扫描的目录里。

`matchPublicRssRequest` 会被序列化进生成的 worker。它不能闭合外部变量。匹配函数自己接收 `{ url, request }`。缺字段时返回 false，而不是抛到安装阶段。

`NetworkFirst` 会先试网络。超时或失败才看缓存。这不保证数据新鲜，只保证弱网时可能看到上一次的 200。`cacheableResponse.statuses: [200]` 避免把 401 页面缓存下来。

`navigateFallback` 只在 advanced 写入。它影响导航请求的兜底文档，不是 API 的 JSON 兜底。不要把带身份的导航缓存进这份 fallback。

`cleanupOutdatedCaches: true` 让新的生成结果清掉自己的旧预缓存。`cacheId` 固定为 `reactloom-library-workbox-isolated`，避免和别的应用缓存名混用。

## 三层示例

### 基本

运行 `basic.mjs`。结果 JSON 里 `precacheUrls` 含 `index.html` 和 `app.js`，不含 `private/`。`fallback` 为 null。`registrationExecuted` 为 false。控制台最后一行说明没有注册。

### 业务

同样生成预缓存，并带上公开 GET 的 NetworkFirst 配置。用策略函数对错 origin、错路径、带 Cookie 的请求做单元断言。生成器不会在 Node 里真正拦截那些 URL。

### 进阶

多一个离线导航回退文件名 `offline.html`。私有脚本仍被拒绝。若 warnings 非空，脚本抛错而不是带着警告退出 0。

## 反例

### 反例 1：在 Lab 源注册

```ts
await navigator.serviceWorker.register('/sw.js')
```

这会让主应用进入 Service Worker 控制，刷新和缓存都会缠在一起。

```ts
const result = await runWorkshop('basic')
// result.registrationExecuted === false
```

### 反例 2：skipWaiting 加 clientsClaim

```js
skipWaiting: true
clientsClaim: true
```

新的 worker 会立刻接管已打开的页面。Lab 两样都是 false，并且仍然不注册。

### 反例 3：缓存所有同源 GET

```js
urlPattern: ({ url }) => url.origin === self.location.origin
```

账户接口和静态页会被一起放进 CacheStorage。

```js
urlPattern: matchPublicRssRequest
```

路径、方法、凭据和禁止头都要同时成立。

### 反例 4：匹配函数引用外部常量

生成器序列化函数时看不到模块里的 `ORIGIN`。把字面量写在函数体内，像现在的 `https://lab.example.test`。

### 反例 5：用 Workbox 做登录墙

Cache API 不验证用户。公开 RSS 必须在放进构建目录之前已经去掉秘密。`private/` 排除是演示，不是权限系统。

### 反例 6：把 Query 数据只放进运行时缓存

失效和租户键属于 Query。SW 缓存没有那些键。两边同时存会看到旧列表。

## 组合

**Dexie**：公开响应可以缓存。需要按 id 查询和事务的数据放 IndexedDB。不要在 SW 里打开用户的 Dexie 库名并删库。

**MSW**：开发时的模拟 Service Worker 和这份生成物不是同一个注册。不要在开着 MSW 的源上再注册 Workbox。Lab 的 F11 运行器有自己的范围，本条目不加入那个注册。

**Query**：内存里的服务端状态不是 offline 文档。若产品要离线读文章，先定义公开文档的 URL，再生成清单。

## 生产核对清单

1. 代码路径上不存在 `serviceWorker.register`。
2. scope 若将来使用，是 `/__library_lab_workbox__/` 这一隔离前缀，不是 `/`。
3. `skipWaiting` 与 `clientsClaim` 保持 false，直到产品有单独的更新提示。
4. 预缓存忽略私有目录，清单断言不含 `private/`。
5. 运行时规则只匹配匿名 GET，并且拒绝 Authorization 和 Cookie。
6. 只缓存 200，有条数和时长上限。
7. warnings 让构建失败。
8. 临时目录在不需要留存时删除；留存的目录仍在 `tmpdir`，不在应用 `public/`。

`globPatterns` 只包含 html、js、css。图片若要进预缓存，必须先确认它们是公开的，并仍然受 512 KiB 上限约束。SVG 和 HTML 不要作为可执行页面被另外托管；生成器写出的是脚本文本，不是第二套站点。

`mode: 'production'` 让生成的 worker 走压缩构建。调试时不要为了可读日志把这个值改掉后又提交。`sourcemap: false` 避免把源路径写进临时脚本。

`matchPublicRssRequest` 要求 `request.headers.has` 存在。不完整的测试桩若缺少 headers，应返回 false，而不是抛错中断安装。单元测试覆盖了这种输入。

NetworkFirst 的 `networkTimeoutSeconds: 2` 只在浏览器真正跑 worker 时生效。Node 脚本不会等待两秒去打 `lab.example.test`。不要把生成耗时当成这个超时。

## 升级

钉 `workbox-build@7.4.1`。7.4 的发布说明主要是构建链维护，不要假设出现了新的运行时 API。若要 `workbox-window` 或 background sync，先把包写进条目自己的依赖评审，而不是在指南里假装已经安装。

从 `injectManifest` 教程迁到本示例时，删掉手写 `clientsClaim()` 和 `SKIP_WAITING` 消息。那些属于另一条更新协议。

`index.html` 的标题是隔离工坊，正文是公开离线文档。它不是 Lab 的首页。`app.js` 只设置一个 dataset 标记，没有 `register` 调用。读生成后的 `sw.js` 时可以确认字符串里没有 Lab 的源站主机名。

`private/tokens.js` 的内容是一句会抛错的脚本。它若出现在清单里，测试失败。不要把它改成真实令牌来“看得更真”。排除规则失败时，真实令牌会进预缓存。

三个入口都传 `keepOutput: true`。在本机反复运行会留下多个 tmp 目录。这是脚本的展示行为，不是服务。自动化若改成 `keepOutput: false`，仍应断言返回的计数字段，而不是去读已删除的路径。

`cleanupOutdatedCaches` 只在生成的脚本被浏览器激活后才有意义。Node 侧的一次 `generateSW` 不会去删用户浏览器里的旧 CacheStorage。不要在脚本跑完后声称本机缓存已被清空。

## 验收

- 三个入口都打印未注册，`registrationExecuted` 为 false。
- 清单含公开 html/js，不含 `private/tokens.js`。
- 策略函数拒绝非 GET、非 omit、错 origin、错路径、带禁止头的请求；缺字段返回 false。
- advanced 的结果写明 `offline.html`，basic 的 fallback 为 null。
- 空的 `sw.js` 或 warnings 会抛错。
- `tests/sdk.test.mjs` 调用真实 `workbox-build`。无收据则 NOT_RUN。浏览器项保持 NOT_RUN，因为没有在 Lab 源安装 worker。

## 生命周期和更新

Service Worker 的安装、等待和激活是浏览器的状态机。`generateSW` 只产生脚本。脚本要生效，还必须被某个页面注册，并且 scope 覆盖该页面。本条目在这三步里只做第一步的文件生成，而且文件在临时目录。

新的 worker 默认停在 waiting，直到旧页面都关掉。`skipWaiting` 会让它离开 waiting。`clientsClaim` 会让它立即控制已经打开的页。两者都是 false，是为了即使文件被错误复制，也不会自动接管 Lab。正确的防护仍然是代码里没有 `register`。

更新提示若在别的产品里存在，应使用 `workbox-window` 监听 waiting，由用户确认后再 `postMessage`。那个包没有钉在本条目。不要从旧教程复制 `clientsClaim()` 到一个尚未评审的手写 SW。

预缓存在 install 时拉取清单里的 URL。那些 URL 是相对生成时的目录的。把 `sw.js` 拿到另一个主机上，清单会指向错误的资源。因此不要把临时目录的产物当成可以部署到 Lab 源的构建结果。

运行时缓存和预缓存是两套 CacheStorage 名字。`cleanupOutdatedCaches` 清理的是这个 `cacheId` 下过期的预缓存，不会自动删掉 `rl-workbox-public-rss-v1` 里的旧 GET。改缓存策略时要换 `cacheName` 或在激活时删除旧名。Lab 不执行激活，所以这条只作为以后接到真实注册时的清单。

`maximumFileSizeToCacheInBytes` 是 512 KiB。更大的教学文件会被排除或警告。警告在本脚本里是失败。不要为了让大图通过而把上限调到几十兆，那会在真正安装时占满存储配额。

`cacheId` 和运行时 `cacheName` 是不同字符串。改其中一个不会迁移另一个里的响应。将来若真的在隔离 scope 下注册，发版说明要写清旧缓存名是否删除。

`globDirectory` 指向临时站点而不是仓库的 `packages/library-lab`。这样生成器不会把 Lab 的应用脚本打进预缓存。保持这个路径来自 `mkdtemp`。

入口脚本的最后一行是给人读的说明，机器可读的字段仍是 JSON 里的 `registrationExecuted`。解析输出时用 JSON，不要靠中文或英文句子做断言。

`offline.html` 在 basic 也被写进目录，但只有 advanced 把它设为 `navigateFallback`。文件在磁盘上不等于它已是导航兜底。结果字段 `fallback` 才是合同。

`ISOLATED_SCOPE` 以斜线开头和结尾。拼到临时目录时用 `slice(1)`，避免绝对路径跑到文件系统根上。改这个常量时同时改策略函数里的路径字面量。两边不一致会让预缓存范围和运行时规则描述的不是同一前缀。

生成文件名列表用 `path.basename`。不要把临时目录的绝对路径写进返回 JSON，以免日志带上本机用户名。`outputDirectory` 仅在 `keepOutput` 时保留。

## 资料

- https://developer.chrome.com/docs/workbox/modules/workbox-build
- https://developer.chrome.com/docs/workbox/modules/workbox-precaching
- https://developer.chrome.com/docs/workbox/modules/workbox-strategies
- https://developer.chrome.com/docs/workbox/service-worker-lifecycle
- https://github.com/GoogleChrome/workbox
- https://github.com/GoogleChrome/workbox/releases/tag/v7.4.1
- https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register
