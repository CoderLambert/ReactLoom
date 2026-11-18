# F11 MSW 工程复用指南

使用场景：客户端继续发真实请求，但开发/测试需要确定的响应和错误恢复。固定msw3.0.3；http/HttpResponse从msw/http，setupServer从msw/node，setupWorker从msw/browser。handler不自动启动拦截，Mock响应不证明后端系统正确。

## 读取与迁移

先读library.json、guide、handlers/routes/node-runner、verification。Node最小迁移仅需这三个.mjs文件及真实msw依赖；Node>=22.12。客户端按实际status/body处理200与422；503是HTTP错误，不是fetch传输拒绝，也没有自动重试。

Node配方basic/business/advanced分别GET200、POST422→200、一次503覆盖→canonical200。输出requests及真实request:match事件；finally resetHandlers+close。未匹配用onUnhandledFrame:error，fixture域名.invalid不应到达外网。真实服务需要改匹配URL契约，不能换成手写fetch伪造SDK。

## 当前浏览器宿主与历史文件

实际Lab面板使用公共runners/msw/main.mjs，独立4320 origin，UUID路径 /lab-runners/msw/sessions/<uuid>/；canonical handlers/routes来自本条目。scope选择受控页面，handler URL决定哪些请求被模拟；scope不是请求URL/跨origin白名单。

主控拥有runner/frame-session/脚本资产/公共测试。起停消息检查origin、source、protocol和session；stop中止本轮请求，await worker.stop并核对后只unregister本scope/script，收到ACK才确认清理。缺ACK保持未确认；不能全局清注册/存储。Service Worker stop本身不等于unregister，类型允许Promise<void>|void，统一await。

examples/browser-worker.mjs是旧固定scope参考，当前UI不导入，公共server不供应其固定脚本路径。保留同步session gate、真实受限流式脚本预检、精确scope/script校验、共享stop Promise与失败保留lease；不要把此文件当作当前UUID runner，或擅自把scope提升到根路径。当前prepare/server已检查并提供合法session资产，旧“环境仍BLOCKED”事实作废，安全约束继续有效。

## 验证断言

- Node basic得到文章42/固定标题，真实匹配事件方法和URL对应请求；business顺序422/200且INVALID_CODE→verified:true。
- advanced首请求503、第二次200；once覆盖消耗一次，reset移除运行时覆盖，独立配方不串状态。
- 策略：注册/脚本精确匹配；预检拒绝HTML、重定向、越界字节；会话门同步取得、成功stop才释放。fixture Response不是浏览器注册证据。
- 现有@F11浏览器覆盖三场景实际响应、主站无MSW controller、会话唯一scope、停止本注册消失、双会话离开只清自己。等待实际结果/ACK，不以固定sleep或iframe移除判定通过。

官方README固定v3.0.3提交3560a94e00ae2054ce0ea3aaad9fc6fb3892b6bf，英语原文无改写；官网unknown有完整响应头、没有Lab origin嵌入确认。局部日志在local-validation；正式sdk/build/browser继续按verification与收据协议，Node/政策不升级浏览器PASS。
