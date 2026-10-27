# Dexie 4.4.7 — 离线业务数据库、事务与升级

## 为什么选择 Dexie
IndexedDB 是浏览器结构化存储，不是 HTTP CacheStorage。NewsHub 的 RSS 订阅、阅读状态、离线队列需要稳定的对象 ID、索引、迁移及事务边界；Dexie 提供 Promise 风格的 IndexedDB 操作。Dexie Cloud 是独立可选商业服务，本示例不启用同步或登录。

## 安装与文件
```bash
pnpm add dexie@4.4.7
# Node SDK 测试环境专用，不进入生产运行包
pnpm add -D fake-indexeddb@6.2.6
```
实际运行：`examples/example.tsx`；业务节点测试：`tests/sdk.test.mjs`，使用 fake-indexeddb 模拟浏览器底层 IDB，但 Dexie 本身是真实库。

## 三层演示
**基础**：建立唯一业务 ID 主键 `&id` 和 `group` 索引，读取技术 RSS 列表。禁止以数组下标作为永久 ID。
**业务**：在单一 rw 事务内写新记录，再故意 `add` 已存在的 ID，观察 ConstraintError 是否导致整个事务回滚。对比初始与结束记录数，避免半成功造成状态污染。
**高级**：先用 v1 创建真实 IndexedDB，再关闭连接，重新按 v2 声明复合 `[group+updatedAt]` 索引，查询升级后仍保留的数据。实际产品不能删除旧版本声明，也不能混用多个连接同时抢升级。

## 生产落地
- 数据库名必须按应用/租户/场景隔离。演示每次创建独立随机名字，并且只删除**本次演示自己的**数据库；不能 `indexedDB.databases().forEach(delete)`。
- 唯一键和索引应在设计期确定。schema 变更通过递增 version 和 upgrade 明确迁移；大数据迁移需测试旧设备数据和重启中断。
- 跨 `await` 的事务语义需注意 IndexedDB 事务自动关闭：不要在 rw transaction 内等待不相关 HTTP Promise。网络在事务外执行，再用一次事务应用结果。
- 结构化本地记录不等于权限；显示与查询仍做用户/租户范围过滤，加密和用户退出清理需要独立威胁模型。
- QuotaExceededError、私密模式、浏览器不同存储策略必须有降级提示；不要默认无限配额。
- 对同一记录的多标签页并发写入要显式冲突/版本策略；Dexie 的事务并不自动解决服务端同步冲突。

## 常见反模式
1. **重建 schema 后删库重新建**：用户阅读标记丢失。必须连续版本升级并写 migration fixture。
2. **catch 了事务中的唯一约束错误仍假设原子失败**：内部捕获可能阻止 Dexie 对事务回滚，应在事务外捕获 rejection，并验证最终数据库状态。
3. **数据隔离只依靠 UI 过滤**：多租户共享数据库后可能暴露数据。主键/查询条件必须包含租户身份，权限由服务端验证。
4. **不释放连接**：旧页面持有数据库连接妨碍版本升级。页面/服务设计明确 close 时机。
5. **使用 fake-indexeddb 测试宣称 Chromium 支持**：模拟实现只能证明库/API 合同，Quota/多标签页/真实浏览器升级仍需独立测试。

## 练习与选型
为 NewsHub 增加离线已读标记的 v1→v2 迁移：定义固定旧库 fixture、验证数据不丢失、重复提交幂等、异常回滚与配额错误。与 Workbox/Query/CRDT 分开定义缓存、事务、协作的所有权。

## 当前验证与许可
Node SDK 真实 Dexie + fake-indexeddb 合约测试代码已编写，尚未安装或执行；Chromium 实际 IndexedDB/重启迁移 NOT_RUN。参见 verification.json。Dexie Core Apache-2.0；不启用 Cloud。

官方：https://dexie.org/docs/ / https://dexie.org/docs/Version/Version / https://github.com/dexie/Dexie.js

## 第十二批：验证整行事务回滚与场景切换

事务失败后的“数据未变化”应比较**稳定业务 ID、分组、时间戳、阅读状态**，而不是只比较行数；行数相同但 `read` 已变同样是数据损坏。`examples/rollback-policy.mjs` 是真实运行代码使用的纯比较逻辑，`tests/rollback-policy.test.mjs` 定向覆盖顺序变化、字段变更和等长替换。SDK 回归测试再用实际 Dexie 事务验证约束失败时整行记录恢复。

切换 `basic/business/advanced` 期间关闭前一临时连接、废弃异步 epoch；前一会话的 `finally` 仍负责删除它创建的数据库。删除失败不再静默报告“已清理”，保留名字供卸载时尽力重试。**Chromium 中的 IndexedDB versionchange、配额和删除阻塞仍未验证**，不得把纯比较测试视为数据库验收。
