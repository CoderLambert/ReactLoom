# D16 Workbox — 工程手册

## 适用

在 Node 里用 `workbox-build` 为隔离目录生成预缓存，并可选地描述一条公开 GET 的运行时策略。产物是临时文件。

不要用它给 Library Lab 主源安装 Service Worker。不要缓存带凭据的响应。不要把 CacheStorage 当成数据库或鉴权。

## 版本

`workbox-build@7.4.1`，MIT。示例没有安装 `workbox-window`、`workbox-precaching` 或 background sync 包。

生成选项里 `skipWaiting: false`，`clientsClaim: false`，`cacheId` 带 `isolated`。

## 迁移

从 [`examples/workshop.mjs`](examples/workshop.mjs) 带走 `workboxOptions` 和 `runWorkshop`。匹配函数来自 [`examples/cache-policy.mjs`](examples/cache-policy.mjs)。三个入口只负责选择 level。

生产构建若复用选项，输出目录仍不得是 Lab 应用的站点根。注册必须缺席。`registrationExecuted` 保持 false。

`matchPublicRssRequest` 继续自包含，不引用模块级变量。

## 不可删的清理

`keepOutput` 不是 true 时，`finally` 删除整个 `mkdtemp` 目录。入口为了展示传入 true，调用方仍不要把该目录注册进浏览器。

清单包含 `private/`、warnings 非空、或 `sw.js` 为空时抛错，不返回部分成功。

不要添加 `navigator.serviceWorker.register`。不要把 scope 改成 `/`。

## 反例

- 在 React 效果里注册 `/sw.js`。
- `skipWaiting: true` 且 `clientsClaim: true`。
- `urlPattern` 匹配整个 origin。
- 匹配函数闭合外部常量，导致生成后的 worker 引用失败。
- 缓存带 Cookie 或 Authorization 的 GET。
- 用忽略规则保管真正的秘密文件。
- 把 Query 失效当成 SW 缓存已更新。
- 在 SSR 里访问 `navigator.serviceWorker`。

## 测试断言

- 真实 `generateSW` 写出非空 worker，且不执行注册。
- 预缓存 URL 含 `index.html` 与 `app.js`，不含 `private/`。
- 运行时策略只描述匿名的精确公开路径。
- advanced 包含 `offline.html` 回退，私有目录仍排除。
- 错方法、错凭据、错路径、禁止头返回 false；不完整参数返回 false。
- `tests/sdk.test.mjs` 导入真实 `workbox-build`。无收据则 NOT_RUN。

## 真实限制

Node 生成不等于浏览器已安装 worker。没有更新弹窗，没有 Background Sync，没有离线往返。`NetworkFirst` 只出现在生成配置里，本进程没有拦截 `https://lab.example.test`。

临时目录在 `keepOutput` 时会留在系统 tmp。那不是部署物。

## 证据

sdk、build、browser 保持 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有匹配收据。Actions 41779873259 不是本条目的 SW 安装证明。不要改 `verification.json`。
