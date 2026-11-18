# Workbox Build：把离线策略变成可检查的构建产物

一个新闻阅读站点希望预先缓存公开页面，并为匿名RSS请求配置网络优先策略。Workbox Build在Node构建期扫描文件、计算修订摘要并生成Service Worker脚本。浏览器是否安装、控制页面、命中缓存和离线可读，是后续独立的运行时问题。

本条只做前者：三个真实Node脚本在专用临时目录生成文件并打印结果。**不注册Service Worker，不提供页面执行按钮，不把产物复制到Lab站点根。** 页面展示源码和复现命令。这里的公开HTML和RSS地址均为fixture，没有真实网络请求、账号或服务器。

## 什么时候选它

需要构建期预缓存清单、常见运行时缓存策略，又不想手写整个SW时选择 `workbox-build@7.4.1`（MIT，Node >=20）。`generateSW`产生完整worker；需要自定义SW代码并注入清单时才选择另一个流程 `injectManifest`，本例未使用。

成本是多一套浏览器安装/等待/激活生命周期、CacheStorage版本与失效策略。结构化数据事务交给Dexie，React服务端状态交给Query；它们不能替代SW的资源缓存，也不应与SW无规则地各存一份私有响应。简单且范围很小的需求可评估手写Cache API。Workbox不能作为鉴权、数据库或唯一数据副本。

## 从文件到脚本的模型

[`workshop.mjs`](examples/workshop.mjs) 创建 `/tmp/reactloom-workbox-<随机值>/__library_lab_workbox__/`，写入三个公开fixture和一个 `private/tokens.js`（只有抛错语句，绝非真实令牌）。`getManifest`扫描html/js/css，返回带revision的URL清单；`generateSW`将相同范围和策略写进 `sw.js` 及配套 `workbox-<hash>.js`。文件内容改变会影响revision。

`globIgnores` 排除private目录、sw.js与Workbox运行时；`globFollow:false`不跟随链接；单文件512KiB上限。两次API的warnings都使脚本失败，清单必须包含index/app且不含private，生成计数必须与清单一致，worker不可为空。这些是示例自建验收，不是SDK替所有项目保证的安全策略。

`scope`输出为 `/__library_lab_workbox__/`，是本例的预定隔离路径和目录标记。**因为没有注册，它不代表浏览器已建立该scope。** `skipWaiting:false` / `clientsClaim:false`不构成权限或scope隔离；首次安装仍可正常激活，生成脚本还包含响应SKIP_WAITING消息的处理器。正确边界是根本不注册、不托管这些临时产物。

## 最小迁移与运行

在独立Node项目根执行 `pnpm add -D workbox-build@7.4.1`，package.json无需额外类型配置。复制 `workshop.mjs`、`cache-policy.mjs` 和需要的basic/business/advanced入口到 `examples/`。使用 `.mjs`，无需设置type:module，无env变量、React、CSS或浏览器权限。

在这个仓库中，cwd为 `/home/lambert/githubRepos/lambert/ReactLoom`：

```sh
node packages/library-lab/entries/D16-workbox/examples/basic.mjs
node packages/library-lab/entries/D16-workbox/examples/business.mjs
node packages/library-lab/entries/D16-workbox/examples/advanced.mjs
```

迁入独立项目后改成 `node examples/basic.mjs` 等路径。命令打印JSON再打印一行未注册说明，并非整份stdout都是JSON；机器读取应解析首个JSON对象，或直接导入 `runWorkshop()`。这里只导入Node API，没有任意命令执行服务。

默认 `runWorkshop('basic')` 在finally删除自己创建的临时根；三个CLI入口传入 `keepOutput:true`，保留产物供人工读取。读完后仅删除该次返回outputDirectory的上一级随机临时目录。不要广泛清理/tmp、清空浏览器缓存或注销别人的SW。keepOutput:true时失败也可能留下临时目录，按本次记录核对后清理；不用保留产物的自动化保持默认false。

## 三个真实构建实验

### 1. 基础：预缓存范围

运行basic，检查 `precacheUrls` 含app.js、index.html、offline.html三项，不含private/tokens.js，`precacheCount=3`，`fallback=null`，`registrationExecuted=false`。再打开输出目录的sw.js，看到三条带revision的precache记录。offline.html虽然在清单里，基础场景没有将它用作导航处理器。

本次实际输出预缓存fixture总字节为310；swBytes是生成worker单文件大小，不含配套runtime，也不是网络传输大小。完整输出与原始产物文本在 `validation/basic.log`、`validation/artifacts/basic/`，具体hash以该次文件为准。

### 2. 业务：生成一条匿名公开RSS规则

运行business，对照sw.js中 `NetworkFirst`、缓存名、2秒网络等待阈值、只缓存200和12条/3600秒限制。SDK实际生成的是浏览器将来使用的配置，Node没有打这个地址，也没有等待一次网络超时。

匹配函数在 [`cache-policy.mjs`](examples/cache-policy.mjs)，必须自包含，不能引用导入变量（生成器会把函数序列化到worker）。它要求HTTPS、精确origin `https://lab.example.test`、精确路径 `/__library_lab_workbox__/api/public/rss`、GET、credentials=omit，且不带Authorization、Cookie、Proxy-Authorization。查询参数可变，仍属于同一个端点；这不是整个URL白名单或服务器数据分级系统。默认same-origin凭据请求也不匹配。

NetworkFirst在网络失败或设定等待时间后尝试可用缓存；超时不保证中止在途网络。CacheableResponse过滤200，避免把401作为成功内容缓存，但是否公开仍须服务端规则确认。Expiration是条数/年龄约束，不是定时精确删除或业务数据失效协议。策略用例与实际生成分别保存，不能将纯匹配函数测试当成浏览器缓存命中。

### 3. 进阶：导航壳与private文件排除

运行advanced，结果多出 `fallback:"offline.html"`，sw.js包含 `NavigationRoute(createHandlerBoundToURL("offline.html"))`。这是给符合导航路由的请求返回预缓存壳的配置，**不是仅在网络断开时才返回该页面的NetworkOnly失败回退**。本例没有导航allowlist/denylist；private排除仅针对构建清单，不是导航授权规则。不要从文件排除推断“私有URL不会进入导航回退”。

没有注册时这些路由完全不运行。生产项目若需要鉴权导航、SPA路由白名单或真正的离线失败回退，需要单独设计并在隔离产品origin验证；本条不悄悄改变既有matcher范围来冒充完成。

## 错误、清理与验证边界

不存在的/不完整构建输入、扫描warnings、计数不一致或空worker均以异常失败，CLI非零退出。输入level只接受basic/business/advanced。生成失败不能视为“已有部分产物所以成功”。静态private目录排除只是教学防线，真实秘密不应进入公开构建目录。

`cleanupOutdatedCaches:true`生成的是浏览器激活期旧预缓存清理逻辑，不会在Node构建时清掉用户CacheStorage，也不会替你迁移所有运行时cacheName。新策略与旧缓存的兼容、等待更新提示、存储配额、第一次离线时缓存尚不存在等都需要产品自己的运行时验收。

在仓库根运行 `node --test packages/library-lab/entries/D16-workbox/tests/sdk.test.mjs` 验证实际生成；`cache-policy.test.mjs`是独立纯策略测试。本次三条CLI和Node测试均有原始日志、argv/cwd/退出码、产物摘要，见 `local-validation.md`。浏览器没有安装SW，没有做离线请求验收；网页命令展示和源码可读性也不能升级为离线SDK PASS。

## 官方资料

官方包级README固定到v7.4.1提交 [`62b9d8ba8eb3c1a2ab8aac9d84c90cda7865d6a3/packages/workbox-build/README.md`](https://github.com/GoogleChrome/workbox/blob/62b9d8ba8eb3c1a2ab8aac9d84c90cda7865d6a3/packages/workbox-build/README.md)，原始英文快照在官方README页签，匹配版本包目录没有官方中文README。另提供[Chrome官方中文文档入口](https://developer.chrome.com/docs/workbox?hl=zh-cn)；当前响应CSP的frame-ancestors不允许Lab跨源嵌入，官网页签使用明确限制说明和直达入口。
