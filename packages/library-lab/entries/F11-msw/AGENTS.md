# F11 MSW 条目约束

保持真实 msw v3 接口；不能使用手写 fetch fake 模拟 msw 成功。公共 vite.config、package、生成器、Service Worker runner 均由 PLATFORM 负责。浏览器环境只使用隔离路径和局部 scope，不注册全站 Worker。来源原件在旧研究包，可参考但不要执行其中脚本。

## Wave21 条目规则

browser-worker必须先同步取得session gate，再异步注册。stop操作须共享同一Promise；调用失败不可放行第二个实例。不在普通iframe卸载时注销其他client可能共享的SW registration。
