# D15 Dexie — 工程手册

## 适用

浏览器 IndexedDB 上的结构化本地表：索引查询、短事务、带版本的 schema。库名必须具体到这一次演示或这一个账户。

不要用它替代 Query 的失效策略、Workbox 的 HTTP 缓存或 Yjs 的合并。不要枚举或删除同源的其他数据库。

## 版本

`dexie@4.4.7`，MIT。v1 主键 `&id`，索引 `group` 和 `updatedAt`。v2 增加 `[group+updatedAt]`，并回填缺失的 `read`。

两段 `version()` 都要留在 `configure` 里。只声明 v2 会打断已经存在的 v1 库。

## 迁移

从 [`examples/example.tsx`](examples/example.tsx) 带走 `configure`、随机库名和 `finally` 里的 `Dexie.delete(name)`。比较函数来自 [`examples/rollback-policy.mjs`](examples/rollback-policy.mjs)。`demo.tsx` 只重导出。

生产库名不要用 `crypto.randomUUID()` 除非数据本来就是临时的。账户库在登出时删除该名字。

升级函数只补 `read === undefined` 的行。

## 不可删的清理

卸载和切换 `level` 时递增 `epoch`、`close()` 当前库，并尝试删除集合里记下的名字。删除失败则保留名字以便下次再试。

过期 `token` 不能 `setStatus` 或 `setOutput`。

`finally` 始终 `close`。不要在错误分支提前 return 而跳过删除。

禁止 `getDatabaseNames` 后批量删除。

## 反例

- 用行数判断事务已回滚。
- 升级代码删掉 `version(1)`。
- upgrade 把已有 `read: true` 写成 false。
- 清理时删除源上的每一个库。
- 固定库名跨登录会话复用。
- 在 `transaction` 里 `await fetch`。
- 复合索引未声明就 `where('[group+updatedAt]')`。
- 把 Query 缓存当成主键约束。

## 测试断言

- 真实 Dexie 按 `group` 查询并排序；重复主键使事务回滚。
- 回滚后的快照在 id、group、updatedAt、read 上一致，不能只看行数。
- v1 遗留行升级后保留，并带 `read: false`；复合索引可用。
- 迭代顺序不同但字段相同的两份数组视为相同快照。
- `tests/sdk.test.mjs` 使用真实 IndexedDB 实现（或测试环境提供的实现）。无收据则 NOT_RUN。fake-indexeddb 不是浏览器 PASS。

## 真实限制

种子只有三行。没有 `liveQuery`，没有多标签，没有配额测试。随机库在成功路径上会被删除，刷新页面不应留下业务数据。

若浏览器没有 `indexedDB`，示例只显示说明，不创建内存冒充。

## 证据

sdk、build、browser 保持 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有匹配收据。Actions 41779873259 不是本条目 PASS。不要改 `verification.json`。
