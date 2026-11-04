# D15 Dexie 目录规则

上级AGENTS约束优先。仅操作演示随机数据库，禁止枚举/删除用户其它数据库；v1→v2 升级必须保留旧 Schema，错误回滚不可虚构。实际 SDK 调用源码存放 examples/example.tsx，verification 未实测保持 NOT_RUN。fake-indexeddb 只模拟浏览器 IndexedDB，不是浏览器验收。
