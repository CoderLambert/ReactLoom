# D15 Dexie 工程接入

## 选择条件与真实边界

锁定 `dexie@4.4.7`，核心包 Apache-2.0，依据 [v4.4.7 LICENSE](https://github.com/dexie/Dexie.js/blob/v4.4.7/LICENSE)。适用于浏览器结构化本地数据的索引、短事务和版本迁移。网络同步、服务端权威、冲突合并、权限隔离与配额恢复属于应用设计，本例没有实现。

例子是离线 RSS fixture，不含真实账户数据、liveQuery、多标签协作或 Service Worker。不要由条目可挂载、源码检查或 Node 模拟环境推导浏览器通过。

## 先读这些实际源文件

- [feed-database.mjs](examples/feed-database.mjs) / [类型声明](examples/feed-database.d.mts)：schema、种子、索引查询、重复键事务、v2 upgrader；SDK 测试直接复用。
- [example.tsx](examples/example.tsx) / [workshop.css](examples/workshop.css)：React 操作、结果表、busy 与资源生命周期。
- [rollback-policy.mjs](examples/rollback-policy.mjs) / [类型声明](examples/rollback-policy.d.mts)：按 id 对齐，比较全部业务字段。
- [sdk.test.mjs](tests/sdk.test.mjs)：真实 Dexie + fake-indexeddb；[rollback-policy.test.mjs](tests/rollback-policy.test.mjs) 仅为策略测试。
- [guide.md](guide.md)：操作预期、机制和迁入步骤；`verification.json`：正式验收状态。

`demo.tsx` 仅重导出组件。业务迁移数据库模块时带上其声明与 dexie 依赖；若迁移整个界面，还需 CSS 和快照模块。不要复制 Lab 的随机库名与执行后删除作为持久业务数据策略。

## 保持的三个能力

1. **分组筛选与内存排序。** group 索引筛选，sortBy('updatedAt') 对读取到的数组排序，不要求 updatedAt 索引，也不自动组合两个索引。种子主键顺序与时间顺序不同，防止测试碰巧通过。见 [sortBy](https://dexie.org/docs/Collection/Collection.sortBy())。
2. **重复键导致整批回滚。** 事务先 put rss-d 再 add 重复 rss-a；Promise 拒绝必须传播到事务外的 catch。仅在内部日志后吞掉错误，之前的写入可能提交。事务期间 await 网络或 timer 等外部任务可能导致自动提交/失活；先完成外部工作再开短事务。见 [事务](https://dexie.org/docs/Dexie/Dexie.transaction())、[Best Practices](https://dexie.org/docs/Tutorial/Best-Practices)。
3. **真实 v1 → v2 与复合索引。** 同一随机库先由 v1 写入遗留行，关闭后以 v2 打开。upgrader 只补 read===undefined，保留 true；[group+updatedAt] 在技术分组 100–250 的闭区间内返回时间顺序。

## 版本规则

[官方设计](https://dexie.org/docs/Tutorial/Design) 的规则适用于 Dexie >=3：可以省略没有 upgrader 的旧 schema。本例 v2 工厂没有 version(1)，依旧能迁移已安装 v1。仍支持旧客户端时，保留它们升级路径必需的 upgrader 所属版本；未来 v3 不能直接删掉仍需执行的 v2 回填。

新数据库直接建立最新 schema，不执行 upgrade；已在最新版本的库再次打开也不重跑 upgrade。新写入默认值必须由写入代码/校验负责。schema 字符串只列主键和索引，不验证全部对象字段。

## 生命周期约束

- 初始化必须在 try 内，包括 randomUUID 与配置构造；失败也由 finally 释放 busy，提供可重试状态。缺少安全随机库名时失败，不使用固定共享库名兜底。
- epoch 在切换场景和卸载时变化；过期任务不能回写结果或状态。
- 连接使用后 close；finally 只删除这次运行生成的名字。失败的自有名字保留供卸载尽力重试。
- 删除范围只来自本例生成的名字；禁止枚举/批量删除同源数据库。进程被强制关闭时不能保证清理完成。

## 定向验收

从仓库根执行 `pnpm --filter @reactloom/library-lab test:sdk --entry=D15`。当前 suite 应证明：

- 无 updatedAt 索引时也能筛选并按时间排序；技术结果为 rss-b、rss-a，商业与空结果正确。
- 重复 add 以 ConstraintError 拒绝；rss-d 不留下，rss-a 与所有记录业务字段未变。
- 对照实验在事务内处理掉重复键错误时，之前的成功写入会提交。
- 省略无 upgrader 的 v1 仍能升级；行数保留，缺失 read→false，已有 true 保留；复合索引边界包含 100、250 并排除其他组/范围。
- 新建 v2 不运行 upgrader，重开已升级的 v2 不重跑；v1 跳到 v3 时保留的 v2 upgrader 仍执行。

浏览器另验三个表格结果、UUID 不可用后按钮恢复、失败后重试、切换/卸载与临时库清理。Node + fake-indexeddb 是真实 SDK 在模拟 IndexedDB 后端的执行证据，不是浏览器 PASS。

正式 sdk/build/browser 的状态依照项目 recorder、收据与输入指纹。定向本地命令通过但未记录匹配收据时，verification.json 仍为 NOT_RUN。
