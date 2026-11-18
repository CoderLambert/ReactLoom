# D18 Comlink 维护规则

读上级AGENTS、library.json、agent.md与verification.json。使用真实Worker与Comlink4.4.2（Apache-2.0）。worker.ts仅expose，worker-api.ts由UI类型与真实Node Worker SDK共用；不得另造测试专用API。Map处理任意词键，校验稀疏数组与大小；业务校验不是Comlink内置能力。

每批独占资源，保留epoch、error/messageerror/5秒本地等待与finally清理。releaseProxy返回void，只能说明请求，不是ACK；请求失败仍terminate。回调proxy正常结束释放；取消不依赖协作式signal。浏览器验收在组件外观察实际Worker close/page.workers，不以组件消失或超时冒充物理终止。

源码展示列齐example.tsx/worker.ts/worker-api.ts/session-policy.mjs及声明；官方README保持固定版本原文字节。SDK/policy与浏览器状态分开，正式无匹配收据仍NOT_RUN。禁止共享宿主/依赖/锁/生成/e2e变更，交由主控。
