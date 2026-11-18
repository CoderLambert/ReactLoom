# D15 Dexie 目录规则

上级 AGENTS 约束优先。仅操作演示随机数据库，禁止枚举/删除用户其它数据库。Dexie >=3 可省略无 upgrader 的旧 schema；保留旧客户端升级路径必需的 upgrader 所属版本。真实 SDK 调用位于 examples/feed-database.mjs，React 面板位于 examples/example.tsx；快照比较不能只看行数。verification 未有匹配收据保持 NOT_RUN；真实 Dexie + fake-indexeddb 是模拟 IndexedDB 后端的 SDK 验证，不是浏览器验收。
