# D17 Yjs — 工程手册

## 适用

两份及以上副本离线编辑同一 CRDT 文档，再用状态向量交换增量。Lab 只在内存里演示 `Y.Map`。

不要用 JSON 覆盖模拟合并。不要把收敛结果解释成业务上的最后写入。不要连接未评审的协作服务。

## 版本

`yjs@13.6.33`，MIT。更新信封的演示格式是 `yjs-v1`，最大 64 KiB。这个上限不是协议常量。

不安装 y-websocket、y-indexeddb 或 awareness。需要它们时单独核版本，不要假设与 13.6.33 任意组合都能用。

## 迁移

复制 examples/runtime.ts、example.tsx、update-transport.mjs 与 update-transport.d.mts；createReplicaRuntime 提供 add/conflict/sync/inspect/destroy，组件 effect 持有其生命周期。已有 React/TypeScript 工程安装 yjs@13.6.33，保持相对路径并传 level。无需环境变量、CSS、Provider 或协作服务；使用现代 Uint8Array 与 TS bundler 模块解析。校验来自 [`examples/update-transport.mjs`](examples/update-transport.mjs)。`demo.tsx` 只重导出。

生产替换 `demoScope` 时，租户和文档 id 必须来自已鉴权的会话，而不是页面上的可编辑字符串。先校验再 `applyUpdate`。

编码顺序保持：先读两边向量，再生成两份更新，再应用。replay 将真实捕获的本地事件逆序投递，补上状态向量增量，再重复投递。待传事件为0时不宣称又做了依赖乱序。

## 不可删的清理

卸载 effect 对 `left` 和 `right` 调用 `destroy()`，并清空 ref。同步函数在 ref 为空时直接返回。

信封失败先抛错，不 applyUpdate。信封不解码CRDT；损坏内容仍可在applyUpdate失败，不承诺两Doc原子回滚。runtime.destroy 先off自己注册的update listener并清队列，再destroy两Doc；不销毁外部owner的共享Doc。

不要把 Doc 存进模块级单例给下一个挂载复用。

## 反例

- `clear()` 后按 JSON 重放另一端。
- 不带状态向量的全量更新被当成增量协议。
- 跳过 `validateYjsEnvelope`。
- 断言某个标题字符串一定获胜。
- 卸载后不 `destroy`。
- 用 64 KiB 检查代替服务器 ACL。
- 只持久化 `toJSON()` 并当作同步日志。
- 用 `origin` 参数做鉴权。

## 测试断言

- 断开期间的两边编辑在交换后都保留。
- 同一键冲突后两份 Doc 的该键相等，且测试不写死赢家。
- 同步之后的再次增量可以安全重放。
- 乱序和重复投递仍收敛。
- 文档 id 或租户不匹配时目标 Doc 不变。
- 空字节、非 `Uint8Array`、超长字节被拒绝。
- `tests/sdk.test.mjs` 导入真实 `yjs`。无收据则 NOT_RUN。

## 真实限制

没有网络和持久化。64 KiB 与固定租户只覆盖演示误用。标题冲突的可见结果依赖 Yjs 的当前实现，界面不把它写成产品规则。

两份 Doc 都在主线程。没有光标，没有撤销栈。

## 证据

sdk、build、browser 保持 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有匹配收据。Actions 41779873259 不是本条目 PASS。不要改 `verification.json`。

## 可观察与测试来源

本地事务计数记录transact调用，pending记录实际update事件：一次添加写两个Map但只产生一条待传更新。SDK测试必须导入examples/runtime.ts实际源；信封纯策略独立记数。Node原生类型剥离运行.ts，不能另造测试API冒充UI运行。标题不写死赢家，比较两边相等；无网络/持久化/awareness/权限/undo。
