# D17 Yjs

编辑前读根和本目录 AGENTS、agent.md、verification.json。仅使用独立本地内存 Doc，禁止连接生产协作服务。测试与源码必须一致；未运行的协议/权限/浏览器测试不得标PASS。共享 Doc 的销毁所有权需要明确。

UI 和 SDK 测试共用 examples/runtime.ts；不要另写 exchange helper 冒充该源码运行。保留每源副本捕获的真实本地 update 逆序投递路径，不能只重复一份全量更新就宣称依赖乱序。标题只断言两边相等，不预设业务赢家。destroy 先解绑自有 listener/清队列，再销毁自有双Doc，幂等且拒绝后续操作。信封检查不解码内容，不能承诺损坏字节下的双Doc原子回滚。浏览器定位限定示例 region，避免源码查看器同文本造成误命中。
