# D15 Dexie — Agent 迁移合同

用途：浏览器 IndexedDB 有事务、schema版本/索引/离线业务数据；不应把 CacheStorage/TanStack Query/Dexie 当同一层。

## 源码复用
读 `examples/example.tsx` 中的 configure()、事务、v1→v2迁移；`examples/demo.tsx` 只是显示适配。生产时提取应用级 DB 服务、稳定表/主键与索引定义，绝不直接复用示例的随机库名和“执行完删除”策略。版本：dexie 4.4.7，Apache-2.0。

## 不得删除的语义
旧版本 stores() + 新版本 stores()/upgrade 都要留存，禁止对用户真实数据库做演示 delete。业务事务必须避免跨外部网络的 await；错误回滚应由 transaction promise reject 驱动。用户/租户隔离在业务主键和查询中体现；配额与跨标签页冲突需要真实边界设计。关闭不用的连接，防止 versionchange 阻塞。

## 反例
跨事务保存半数据；用数组索引作 ID；将 fake-indexeddb 单测说成真实浏览器；升级不保留旧 Schema；全站 indexedDB.clear/delete；秘密 token 明文随意持久化。

## 验证顺序
Node `node --test packages/library-lab/entries/D15-dexie/tests/sdk.test.mjs` 用真 Dexie + fake-indexeddb，检查唯一键/rollback/index 升级；浏览器需验证真实 IDB、页面刷新、配额/隐私模式与数据库清理。没跑过就 NOT_RUN，不能继承其他 project 的 PASS。

官方 https://dexie.org/docs/Version/Version 。

## 回滚与异步清理加固（第十二批）

复用 `examples/rollback-policy.mjs` 的整行比对：只比记录数无法证明事务已回滚。切换层级关闭旧连接并通过 epoch 阻止旧结果写入当前页面；每个临时库由创建它的异步任务负责 `close`/`Dexie.delete`。浏览器拒绝删除时必须提示而非谎称清空，不可把此示例“运行后删库”复制到真实用户数据。新增纯策略测试 `tests/rollback-policy.test.mjs` 与真实 Dexie 事务断言；前者 PASS 不意味着后者或 Chromium PASS。

迁移 fixture 至少包含 v1 允许但 v2 需要修正的旧行（缺失 `read`），同时断言 v2 查询保留 ID 并写入 `read:false`。仅 `verno===2` 或复合索引可查询不能证明真正发生字段迁移。
