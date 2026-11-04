# Workbox：隔离作用域内生成离线资源缓存

## 适用任务与非目标

适合 PWA 静态资源预缓存、离线回退以及 **已审查、无凭据、公开** 的 GET 资源缓存。本条目使用真实 workbox-build 7.4.1（MIT，Node.js >=20），但仅在 Node 临时目录生成 Service Worker；绝不在 Library Lab 主站注册 Worker，也不证明真实断网切换成功。它不是浏览器 IndexedDB、远端状态缓存或 React 状态容器。

## 安装与复现

在仓库根安装时由 PLATFORM 管理依赖及锁文件（不要在 CD worker 修改）：

~~~sh
pnpm --filter @reactloom/library-lab add -D workbox-build@7.4.1
pnpm --filter @reactloom/library-lab exec node entries/D16-workbox/examples/basic.mjs
pnpm --filter @reactloom/library-lab exec node entries/D16-workbox/examples/business.mjs
pnpm --filter @reactloom/library-lab exec node entries/D16-workbox/examples/advanced.mjs
pnpm --filter @reactloom/library-lab exec node --test entries/D16-workbox/tests/sdk.test.mjs
~~~

三个入口共同调用 examples/workshop.mjs 的真实 getManifest 和 generateSW。运行结果会报告 precacheUrls、precacheCount、precacheBytes、swBytes、generatedFiles、outputDirectory。实际数字依运行版本而定，本页不填写虚构值。CLI 保留产物供查看；定向测试会释放自己的临时目录。

## 三层实验

### 入门：静态文件预缓存

生成 index.html、app.js、offline.html 和仅供排除检查的 private/tokens.js。getManifest 校核 URL 列表，再调用 generateSW 输出 sw.js。globFollow:false 避免符号链接穿透；仅收录已审查的 HTML、JS、CSS，检查 private 路径没有进入 precache。

### 业务：公开 RSS API 的运行时缓存

基于真实 runtimeCaching 创建 NetworkFirst 规则：只对示例域名 lab.example.test 下 /__library_lab_workbox__/api/public/rss 的 GET 生效，maxEntries 12、maxAgeSeconds 3600、networkTimeoutSeconds 2，响应状态只准 200。这是配置层演示：**未进行真实网络请求，也未触发浏览器策略处理器**。生产应把域名改为经过授权的目标域名并复核 credentials、私有数据和多租户隔离。

### 进阶：离线导航回退与更新

使用 navigateFallback: offline.html、cleanupOutdatedCaches:true，但 skipWaiting:false 和 clientsClaim:false；需要应用显式决定更新时机，防止未保存表单被新版本抢占。导航 fallback URL 必须在隔离 scope 中。服务端要正确配置 Worker 脚本位置、允许的 scope、HTTP 缓存头及 HTTPS。

## 机制和边界

build 阶段：本地文件 → getManifest 内容哈希 → generateSW 生成服务工作线程文件；浏览器阶段：部署 → navigator.serviceWorker.register → install/activate/fetch → 运行时路由；二者不能混为一谈。

本 Demo 产物的预期部署目录是 /__library_lab_workbox__/，注册示意（**不要在本应用运行**）：

~~~js
await navigator.serviceWorker.register('/__library_lab_workbox__/sw.js', {
  scope: '/__library_lab_workbox__/',
});
~~~

实际 scope 由部署脚本位置、register 配置及 Service-Worker-Allowed 响应头限制决定，并非 generateSW 可以强制保障。要在另一 origin/隔离目录中进行真实浏览器验收；不能把同源 iframe 当不可信 Service Worker 的安全沙箱。

## 四种常见错误

1. **将 sw.js 放在根路径**：Worker 可能控制 Lab 主页及所有子路由。正确做法是独立 origin 或限定脚本路径及 scope；browser 验收证明主页不受控制。
2. **缓存私有 API**：NetworkFirst 或 CacheFirst 可能把令牌相关数据存入跨会话缓存。只匹配白名单公开 GET，并且默认不缓存有凭据响应或非 200 响应。
3. **忽视更新生命周期**：无条件 skipWaiting/clientsClaim 可能让旧文档被新代码控制。使用显式更新提示、缓存版本化和旧数据迁移规则。
4. **把清空所有 CacheStorage 当重置**：会影响同 origin 其他应用。只删除本 Worker 自己的 cacheName；演示 Node 构建本身不接触浏览器缓存。
5. **没有实际离线验收就标 PASS**：Node 只证明生成了产物，离线网络、激活、导航 fallback 与 Safari/Firefox 差异必须单独在浏览器执行。

## 与其他工具组合

Dexie 用于结构化离线数据的事务与索引；Workbox 用于网络响应缓存，所有权完全不同。配合 MSW 做场景测试时，必须避免两种 Service Worker 同时试图控制相同 scope；不要把 mock 响应的成功误认为 Workbox 真正完成网络策略。

## 验证要求

Node SDK：读取真实 Workbox 构建结果，校验 manifest、隐藏资源排除、sw.js 非空、规则白名单及更新选项。Browser：在隔离 origin 安装后查看 registration.scope、controller、CacheStorage 命名空间，断网导航和更新、卸载及不同租户登录。当前 sdk/build/browser = NOT_RUN；源码与测试文件存在不代表这些检查已经运行。

## 官方来源

- https://developer.chrome.com/docs/workbox/modules/workbox-build
- https://github.com/GoogleChrome/workbox
- https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register

## 第十三轮加固：避免缓存带凭据的公开 URL 响应

URL 是公开路径，不保证 **响应** 是公开数据。原先的正则只检测 URL，默认的 same-origin Request 即使携带 Cookie，也可能匹配并进入 CacheStorage。现在 `examples/cache-policy.mjs` 提供无外部闭包的 Workbox `RouteMatchCallback`（会被 generateSW 序列化至 SW），必须同时匹配精确 HTTPS origin/path、`GET`、`request.credentials === 'omit'`，并拒绝 Authorization/Cookie/Proxy-Authorization 请求头。默认 `same-origin` 和 `include` 一律绕过这个 runtime cache；客户端显式匿名 fetch 才满足规则，不能强改其他用户请求的凭据模式。

此规则只是一层构建策略保护，不会检查服务端业务是否误返回私有内容，也不替代发布前的数据分级、Cache-Control 策略或隔离 origin 验收。单独运行纯规则回归：`node --test entries/D16-workbox/tests/cache-policy.test.mjs`；仍须真实 Workbox SDK 构建验证生成器是否正确序列化回调，以及隔离浏览器的 credentials/cached-response 测试。
