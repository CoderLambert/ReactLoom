# Dexie：为离线 RSS 建立可查询、可回滚、可升级的本地表

RSS 阅读器要在断网时保留订阅与已读状态，还要支持“技术分组按更新时间排列”。把列表塞进 localStorage 很快会遇到整份读写、字段查询与批量更新一致性的问题。Dexie 为 IndexedDB 提供 Promise API、索引查询、事务和版本迁移，适合这些结构化本地数据。

本条目使用 `dexie@4.4.7`，核心包为 [Apache-2.0](https://github.com/dexie/Dexie.js/blob/v4.4.7/LICENSE)。演示直接调用 Dexie 与浏览器 IndexedDB；RSS 数据是固定 fixture，没有服务端、同步协议或 Dexie Cloud 服务。

## 先操作三个场景

| 场景 | 工程问题与操作 | 应观察的结果 |
| --- | --- | --- |
| 分组与排序 | 选择技术或商业，点击“查询分组” | 技术只有 rss-b、rss-a，时间为 100、200；商业只有 rss-c。表格显示已读值，原始数据可展开。 |
| 事务回滚 | 点击“触发重复键并检查回滚” | 捕获 ConstraintError；记录数 3 → 3；rss-d 没留下；前后所有业务字段相同。 |
| 版本迁移 | 点击“创建 v1，再升级到 v2” | 同一个库先存 v1 数据，再以 v2 打开。rss-legacy 的 read 从缺失变为 false，已有 rss-b.read=true 保留；复合索引返回 100、200、250 三行。 |

这些是验收预期，运行面板显示本次实际结果。每次按钮执行创建一个随机临时库，结束后只删除本次库。刷新不会保留演示业务数据。时间数字是演示刻度，用于让排序与边界一眼可见；生产可统一为毫秒时间戳。

## 数据如何经过 Dexie

一个 Dexie 实例代表一个数据库连接，`table('feeds')` 对应 IndexedDB object store。`stores()` 声明主键与索引，不是每行数据的完整字段校验。read 不在 schema 字符串中，仍然会被存储。

```ts
const db = new Dexie('rss-reader');
db.version(1).stores({ feeds: '&id,group,updatedAt' });
await db.open();
```

首项 id 是唯一主键；示例的 `&id` 写法保留了唯一性标记，主键本身就要求唯一。group 与 updatedAt 是独立索引。新增的 `[group+updatedAt]` 是按“分组、时间”依次比较的复合索引。

| 数据/状态 | 由谁管理 |
| --- | --- |
| 持久行、索引、事务提交 | IndexedDB；Dexie 提供调用与迁移接口 |
| 表格结果、按钮 busy、错误提示 | 示例 React 组件的一次运行状态 |
| 分组选择、已读默认值、快照比较 | 本例业务逻辑 |
| 网络重试、服务端权威、冲突合并 | 本例未实现，需要业务另行设计 |

## 场景一：筛选走索引，sortBy 排数组

实际实现位于 [feed-database.mjs](examples/feed-database.mjs)：

```ts
return table.where('group').equals(group).sortBy('updatedAt');
```

`where('group')` 使用 group 索引缩小候选范围；`sortBy('updatedAt')` 读取命中的记录，对得到的 JavaScript 数组排序。即使 updatedAt 没有索引，sortBy 仍然能工作。它不会自动组合 group 与 updatedAt 两个独立索引。[官方 sortBy 文档](https://dexie.org/docs/Collection/Collection.sortBy()) 明确区分它与按索引顺序读取的 orderBy。

种子的主键顺序是 rss-a、rss-b，时间分别为 200、100，所以结果必须变成 rss-b、rss-a。这能发现“只查到了分组，却根本没有排序”的实现。sdk 测试还移除了 updatedAt 索引，验证 sortBy 的实际边界。

小分组的内存排序很方便。命中数据很多时，要把所有候选放进数组再排序会增加内存与 CPU 成本。若需求固定为“某分组内按时间取一个范围”，考虑场景三的复合索引，并另外设计分页。

## 场景二：让失败离开事务，验证整批回滚

```ts
return db.transaction('rw', table, async () => {
  await table.put({ id: 'rss-d', group: '技术', updatedAt: 400, read: false });
  await table.add({ id: 'rss-a', group: '技术', updatedAt: 500, read: true });
});
```

`put` 可以插入或替换；`add` 在主键已存在时拒绝。本例先成功请求写入 rss-d，再故意重复添加 rss-a。`writeDuplicateBatch()` 把整个事务的 Promise 返回给组件，组件在事务外 catch：重复键失败会中止事务，前面的 rss-d 也不能留下。

页面同时显示两份表、错误名和完整快照比较。仅比较行数无法发现“原行被改了、总数没变”。[rollback-policy.mjs](examples/rollback-policy.mjs) 按稳定 id 对齐后比较 id、group、updatedAt、read；这是本例自己的验收逻辑。

两种常见错误会改变这个结论：

- 在事务内 catch 后只打印日志或返回成功，会把拒绝处理掉，事务可能提交之前的写入。确实需要整批撤销时，继续抛出错误或让它自然传播；SDK 测试包含“吞掉重复键错误后 rss-d 留下”的对照。
- 在事务里等待网络、setTimeout 等外部异步任务，期间没有 IndexedDB 请求，事务可能自动提交；之后再写会遇到失活/提前提交错误。`async` 回调不保证跨任意 await 存活。先完成外部工作，再开短事务。Dexie.waitFor 适用于经过评估的短异步操作，不应成为等待网络的默认做法。

这些行为见 [事务生命周期](https://dexie.org/docs/Dexie/Dexie.transaction()) 与 [错误捕获最佳实践](https://dexie.org/docs/Tutorial/Best-Practices)。

## 场景三：真的从 v1 打开到 v2

演示先用 v1 创建数据库，存入三条 fixture 和一条没有 read 的 rss-legacy，关闭旧连接，再对**同一个库名**声明 v2 并打开：

```ts
db.version(2)
  .stores({ feeds: '&id,group,updatedAt,[group+updatedAt]' })
  .upgrade((tx) =>
    tx.table('feeds').toCollection().modify((feed) => {
      if (feed.read === undefined) feed.read = false;
    }),
  );
```

upgrade 在现有旧库升级时回填缺失字段，条件检查保留已有 true。若浏览器原来没有这个数据库，Dexie 直接建立最新 schema，**不会调用 upgrade**。因此新写入记录的默认值仍要由写入路径或校验负责；不要把迁移函数当成每次写入的字段校验器。

在 Dexie **3 及以上版本**，会读取已经安装的 schema。没有 upgrader 的旧 v1 声明可以省略，本例 v2 工厂就只声明 version(2)。需要保留的是旧客户端升级路径仍会经过的 **upgrader 所属版本**：未来增加 v3 时，只要还支持从 v1 跳升，就要保留 v2 的这段数据回填。不要删掉必要 upgrader，也不要修改已发布的迁移语义。规则与新库行为见 [官方版本设计](https://dexie.org/docs/Tutorial/Design)。

v2 的实际查询是：

```ts
return table
  .where('[group+updatedAt]')
  .between(['技术', 100], ['技术', 250], true, true)
  .toArray();
```

复合键先比较 group，再比较 updatedAt。这里用同一分组的上下界，且显式包含两端，所以结果为 rss-b(100)、rss-a(200)、rss-legacy(250)，商业分组被排除，读取顺序已经是时间升序，无需再 sortBy。参考 [复合索引文档](https://dexie.org/docs/CompoundIndex)。

升级不是重新创建空库。测试同时核对记录数、遗留字段、已有 true、复合范围边界，以及已升级的库重新打开时不会再次运行 upgrader。升级失败也应作为打开失败处理，不能显示部分迁移成功。

## 迁入实际 React 项目

1. 安装与此示例一致的 `dexie@4.4.7`。带走 [feed-database.mjs](examples/feed-database.mjs) 及其 [类型声明](examples/feed-database.d.mts)，按业务修改主键、索引与升级路径。
2. 若迁移这个操作面板，再复制 [example.tsx](examples/example.tsx)、[workshop.css](examples/workshop.css) 与 [快照函数](examples/rollback-policy.mjs) / [声明](examples/rollback-policy.d.mts)。[demo.tsx](examples/demo.tsx) 只是 Lab 的重导出适配器，业务无需保留。
3. 为生产的持久库设计稳定的账户/租户命名和访问隔离。随机库名与执行后删除是 Lab 的临时资源策略，不能照搬为离线阅读器的持久化策略。同源隔离也不等于业务账户隔离。
4. 新记录在写入边界补齐 read 等默认值；支持旧客户端的数据版本保留相关 upgrader。`stores()` 不代替 Zod 等业务输入验证。
5. 把读取接入产品自己的状态/订阅边界；若使用 liveQuery，在卸载时取消订阅。这里采用显式点击与快照表格，没有接入 liveQuery、多标签同步或冲突恢复。

## 生命周期与失败恢复

随机库名生成、配置、打开、查询均在 try 内。环境缺少 IndexedDB、randomUUID 或 UUID 调用抛错时，finally 仍释放 busy，页面可重试；不会退回一个共用的固定库名。

运行令牌 epoch 在切换场景与卸载时变化，过期任务不能回写新界面。连接 close 后，运行自身的 finally 删除它的数据库。删除失败时保留已拥有的名字，卸载再尽力重试；浏览器进程突然退出不保证清理完成。

所有删除都来自本次生成并记录的库名集合。代码不枚举同源数据库，不清空其他演示或用户数据。清理失败会在状态句显示；生产恢复动作也应限定到当前账户拥有的资源。

## 如何验证与判断选型

- 需要结构化查询、主键约束、跨多次本地写入的一致性：Dexie 适合。
- 只是 HTTP 响应与静态资源离线缓存：看 Workbox；远程数据新鲜度与请求状态：看 TanStack Query；并发协作合并：看 Yjs。这些方案可以组合，仍须明确每份数据的权威来源与冲突策略。
- 配额不足、隐私模式、浏览器兼容、多标签版本阻塞与大规模迁移成本：需要用目标浏览器和真实数据额外验收，本例没有覆盖。

在仓库根执行 `pnpm --filter @reactloom/library-lab test:sdk --entry=D15`，会运行真实 Dexie 与 fake-indexeddb 的定向套件。它证明 Node 中该 IndexedDB 模拟实现下的 SDK 行为，**不能代表 Chromium 或其他浏览器 PASS**。`tests/rollback-policy.test.mjs` 仅验证本例的快照比较策略。

页面验收应分别运行三个场景，核对表格、失败提示、重试和切换时清理。正式 sdk/build/browser 状态遵守 `verification.json` 与项目收据协议；没有匹配收据时仍为 NOT_RUN。官方 README 与官网预览使用条目的独立官方资料入口，教学与上游原文分别维护。
