# Yjs：离线各自编辑，收到更新后收敛

两位编辑者同时维护 RSS 集合，断网期间各自添加频道，重新连接后双方的条目都要保留。把 A 的 JSON 覆盖 B 会丢掉 B 的离线改动。Yjs 用 CRDT 共享数据结构记录更新，各副本收到完整更新后可得到一致结果，不依赖某台机器的墙钟来决定“谁最后写”。

需要离线、多端编辑同一文档时值得选它。普通服务端表单可以用请求和版本检查；单人本地撤销可以用 Immer。Yjs 不提供账号、房间权限、网络可靠性、持久化或产品冲突决策。此例固定 `yjs@13.6.33`（MIT），只创建两份本地内存文档，不连接协作服务。

## Doc、共享 Map、事务和更新

每个 `Y.Doc` 是副本，`doc.getMap('feeds')` 获取有名字的共享类型；两端必须使用相同名称。Map 的键是稳定业务 ID，值是普通频道数据。此例每次 `transact` 同时写入一个 feed 和 meta.lastEditor，产生一个本地 update 事件。不要修改已放进 Map 的普通对象来冒充共享更新，应通过共享类型 API 写入。

`update` 事件给出 Uint8Array 字节。`encodeStateVector` 描述副本已知的客户端时钟，`encodeStateAsUpdate(source, targetVector)` 编码目标缺少的更新。它不是 toJSON，也不是业务版本号。`applyUpdate` 合并字节；完整更新可以重复、乱序到达，Yjs 会处理依赖并最终收敛。缺少必要更新时并不保证立即显示全部数据。

```ts
const vectorA = Y.encodeStateVector(a);
const vectorB = Y.encodeStateVector(b);
const ab = Y.encodeStateAsUpdate(a, vectorB);
const ba = Y.encodeStateAsUpdate(b, vectorA);
Y.applyUpdate(b, ab, 'remote');
Y.applyUpdate(a, ba, 'remote');
```

origin 只是本地观察标记，用来避免把接收的更新再次当作本地待发消息；它不是发送者身份或授权。

## 三个操作实验

### 本地事务：一个操作产生一个待传更新

basic 点「A 添加 RSS」，A 出现 `left-1`，本地事务数与待传更新数各加一；同一次事务还更新了 meta.lastEditor，但没有因此变成两条待发事件。此层不显示 B，也没有同步按钮。刷新或卸载会丢失文档。

### 双端独立编辑：交换对方缺少的字节

business 在 A、B 各添加一条，先观察两个 JSON 分别只有自己的键。点「交换增量并合并」，两边都包含 left/right 键，待传队列归零。状态句记录真实编码字节数。再同步一次内容不变；字节可能仍含 CRDT 格式和删除集开销，不承诺字节数为零。

### 同键冲突、依赖乱序和错误信封

advanced 在 A 连续添加两条，在 B 添加一条，再点「同时编辑 title」。两边标题不同。此时点「乱序+重复投递检验」：实际捕获的本地事件按每个源副本的逆序传到对方，后一个更新可以先于依赖到达；随后补上之前编码的完整增量，再重复投递该增量。最终两边都保留三个 feed，标题相同，不写死哪一方获胜。状态句显示逆序投递的实际事件条数。没有待传事件时该条数为 0，不假装又产生了一次乱序实验。

点「拒绝错误文档信封」，错误显示 mismatch，两份 JSON 和标题均不变。这个按钮故意改 documentId，校验发生在 applyUpdate 之前。它演示的是应用边界拒绝，不是网络服务鉴权失败。

## 最短接入与完整迁移

已有 React/TypeScript 应用执行 `pnpm add yjs@13.6.33`。复制 `examples/runtime.ts`、`examples/example.tsx`、`examples/update-transport.mjs`、`examples/update-transport.d.mts`，保持相对路径；`demo.tsx` 只重导出，可省略。直接渲染 `<YjsExample level="business" />`（basic/advanced 也可）。需要 React DOM、Uint8Array 和支持 .mjs/.d.mts 的 TypeScript bundler 解析，没有环境变量、CSS 文件、Provider、WebSocket 或后台服务。demo-controls 等 class 仅为宿主排版。

runtime 创建两份 Doc，监听 update 并只缓存 origin=demo-local 的事件。React 展示 runtime.inspect 产生的普通快照，不把可变 Y.Map 本身当渲染快照。effect 清理先清 ref，再调用 runtime.destroy：解除自己注册的两个 update listener、清空待传字节队列、destroy 两份自己拥有的 Doc。destroy 可重复调用，销毁后运行时拒绝操作。共享外部 Doc 时应由其 owner 决定销毁，不能随一个视图卸载而 destroy 整个房间。

生产还需要单独选择、核对 provider/持久化/编辑器绑定，本例没有安装 y-websocket、y-indexeddb 或 Awareness。接入时传更新字节而非 Doc 的结构化克隆；JSON 快照可用于展示，但不能代替可合并历史。收到更新后的持久化、重连补齐、压缩与配额也需要自己的策略。

## 自建信封的能力边界

update-transport.mjs 要求 format=yjs-v1、精确匹配 tenantId/documentId，以及 1–64 KiB 的 Uint8Array。这是本例自建检查，64 KiB 不是 Yjs 协议常量。校验返回原始字节，不检查解码内容、签名、键权限或发送者身份。生产必须在服务端验证会话与房间 ACL，并在受控传输层做配额和格式处理。

runtime 先编码并校验两份增量，再开始应用。校验错误会在写入前抛出；但即使信封合格，损坏的 CRDT 字节仍可能在 applyUpdate 中出错，不能把双副本应用当成数据库原子事务或假设失败自动回滚。界面保留失败提示；真正接收不可信内容时应设计隔离/恢复策略。

同键标题收敛不代表保留两个候选，不代表最新墙钟值必胜，也不解决产品审批冲突。业务若必须提示双方选择，要在数据模型另存候选/审核状态，不能从最终单值倒推出用户意图。不要把令牌或私密授权信息存进共享 Map。

## 来源与实际验证

README 页签保留官方 yjs/yjs 在 v13.6.33 对应提交的原文；该树没有官方中文 README，因此使用英文原文，中文讲解与其分开。官网为 docs.yjs.dev，GET 与响应头见 official/source-evidence.json；CSP frame-ancestors 只允许 https:、ionic:、capacitor:，明确排除当前 HTTP Lab origin，状态 blocked，保留直达。

[官方更新 API](https://docs.yjs.dev/api/document-updates) 和 [Doc API](https://docs.yjs.dev/api/y.doc) 解释编码、事务与销毁；实际版本以固定源码和安装包类型为准。tests/sdk.test.mjs 导入 UI 同一个 runtime.ts；信封纯策略测试单列，不当作 SDK PASS 数。命令、原始日志和六项状态见 local-validation.md，浏览器与正式收据另行记录。
