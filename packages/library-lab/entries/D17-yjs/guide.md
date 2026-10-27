# Yjs 13.6.33：CRDT 双副本与增量同步

## 它解决的真实问题
协作文档、离线批注、多人编辑同一工具节点时，多个客户端可能在离线期间分别修改内容。Yjs 提供可合并的共享数据类型与编码 update，不需要应用自己设计每一个冲突合并操作；**但它本身不是 WebSocket 服务器、用户权限、长期存储、文档版本审计或 presence 服务**。

## 安装与复现实例
```bash
pnpm add yjs@13.6.33
```
```ts
import * as Y from 'yjs';
const local = new Y.Doc();
local.getMap('feeds').set('source', {title:'官方RSS'});
const update = Y.encodeStateAsUpdate(local);
Y.applyUpdate(remote, update);
```
完整真实 Demo 在 `examples/example.tsx`，演示入口是 `examples/demo.tsx`，Node 实测契约位于 `tests/sdk.test.mjs`。

## 三层演练
**入门：**新建一个 `Y.Doc`、`Y.Map`，使用 `doc.transact` 在单事务中写入多项字段。**业务：**模拟两端断网后分别添加 RSS，再根据 state vector 提取双方增量，交换 `Uint8Array` 并 `applyUpdate`；展示两个文档合并后数据。**进阶：**两副本离线更改同一个 `meta.title`，交换更新后读取相同结果；展示**收敛**不等于符合业务“最后编辑者”偏好。

## 更新协议的关键事实
`encodeStateVector(doc)` 表示当前已知状态，`encodeStateAsUpdate(source, targetStateVector)` 提取目标未知的差量。网络真实传输时应对 update 长度、协作身份、文档 ID、速率和访问权限做保护；演示只在本地把双方 update 互传。一个未授权客户端的 CRDT update 不能因为“可合并”就变成可信数据。

默认使用 V1 update；V2 需要双方按协议约定一起使用，不能混合调用。不同 transport/provider 版本还需单独测试顺序、断线重连、快照压缩与 GC。

## 生产反例
1. **将 Yjs 当自动联网：**仅新建 Doc 并不发送内容；需要显式 provider/transport、安全认证与同步协议。
2. **将共享 Map 当数据库：**无持久化层则刷新会丢失；需要 IndexedDB 或服务端持久化，且要考虑配额和迁移。
3. **“收敛”误认为业务冲突胜负公平：**相同键并发写入的结果由 CRDT 决定；多人审核状态常需服务端仲裁。
4. **忽略内存生命周期：**每次打开页面创建 Doc，卸载不 destroy 和注销 listeners，会持有对象与订阅。
5. **不限制更新大小和共享权限：**任意服务端广播的 update 可能导致内存增长或泄露租户文档；必须以文档 ID/团队授权分区。

## 与其他技术如何组合
D15 Dexie 可以负责浏览器持久化与数据库迁移，但两者数据模型不同，不能把 CRDT 更新粗暴写成普通对象覆盖。D18 Comlink 用于把有界计算移动到 Worker，不能替代网络同步。E01 Tiptap/ E03 Lexical 等编辑器可以通过适配器协作，但绑定实现与许可需逐项审核。

## 验证策略
Node SDK 测试真实运行 Y.Doc、Y.Map、状态向量、二进制 update、并发同键收敛。还要单独补多浏览器网络乱序/断线与安全鉴权测试。本例不会声称已经完成实时协作服务器或大规模 CRDT 压测。

官方：
- https://docs.yjs.dev/api/y.doc
- https://docs.yjs.dev/api/document-updates
- https://github.com/yjs/yjs
- https://www.npmjs.com/package/yjs

MIT；本例输入全为本地原创 fixture。

## 第十三轮：乱序投递、重复回放和跨文档隔离

真实 SDK 的 `syncReplicas` 现在先从同步前的状态向量分别计算 A→B/B→A delta，再**逆序投递**，进阶按钮还会**再次投递同一份 update**。根据 Yjs V1 update 的结合律、交换律与幂等性，两个文档接收全部 update 后应收敛，但本示例未实现网络重传队列，也未覆盖 provider 协商。新 `examples/update-transport.mjs` 给本地二进制传输增加 `tenantId/documentId/format` 一致性与 64 KiB 上限，拒绝混租户、混文档和超大演示包；`Uint8Array` 仍交真实 `Y.applyUpdate` 处理。

**特别注意**：该本地 envelope 可以被不可信客户端伪造，不能充当身份认证或 ACL。上线时必须由服务器根据已认证连接绑定 tenant+document，并控制权限、更新速率、大小与持久化策略；敏感审批状态需业务层服务端裁决。纯无 SDK 回归命令：`node --test entries/D17-yjs/tests/update-transport.test.mjs`；真实 Yjs 乱序/重复集成断言在 `tests/sdk.test.mjs`，尚需实际安装执行。官方协议：https://docs.yjs.dev/api/document-updates 。
