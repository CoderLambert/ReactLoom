# Dexie 4.4.7｜临时库、事务回滚和保留 v1 的升级

Lab 锁定 `dexie@4.4.7`（MIT）。它是 IndexedDB 的封装：版本化 schema、索引和事务。它不是同步协议，也不是“清空本站全部数据”的工具。Query 的内存缓存、Workbox 的 CacheStorage、Yjs 的 CRDT 各自有所有权。

没有匹配收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 是仓库级结果，不是本条目 PASS。`fake-indexeddb` 只模拟 API，不能充当浏览器收据。

## Lab 当前示例

[`examples/demo.tsx`](examples/demo.tsx) 重导出 [`examples/example.tsx`](examples/example.tsx)。每次执行用 `crypto.randomUUID()` 生成库名 `reactloom-lab-d15-...`。没有 `indexedDB` 时直接说明，不伪造结果。

v1 schema 是 `feeds: &id, group, updatedAt`。advanced 在关闭旧连接后用同一库名打开 v2：`&id, group, updatedAt, [group+updatedAt]`，并在 `upgrade` 里把缺少的 `read` 写成 `false`。旧的 `version(1)` 声明必须留在代码里，否则已有库无法从 1 走到 2。

- basic：写入三行种子，按 `group === 技术` 查询并 `sortBy('updatedAt')`。
- business：事务里先 `put` 新行，再 `add` 一个重复主键 `rss-a`。失败后用 [`examples/rollback-policy.mjs`](examples/rollback-policy.mjs) 的 `sameFeedSnapshot` 比较事务前后的全部业务字段。行数相同不够，`read` 或 `updatedAt` 变了就不算回滚成功。
- advanced：先在 v1 写入没有 `read` 的 `rss-legacy`，关闭，再按 v2 打开，用复合索引 `[group+updatedAt]` 取出技术分组。

`epoch` 在卸载和切换层级时增加。过期执行不能 `setOutput`。打开的库放在 ref 里，清理时 `close()`。`finally` 只 `Dexie.delete(name)` 删除这一次的库名，不枚举、不删除其他数据库。失败的删除把名字留在集合里，交给卸载重试。

没有挂载：`liveQuery`、跨标签同步、导出用户库、Service Worker。不要把这个按钮理解成离线同步已经完成。

## 什么时候用

浏览器里需要按字段查询的结构化本地数据：离线草稿、已读标记、可回滚的一批写入。表要有主键和版本计划。

只缓存 HTTP 响应时用 Workbox 的 CacheStorage（且不要注册到 Lab 主源）。协作合并用 Yjs。远程列表的新鲜度用 Query。把 Query 缓存整份序列化进 Dexie 之前，先定义谁是权威、冲突怎么处理。

## 模型

`new Dexie(name)` 之后声明 `version(n).stores({ table: schema })`。`&id` 是主键。`[group+updatedAt]` 是复合索引，查询必须使用声明过的形式。

升级函数在该版本第一次打开时运行。已经升到 2 的库不会重跑 v2 的 upgrade。所以回填逻辑要幂等。删除中间版本会导致旧客户端无法迁移。Lab 同时保留 version 1 和 2 的声明。

`transaction('rw', table, async () => { ... })` 里任何拒绝都会回滚该事务的写入。`add` 对已存在主键失败，前面的 `put` 也不留下。比较快照时按 id 排序后逐字段看，不要只比 `length`。

`bulkPut` 是批量写入，不是事务魔法。basic 在事务之外调用它。失败策略要自己定。

连接不用时 `close()`。删除用明确的库名。`Dexie.getDatabaseNames()` 一类枚举不要用在清理里，以免碰到用户或别的演示留下的库。

IndexedDB 按源隔离。这不能代替应用内的租户字段。同一源的两个用户若共用一个库名，会读到彼此的行。Lab 用随机库名避开残留，生产要用账户相关的库名，并在登出时只删那个名字。

## 三层示例

### 基本

点执行后输出技术分组的两行，按 `updatedAt` 100 然后 200。商业行不在结果里。状态句说明完成后会删库。

### 业务

输出里 `before` 和 `after` 行数相同，`rollback` 是错误名，`unchanged` 为真。若事务意外提交，`unchanged` 会是假，因为 `rss-d` 会留下或 `rss-a` 会被改写。

### 进阶

`dbVersion` 为 2。`rss-legacy` 的 `read` 被升级函数写成 false。复合索引查询能看到种子和遗留行。文案要求旧 schema 声明仍然留在 `configure` 里。

切换下拉层级会关掉连接并作废 epoch，旧的 `setOutput` 不再执行。

## 反例

### 反例 1：只比行数

```ts
const unchanged = before.length === after.length
```

重复主键失败前的 `put` 若被错误地提交，行数可能碰巧相同。

```ts
const unchanged = sameFeedSnapshot(before, after)
```

### 反例 2：升级时删掉 version(1)

```ts
db.version(2).stores({ feeds: newSchema })
```

已有 v1 数据的浏览器无法按 Dexie 的版本链升级。两个 `version` 调用都要留下。

### 反例 3：upgrade 里假设字段已存在

遗留行没有 `read`。用 `=== undefined` 再补默认值，不要把已有的 `true` 覆盖成 `false`。

### 反例 4：清理时枚举全部数据库

```ts
const names = await Dexie.getDatabaseNames()
await Promise.all(names.map(name => Dexie.delete(name)))
```

```ts
await Dexie.delete(name)
```

只删本次 `randomUUID` 那一个。

### 反例 5：把 IndexedDB 当多用户隔离

同一源下库名固定为 `feeds` 时，登出不删就会留给下一个人。随机名只适合演示。生产库名绑定账户，登出删除该名。

### 反例 6：在事务里发请求

事务存活期间不要 `await fetch`。锁会拖得很长，请求失败时回滚范围也不清楚。先请求，再开短事务写入。

### 反例 7：用 Query 缓存代替主键约束

内存数组的 `find` 不能阻止两个标签页同时 `add`。唯一性靠主键错误和事务。

## 组合

**Query**：服务器列表仍由 Query 失效。Dexie 只保存用户明确要留下的离线副本，并记录版本。不要在每次 `queryFn` 成功时无条件 `bulkPut` 整页而不处理删除。

**Workbox**：CacheStorage 放公开静态响应。结构化查询放 Dexie。不要在 Library Lab 主源注册 Service Worker 来“顺便”同步数据库。

**Yjs**：CRDT 更新是二进制增量。可以把更新体存进 Dexie，但合并仍要 `Y.applyUpdate`。用普通 JSON 覆盖行不是合并。

## 生产核对清单

1. 每次演示或每个账户有明确库名；清理只删那个名字。
2. 切换路由和卸载会 `close` 并作废在途 Promise。
3. schema 版本链完整，复合索引和查询字符串一致。
4. 事务失败用全字段快照断言，而不是行数。
5. upgrade 幂等，不覆盖已有业务值。
6. 事务内没有网络和超大循环。
7. 主键冲突的错误名被记录，而不是吞掉后显示成功。
8. 不调用会扫到其他库的删除 API。

## 升级

钉 `dexie@4.4.7`。从 3.x 升到 4.x 时重测 `version().upgrade` 和复合索引。应用 schema 从 v1 到 v2 时保留旧声明，并准备一条没有新字段的遗留行。

不要为了类型方便改主键。改主键等于新表加复制，而不是一次 `stores()` 字符串替换。

## 验收

- 技术分组按 `updatedAt` 排序，商业行不在 basic 结果里。
- 重复 `add` 使整个事务回滚，快照在 id、group、updatedAt、read 上相同。
- v2 打开后 `verno` 为 2，遗留行 `read === false`，复合索引能查到它。
- 卸载或换层级后旧调用不再写界面，并且只删除自己的库名。
- `tests/sdk.test.mjs` 打开真实 Dexie。无收据则 NOT_RUN。

练习：再加一个 v3，把 `group` 收成枚举，旧的自由字符串进入 `other`。断言已在 v2 的库只跑一次 v3 upgrade。

## 资料

- https://dexie.org/docs/
- https://dexie.org/docs/Version/Version
- https://dexie.org/docs/Tutorial/Design
- https://dexie.org/docs/Tutorial/Best-Practices
- https://dexie.org/docs/CompoundIndex
- https://github.com/dexie/Dexie.js
