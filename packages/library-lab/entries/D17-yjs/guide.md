# Yjs 13.6.33｜两份内存文档、状态向量和信封校验

Lab 锁定 `yjs@13.6.33`（MIT）。示例创建两份 `Y.Doc`，用 `Y.Map` 和 `transact` 做本地编辑，用状态向量交换增量。没有网络、没有持久化、没有登录、没有 awareness。合并是 CRDT 收敛，不是“后写的业务标题获胜”。

没有匹配收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 是仓库级结果，不是本条目 PASS。

## Lab 当前示例

[`examples/demo.tsx`](examples/demo.tsx) 重导出 [`examples/example.tsx`](examples/example.tsx)。effect 新建 `left` 和 `right`，卸载时两份都 `destroy()`，并把 ref 清空。不要在卸载之后继续 `transact`。

`demoScope` 固定为 `{ tenantId: 'demo-only-tenant', documentId: 'rss-shared-map' }`。`syncReplicas` 在应用任一份更新之前，先用对方的 `Y.encodeStateVector` 算出增量：`encodeStateAsUpdate(left, vectorOfRight)` 与反向的一份。这样模拟的是已经离线Divergence 之后的延迟投递。

两份增量先经过 [`examples/update-transport.mjs`](examples/update-transport.mjs) 的 `validateYjsEnvelope`。格式必须是 `yjs-v1`，租户和文档 id 必须与期望值完全一致，正文必须是长度 1 到 64 KiB 的 `Uint8Array`。通过后才 `Y.applyUpdate`。函数返回原始字节，不检查 CRDT 内容，也不证明发送者身份。注释写明生产需要服务端 ACL。

`replay: true` 时再把同一份更新应用一次。重复投递应保持收敛。应用顺序在函数里是先左后右，用来说明乱序仍能合并。

- basic：只在 A 上 `transact` 写入 `feeds`。B 的按钮不出现，也不同步。
- business：B 也可以离线添加，再交换增量。两边的 map 都应含有双方的键。
- advanced：两边对 `meta.title` 各写各的，然后同步。界面不预设哪一个字符串是赢家。再点「乱序+重复投递」走 replay。

本地事务的 origin 字符串是 `demo-local`，同步是 `demo-sync` / `demo-replay`。这只是调试标记。

没有挂载：y-websocket、y-indexeddb、Awareness、权限光标。那些协议不在 `library.json` 里。

## 什么时候用

多端都可能离线改同一份文档，并且需要自动收敛时用 Yjs。单人本地撤销用 Immer 的 inverse。权威在服务器的表单用请求和版本号。普通 JSON 覆盖不是合并。

Yjs 不决定业务上的“最新标题”。同一键的并发写入会按 CRDT 规则收敛到一个值，这个值不一定是墙钟更晚的那次。Lab 的文案要求把这一点说出来。

## 模型

`Y.Doc` 是一份副本。`getMap('feeds')` 在两边使用相同的名字才是同一份共享类型。`transact` 把多次 `set` 收成一个事务。事务结束前其他副本看不到这些更新。

增量不是整份 JSON。`encodeStateVector` 描述这份文档已经有的状态，`encodeStateAsUpdate(doc, vector)` 生成对方缺少的字节。先快照两边的向量，再编码，避免编码过程中又插入本地编辑导致算错差异。Lab 在同步按钮里同步完成，没有并发输入，但顺序仍然按这个写法。

`applyUpdate` 是幂等的：同一份更新再来一次，文档状态不变。所以 replay 用来演示重复投递。它不能用来检测“是否恶意重复”，只说明状态不会因此分叉。

信封是应用层的最小边界：租户、文档 id、协议名、字节长度。64 KiB 是演示上限，防止把巨大 payload 推进内存文档。它不验证签名，也不解码后检查键是否允许。错误信封会抛错，界面把消息写进状态句，不调用 `applyUpdate`。

`destroy()` 之后文档不能再用。组件的清理函数负责两份文档。若把 Doc 交给模块级变量，下一次挂载会泄漏上一对。

不同 `documentId` 的更新即使字节合法也不能应用到当前 Doc。测试覆盖这种不匹配不会改目标文档。

## 三层示例

### 基本

点「A 添加 RSS」。A 的预览出现 `left-n`。B 的面板在这一层不渲染。日志写明另一副本尚未更新。刷新页面会丢掉两份 Doc，因为没有持久化。

### 业务

先在 A 和 B 各添加一条，再交换。两边 JSON 都应包含 `left-*` 和 `right-*`。字节数显示在状态句里，那是这次增量的 `byteLength`，不是性能基准。

### 进阶

先写两个标题再同步。同步后两边的 `meta.title` 字符串相同，但指南和界面都不宣称它等于某一方的输入。重复投递后仍然相同。若信封被改坏，状态句是「已拒绝合并」，文档保持原样。

## 反例

### 反例 1：用 JSON 覆盖当同步

```ts
right.getMap('feeds').clear()
for (const [key, value] of Object.entries(left.getMap('feeds').toJSON())) {
  right.getMap('feeds').set(key, value)
}
```

B 在断开期间写的键会被清掉。

```ts
Y.applyUpdate(right, Y.encodeStateAsUpdate(left, Y.encodeStateVector(right)))
```

双方都要带上自己的增量。

### 反例 2：编码时不去读对方向量

`encodeStateAsUpdate(left)` 不带向量会得到更大的全量状态。可以工作，但不是“只传差异”，也会把已经应用过的历史再送一遍。Lab 始终传入对方向量。

### 反例 3：不校验就 applyUpdate

```ts
Y.applyUpdate(left, remoteBytes)
```

跨租户或超长字节会进文档。先 `validateYjsEnvelope`。

### 反例 4：把收敛结果当成最后写入获胜

```ts
expect(title).toBe('B 的标题')
```

测试只应断言两边相等，以及各自独有的 feed 键都在。赢家交给 Yjs，不写死在 Demo 里。

### 反例 5：卸载后不 destroy

切换层级或离开页面时，旧 Doc 仍留在内存里。effect 的清理函数必须 `destroy` 左右两份。

### 反例 6：用信封代替 ACL

64 KiB 和固定 tenant 只能挡住误操作和演示里的串文档。生产要在服务器上鉴权、限制房间成员，并考虑更新签名。客户端校验可以被改掉。

### 反例 7：把 Y.Map 的 JSON 存进 Dexie 当唯一副本

那是快照，不是增量日志。崩溃后另一端的并发编辑无法再合并。若要持久化，存更新字节或使用专门的 provider，并仍走 `applyUpdate`。

## 组合

**Dexie**：可以把通过信封的 `Uint8Array` 按文档 id 存下来。读取时创建 Doc 再逐条应用。不要把 `toJSON()` 当成同步协议。登出时删的是该账户的库，不是源上的全部库。

**Comlink**：重计算可以在 Worker 里进行，但 Y.Doc 本身不要随便结构化克隆。传更新字节，在 Worker 内 `applyUpdate`。Lab 的同步在主线程，没有 Worker。

**编辑器绑定**：Tiptap 等适配器要核对 Yjs 主版本和绑定包的版本。本条目没有装编辑器。文档所有权仍是房间和服务器的事。

## 生产核对清单

1. 交换前读取两边的状态向量，再编码。
2. `applyUpdate` 之前做租户、文档 id、协议和长度检查。
3. 重复投递被测试覆盖，断言状态不变。
4. 同一键冲突的测试不断言某一个业务字符串必胜。
5. 卸载 `destroy` 每一份 Doc。
6. 不把令牌放进 Map。
7. 64 KiB 只是演示上限；生产上限与鉴权分开设计。
8. 持久化保存的是更新或经过证明的快照流程，不是单方 JSON 覆盖。

`getMap('feeds').toJSON()` 得到普通对象，适合放进 React state。不要把 `Y.Map` 本身放进 state，渲染期间读它会绕过快照。示例在每次编辑和同步后调用 `inspect`。

事务 origin 可以让以后的观察者区分本地和远程。它不是访问控制。日志里可以打印 origin，不要打印整份更新字节，里面可能有用户正文。

若两份 Doc 的共享类型名字写错一个字母，同步会成功但界面仍是空的。测试要断言具体的 feed 键，而不是只断言 `byteLength > 0`。

## 升级

钉 `yjs@13.6.33`。升级小版本后重跑：离线双端合并、重复投递、错误文档 id 不改目标。不要同时升级未在 `library.json` 里的 provider 而不看其对等版本。

`Y.applyUpdate` 的第三个参数 origin 只用于本地观察。不要用 origin 做安全判断。

basic 不同步。只点 A 时，B 的 Doc 仍然存在于 ref 里，只是这一层不渲染它。不要在 basic 的测试里断言 B 的 JSON 可见，但销毁时仍然要 `destroy` B。

`envelope` 把 scope 和字节包在一起。`validateYjsEnvelope` 返回的是 `update` 字节，不是整个对象。`applyUpdate` 收到的必须是这个返回值。把整个对象传进去会抛出或损坏文档。

## 验收

- A、B 各自添加的 feed 键在同步后两边都存在。
- 同一份更新应用两次，map 与标题保持一致。
- 错租户、错文档、非 `yjs-v1`、空字节或超过 64 KiB 被拒绝，目标 Doc 不变。
- 卸载后 ref 不再指向已 destroy 的文档。
- 并发标题在两边收敛为同一个字符串，测试不写死赢家。
- `tests/sdk.test.mjs` 导入真实 `yjs`。无收据则 NOT_RUN。

练习：把增量先写入临时数组，再按相反顺序应用，断言与正序相同。再加一个错误租户的信封，确认 `applyUpdate` 没有被调用。

状态向量是压缩过的时钟，不是业务版本号。不能把它显示成“第 3 版标题”。用户看见的版本应来自你们自己的字段，并接受 CRDT 可能把并发写入收成另一份值。

`Y.UndoManager` 没有在示例里创建。若加上，它跟踪的是本地 origin，不要把 `demo-sync` 的远程更新也放进撤销栈，否则用户会撤销别人的编辑。销毁 Doc 之前先停掉 UndoManager 的监听。

跨标签可以用 `BroadcastChannel` 传更新字节，但仍然要走信封。Lab 把两份 Doc 放在同一个组件里，是为了不打开频道。不要把这个按钮理解成已经做了多标签同步。

`nextId` 只在当前挂载里递增。销毁 Doc 之后 id 会从 1 再开始，因为 ref 和组件状态一起重置。不要把这个数字当成全局文档版本。

同步抛错时，已经应用到一侧的更新不会自动滚回。`syncReplicas` 在两次 `applyUpdate` 之前都先校验，两份字节要么都合法要么在应用前抛错。不要把校验挪到第一次 `applyUpdate` 之后。

状态句里的字节数是编码结果的长度，包含 CRDT 开销。它不是标题的 UTF-8 长度。不要用它做配额账单。

`inspect` 在 Doc 刚创建时返回空对象和空标题。第一次渲染不是同步失败。按钮在 ref 尚未就绪时直接返回。测试要等 effect 提交后再 `syncReplicas`，或者直接调用导出的函数而不点按钮。

## 资料

- https://docs.yjs.dev/api/y.doc
- https://docs.yjs.dev/api/document-updates
- https://docs.yjs.dev/api/y.map
- https://github.com/yjs/yjs
- https://www.npmjs.com/package/yjs
