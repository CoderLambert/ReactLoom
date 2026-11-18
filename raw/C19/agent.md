# C19 nuqs工程接入

适合可分享的短查询/分组/页码，不用于秘密、长草稿、接口错误或权限。真实nuqs2.10.1/MIT，TanStack Router上下文；5条RSS是本地fixture，无Query/HTTP/后端。先读guide/examples/verification，不用历史CI/策略冒充adapter/浏览器PASS。

迁移全部8源：example/demo、tanstack-adapter.tsx、query-contract.mjs/.d.mts、url-policy.mjs/.d.mts、styles.css。共享parser来自nuqs/server，UI实际useQueryStates使用同一对象/urlKeys；server入口并不表示本例有SSR。保留ll_c19_前缀、null清除/默认值、basic忽略group、名称清洗与安全页夹取。

三个目标：basic草稿显式应用/URL分享刷新/自有键清除；business query+group+page单次应用replace及空态恢复；advanced翻页push、应用replace、真实Back/Forward恢复、abc/99/2tail深链接、逻辑host数组/hash/390px/卸载。实际URL与SDK乐观状态分开展示，setter Promise结束不是网络保存或Router loader完成。

不可删：同一次应用调用级history replace，避免重置page继承push；SDK同批push优先，不是假设三个独立setter分别承诺不同history。parseAsInteger用parseInt，2tail→2、负数仍可解析；默认值不自动规范化URL，业务另sanitize/group白名单/范围夹取。保持80码点上限/控制字符清洗；不是鉴权/字素簇长度。

当前版本需本例兼容桥：nuqs2.10.1内置adapter把完整query放to，与Router1.170.42/Core1.171.35不匹配。公开custom provider读真实Router state并flatten数组，写href交其parseHref/parseSearch；不传全字符串search对象导致数字被JSON引号化。外层真实内置adapter保HistorySpy的Back/Forward/GO reset与unsubscribe；defaultOptions/processUrlSearchParams、state/hash/replace/resetScroll透传。unstable_AdapterContext仅type，不私有导入context/queue或补丁依赖。升级重验公开unstable接口。

Router可以把重复键规范化为JSON数组编码；保留逻辑值/顺序，不承诺原始query字节不变。只操作自有键，保留tab/example/外部参数。完整URL测试必须真实看page.url，不能以JSON/Promise替代。

IME组合只改草稿，不提交或被URL覆盖；Enter确认到keyup、Space/鼠标结束不吞后续Enter。onChange不trim。非组合Back同步草稿，组合未确认草稿需显式应用。alive/generation仅阻止本组件过期Promise回调写state，不是全局取消。卸载保留URL，丢未应用草稿；SDK拥有订阅/队列timer，不私有reset影响别人。

SDK6是实际共享nuqs/server parser/loader/serializer+业务夹取，不证明React/Router；policy6为原4规则与2组合协议。candidate21实际Chromium三目标及官方展示共4PASS，8运行源与该候选逐字节一致；旧组合3FAIL保留在维护记录，原业务断言没有放宽。OS IME/SSR/读屏/全局泄漏/独立迁入未验，formal三状态NOT_RUN。

官方固定47ng/nuqs@691a473226bba0ddb93bc3a1010c8fa4e777c45f/README.md，npm2.10.1 gitHead；源包manifest0.0.0-semantically-released如实保留。包目录无README/无匹配中文，根英文31845B/SHAde5eb7cbf51d0a8c0eecd79146a7e61e6dadfbd0132f3f26a73f91fa569d66eb与安装一致。官网实际GET200/rawHeaders无XFO/CSP但Lab-origin未测→unknown，不标allowed。未来取证全成功暂存replace、异常独立failed，重复头列表保留，不能用fixture伪造HTTP。

维护命令/cwd/exit/失败历史/六项见local-validation与validation。真实三case提案交root，公共router/依赖/锁/runner不由本条目改，不自行content_done。
