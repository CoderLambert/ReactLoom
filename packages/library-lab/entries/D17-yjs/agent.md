# D17 Yjs — Agent 协作实现指南

适用于可接受**最终收敛**的富文本/白板/离线协作数据；需要强事务、支付、ACL 或“最后审批结果”时，仍应由有权限的服务端确认。

## 移植入口
读取 `examples/example.tsx` 的 `syncReplicas` 了解 state vector + V1 update；教程同时展示一对 Y.Doc 的生命周期。生产应用应把 Doc 按 tenant/documentId 实例化，明确 Owner；组件离开时 detach observers，确实不再被使用才 `destroy`，不能误毁共享 Doc。

## 不可漏的生产边界
`Y.Doc` 不是 provider，不提供登录、权限或持久化。使用远端 update 必须校验请求者文档权限、payload 字节大小和存储额度。V1/V2 更新编码需要双方版本协商；不要混用。并发同键胜者不等于业务最新时间戳，不要覆盖人工审批结果。

## 测试
直接运行 `node --test entries/D17-yjs/tests/sdk.test.mjs`，断言双端独立修改合并、相同键最终收敛、增量重复应用不会造成分歧；再测浏览器卸载、网络乱序、断网恢复、协作权限。当前sdk/build/browser仍 NOT_RUN，绝不因为 CRDT 理论保证就记 PASS。

关联：D15 Dexie 浏览器存储、D18 Comlink Worker、E01 Tiptap 富文本。官方 https://docs.yjs.dev/ 。
