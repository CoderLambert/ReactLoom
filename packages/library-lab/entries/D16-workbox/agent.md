# D16 Workbox — Agent 实施指引

## 何时选用

只在需求明确包括可靠的静态文件预缓存、公开资源离线或 PWA 导航 fallback 时引入 Workbox。动态多租户记录适合 Dexie/后端；纯远端状态应先考虑 TanStack Query。固定评估目标 workbox-build 7.4.1（MIT），Node >=20；以安装时真实依赖、锁文件和官方文档再核对。

## 可迁移源码

- examples/workshop.mjs：generateSW/getManifest 配置、临时隔离构建、manifest 安全断言、输出及清理。
- examples/basic.mjs：静态预缓存入口。
- examples/business.mjs：仅针对公开 GET 的 NetworkFirst 白名单。
- examples/advanced.mjs：离线 fallback 和更新策略。
- tests/sdk.test.mjs：真实 SDK 构建断言，不是 Mock。

主站的 node-ci 展示页面不是可运行终端。工程迁移时抽取配置函数，替换自己的真实静态构建目录/独立 worker 输出目录，不复制演示 tmp fixture 为生产资产。

## 不可删除的边界

1. Service Worker 只由明确的独立 origin / 固定子路径负责；不要让 Lab 根目录或共享 origin 被默认 scope 接管。
2. 缓存公开 GET，必须限定 method、origin、pathname、响应状态和 TTL；不可缓存用户授权或敏感数据。
3. globFollow:false、private 目录排除和最大文件体积阈值；不得预缓存源码映射中的密钥、账户或隐私内容。
4. skipWaiting:false / clientsClaim:false，更新要由前端明确确认；清理仅本应用命名空间。
5. Node 生成行为、浏览器控制与离线行为分项取证；新构建指纹变化，旧证据无效。

## 典型错误

直接在根 /sw.js 注册；通配 .* 缓存所有服务端路径；随意删所有 CacheStorage；将工作线程注册当作普通 React useEffect 副作用、卸载时未处理所有权；以 Node 生成成功宣称浏览器离线 PASS。

## 复现与验证

~~~sh
pnpm --filter @reactloom/library-lab exec node entries/D16-workbox/examples/advanced.mjs
pnpm --filter @reactloom/library-lab exec node --test entries/D16-workbox/tests/sdk.test.mjs
~~~

核验生成结果包含 index.html/app.js、没有 private/tokens.js，sw.js 非空；业务路由不匹配其他 origin / 私有 URL。浏览器另建隔离部署，实际断网、重新上线、版本更新并核对 root 页面不受控制。未执行前 verification.json 不得写 PASS。

## 依赖交接

PLATFORM 独占 package/lock/CI 和正式 Service Worker runner；需加入 devDependency workbox-build@7.4.1、定向 Node CLI recipe、隔离 origin E2E。不能从此条目要求 CD worker 修改公共文件。

## 官方资料

https://developer.chrome.com/docs/workbox/modules/workbox-build

## 新增不可删除的匿名缓存边界

三层源码通过 `examples/cache-policy.mjs` 的 `matchPublicRssRequest` 精确匹配公开 RSS。必须保留 `credentials: 'omit'`、HTTPS origin/path 白名单、GET 与敏感请求头拒绝；正则仅靠 URL 匹配不足以避免认证数据缓存。Workbox 的 `urlPattern` 序列化函数不得捕获模块级变量或 React 对象。按 `tests/cache-policy.test.mjs` 运行纯策略断言后，还需要目标 Workbox 7.4.1 真正生成 sw.js 的 SDK 测试，浏览器验证缓存/隔离；不能将纯策略测试算 SDK PASS。
