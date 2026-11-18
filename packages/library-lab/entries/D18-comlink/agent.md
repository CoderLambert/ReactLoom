# D18 Comlink — 工程迁移指南

适用于把纯计算移至模块Worker并组织RPC、buffer转移和少量代理回调；不是线程池、HTTP限流器、授权或持久队列。`comlink@4.4.2`是Apache-2.0，使用wrap/expose/transfer/proxy/releaseProxy。不要从旧说明复制MIT。

## 完整迁入

已有React/TypeScript浏览器宿主运行 `pnpm add comlink@4.4.2`。复制examples/example.tsx、worker.ts、worker-api.ts、session-policy.mjs/.d.mts；demo.tsx只是Lab转发可省。TypeScript使用支持ES模块/import.meta的打包器解析（如module ESNext、moduleResolution Bundler、jsx react-jsx、DOM库）。Vite可识别静态 `new Worker(new URL('./worker.ts', import.meta.url), {type:'module'})`；不要运行时拼URL。无CSS、服务地址、账号或Lab内部模块要求。部署需模块Worker支持和同源worker-src权限，不为示例全局放开CSP。

主线程的Remote类型来自worker-api.ts，worker.ts只expose真实api。测试通过Node Worker adapter导入同一api，而不是测试专用实现。Node套件需要>=22.18原生TS擦除；浏览器产物需另测，Node通过不证明浏览器通过。

## 场景与边界

basic是可输入的字符串词频，使用Map再返回行数组；__proto__/constructor/toString是普通数据。最多10000项、每项最多200个UTF16单元（不是码点），空串允许；Array.from使稀疏项也受校验。校验发生在Worker接收之后，生产仍需发送前的规模/内存预算。

business发送非法数字项，真实远端TypeError返回主线程；修正开关再运行成功。UI每批新建Worker，SDK额外证明同一个端点拒绝后可用。它不是4000条同一示例改名。

advanced实际transfer使主线程bytes.byteLength为0，sum75；proxy回调共10步，Worker逐步await确认。在正常完成/失败的finally释放收到的回调proxy；强制结束不等待远端协作。最多20步，sumBytes上限1MiB。90ms间隔是可观察fixture，不是CPU/帧率测量。

## 不能删的生命周期

每批独占worker/remote/controller。session先移出ref再dispose；启动期间ref存在则拒绝重复启动。成功/失败/取消/卸载都请求release并terminate；同步release抛错也不跳过terminate。4.4.2 releaseProxy公开返回void，不能await确认；立即terminate可能中断对端RELEASE处理。界面仅报告请求和terminate调用，不称ACK。

主线程AbortController没有自动跨线程传递。取消以物理终止为边界；Promise.race让主线程等待结算，不能声称远端挂起Promise已resolve。5秒本地超时防止无expose端点无限等待；error/messageerror失败通道与超时在finally释放。epoch必须在启动/取消/卸载递增，回调/结果检查其仍当前，旧finally不能dispose新worker。

## 反例与验证

禁止主线程伪造词频、裸函数参数、转移后复用buffer、Record={}处理通用键、只release不terminate、把取消写成业务成功、把超时本身当线程关闭证据。不要把Promise.resolve(releaseProxy())包装成释放ACK，SDK无此公开保证。

SDK断言必须通过真实Comlink和Node Worker运行共享API：危险键正确、远端拒绝后端点恢复、buffer分离和回调顺序。业务界限/清理失败是policy测试，单列。浏览器还须观察真正模块Worker成功、取消、卸载/切Tab后的close与page.workers，而不只组件消失；提供validation/browser.spec.ts给主控。没有网络/WASM/SharedArrayBuffer/线程池或协作式取消。

正式verification sdk/build/browser保持NOT_RUN直到匹配收据；本地日志与六项内容复核在local-validation.md，不从历史CI继承PASS。
