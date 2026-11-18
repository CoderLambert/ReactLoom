# D16 Workbox Build 可迁移说明

## 选型与版本

`workbox-build@7.4.1`，MIT，Node>=20。构建期生成预缓存和常见SW路由时适用；复杂自定义SW另评估injectManifest；数据库用Dexie、客户端远端缓存用Query。不要把Workbox当成权限或唯一持久化。

## 最小迁移

独立Node项目根 `pnpm add -D workbox-build@7.4.1`。复制 `examples/workshop.mjs`、`cache-policy.mjs` 和需要的basic/business/advanced.mjs。`.mjs`无需type:module，无env/React/Provider/样式配置。仓库根命令为 `node packages/library-lab/entries/D16-workbox/examples/<level>.mjs`；迁入项目为 `node examples/<level>.mjs`。

runWorkshop在mkdtemp目录生成fixture、getManifest清单、generateSW脚本与runtime。CLI输出JSON后另有英文说明，解析首个JSON对象或直接调用模块。scope字段仅是声明/目录前缀，没有实际browser registration。

## 三实验与不可删边界

basic检查三条revision清单且private缺席；business增加匿名精确RSS端点的NetworkFirst/200过滤/12条/1小时/2秒等待配置；advanced增加NavigationRoute指向预缓存offline.html。本例navigateFallback不是仅网络失败才回退，且没有导航allowlist/denylist；globIgnores排除private文件不能当作导航访问控制。

matcher必须自包含，不闭合导入变量；要求HTTPS、固定origin+pathname、GET、credentials omit、无Authorization/Cookie/Proxy-Authorization，查询字符串允许变化。不能扩大到整个origin。

严禁在Lab origin或根scope注册，严禁把临时产物复制到Lab public/root，不新造执行宿主。skipWaiting:false、clientsClaim:false不是scope安全保证，首次安装或消息触发仍有生命周期行为；真正边界是没有注册。

保留globFollow:false、512KiB大小上限、private/sw/runtime排除；warnings、空worker、清单/生成计数不同均失败。private fixture只有抛错语句，不能换成真令牌。

## 清理和错误

默认keepOutput:false在finally删除本次随机根；CLI展示用true，读完后核对并只删除此次outputDirectory上级的reactloom-workbox-*目录。true时失败也可能留目录；不要扫描删除其他任务的目录。不得清空浏览器缓存或注销他人SW。

Node异常应保留非零退出与原始错误。generateSW只写文件，不做网络请求；NetworkFirst不意味着HTTP已测试；cleanupOutdatedCaches不意味着Node删除了浏览器CacheStorage。它也不会清理所有命名运行时缓存。

## 检查与来源

三条声明CLI已经实际运行，输出与*.txt原始产物在validation；tests/sdk.test.mjs实际调用workbox-build并检查生成，cache-policy.test.mjs独立为纯策略，不能混算。浏览器只可验Lab命令/源码展示，绝不可注册此条SW。离线、安装/激活、缓存更新均未运行，正式receipt维持NOT_RUN。

官方原文是GoogleChrome/workbox提交62b9d8ba8eb3c1a2ab8aac9d84c90cda7865d6a3下packages/workbox-build/README.md；包级固定版本无官方中文原文，采用英文快照。Chrome中文官网CSP禁止Lab嵌入，按blocked直达。摘要、响应头与路径见official/source-evidence.json/library.json；本地六维与命令记录见local-validation.md。
