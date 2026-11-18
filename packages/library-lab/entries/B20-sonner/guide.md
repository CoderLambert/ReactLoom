# Sonner：短通知与业务结果各有主人

保存新闻后需要马上反馈，后台步骤需要显示进行中，最近一次保存可以短暂撤销。Sonner 负责把这些事件显示成通知；React 业务状态决定新闻是否保存、哪一次任务还能提交结果。关闭通知不会取消任务、撤销保存或证明用户已经读过。

固定 **sonner 2.0.8**，MIT，实际 React 19.3.0。匹配 peer 覆盖 React/React DOM 18、19 系列；它是 React DOM 库。重要风险用阻断性确认，字段错误放输入旁，长任务有可见状态；不要把临时 toast 当任务数据库或唯一错误记录。

## 机制与运行前提

应用渲染真实 `<Toaster />`，调用 `toast()`、`toast.success/error/loading()` 返回真实 toast id。SDK 模块维护通知 store，Toaster 订阅并按 `toasterId` 过滤，再渲染具有 polite 实时区域的 section 和通知列表。本版本 Toaster **不是 React Portal**，它就在 React 树中的挂载位置，官方样式用 fixed 定位使通知浮在右下角。

2.0.8 实际 JS 入口会在浏览器导入时向 document.head 注入官方 CSS，另有公开 `sonner/dist/styles.css` 导出。本例直接导入 SDK，**不依赖宿主额外引入 CSS**，也不重复复制官方样式。必要的 `sonner-demo.css` 只管本例控件布局。默认样式是 SDK 的文档级样式，不能说成完全隔离；不要在卸载一个示例时删掉共享 style。Shadow DOM 接线没有实现。

每个实例以 React useId 生成唯一 Toaster id，所有通知携带同一个 toasterId；SDK 返回的 toast id 是另一层身份。前者决定容器归属，后者决定更新/关闭哪一条。多个实例不能共用固定 `reactloom-b20-demo`，否则同一通知可能显示在多个容器里。

```text
按钮/本地任务 → toast(message, {toasterId, id?}) → SDK store → 本实例 Toaster
     └→ React saved/result（业务状态持续存在）
取消/离开 → 清自有900ms计时器、失效代际、dismiss(登记的id)
```

## 目标一：通知消失，业务反馈仍在

选择“通知与业务反馈分开”并运行，点击“触发订阅成功提示”。实际 `toast()` 显示“已订阅：前端工程”，持续状态显示“已触发基本通知”，页面另显示 SDK 返回的真实 id。

- 点通知的“关闭通知”，或将鼠标移开等待约 3.5 秒，通知消失，业务状态仍保留。这只是本地订阅成功的展示，没有发订阅请求。
- 可以 Tab 聚焦实际通知和关闭按钮；本例设置中文关闭标签，Toaster 区域名为“本演示通知”。没有为整个 Lab 抢占 Alt+T，`hotkey={[]}` 使用 2.0.8 支持的空快捷键配置。
- `visibleToasts={3}` 限制当前可见堆栈，不是删除队列或取消业务；早期通知可能被压到堆栈后方。不要从可见数量推断 store 或业务数据被删除。

自动关闭时间会因悬停、交互、文档隐藏暂停，因此不是严格墙钟 SLA。“最近创建的真实 toast id”是历史读数，不表示通知还在；业务判断读 result/saved。

## 目标二：最新保存拥有一次撤销

选择“最新保存的一次撤销”。点击“保存新闻并显示撤销”，稍后阅读状态变成已保存，真实 `toast.success()` 附带“撤销” action。

1. 用真实按钮或键盘执行“撤销”，业务变成未保存，并显示“已撤销最近一次保存”。action 默认使该 toast 离场。
2. 再次保存并直接关闭通知，业务仍为已保存。自动关闭也不会回滚保存。
3. 连续保存时，新的保存先取得新 token，再关闭上一条自己的成功通知。即使旧通知还在离场动画里，旧闭包也没有撤销最新保存的权力。只有最新 token 可以执行一次，消费后立即 invalidate。

`LatestRunGuard` 是本例自己的代际规则，不是 Sonner 的事务 API。SDK action 只调用回调，应用负责 token 和 saved。真实业务撤销必须调用补偿接口并处理失败，本例只更新一个本地新闻状态布尔，不承诺后端回滚。

## 目标三：同 id 更新与可取消本地任务

选择“同 id 更新、失败与取消”。点击“运行异步反馈”，loading 显示“正在处理本地演示任务…”，业务状态是任务进行中。900ms 的本地 timer 到期后，用**创建时同一个 id**更新成功或失败，页面 id 不变，实际同一个 toast DOM 从 loading 变为 success/error。

勾选“模拟业务失败”只影响**下次点击时**捕获的 shouldFail；任务途中改勾选不会改变本次输入。重复点击使旧 token 失效，清旧 timer 和旧 loading，只允许最后一次未完成任务更新结果。此前已经完成的有限通知可以继续显示剩余时长，不是假称全局永远只有一条通知。

有一个匹配版本的关键细节：SDK 同 id 更新会合并旧配置。loading 设 `duration: Infinity` 后，仅改 type/title 不会清掉 Infinity。源码在 `toast.success/error(..., {id, toasterId, duration: 3500})` **显式恢复有限时长**；否则终态也不会自动关闭。Toaster 的默认 duration 不能覆盖已有的 toast.duration。

点击“取消并清理本演示”，应用先使任务和撤销 token 失效，清 timer，只 dismiss 本实例登记的 id。900ms 以后旧回调也不能把结果改成成功。停止并卸载或离开 Demo Tab 走同样清理；重新运行得到初始状态，不恢复旧 loading。公共 level prop 变化也重置本地工作坊。

这不是 HTTP、Promise 请求取消或后端失败。AbortController、toast.promise、重试/服务端补偿均没有接入；清 timer 和代际失效是两道不同防线。

## 迁入业务的文件与所有权

```sh
pnpm add sonner@2.0.8
```

复制 `examples/example.tsx`、`examples/latest-run.ts`、`examples/sonner-demo.css`。`demo.tsx` 只是 Lab 出口，普通页面直接渲染组件并指定 level。无 Lab alias、外部资产或网络配置。

应用拥有 saved/result、两个独立守卫、timer集合和本实例创建过的 id 集合；集合是清理登记，不是活跃通知账本。SDK 管通知订阅、渲染、退场与倒计时。清理只遍历 owned 调用 `toast.dismiss(id)`，永远不调用无参数 dismiss，以免关闭应用其他模块通知。自然关闭后留下的历史登记也只在本实例范围内重复关闭，不清全局 store/样式。

`onAutoClose` 是自动计时路径；`onDismiss` 在用户关闭、滑动或某些程序 dismiss 路径也可能触发，不能当作严格的“用户已确认”。两者都不提交业务事务。关闭 action、关闭 toast、取消任务和撤销业务是四件不同的事。

SSR 可以输出 Toaster 区域，但没有客户端订阅、测量、样式注入和倒计时；在 Node 里读真实 SDK store 也不能证明页面通知已出现。Node 没有浏览器 requestAnimationFrame，不能为了让 dismiss 测试通过伪造 RAF。测试在自有 Worker 中运行真实 SDK store，finally终止 Worker 释放自己的模块资源；真正 dismiss/DOM/定时交给主控浏览器。

## 避免的错误

- 无参数 `toast.dismiss()` 清掉整页通知。
- 关闭通知就把 saved 改回 false，或让过期撤销回调修改最新保存。
- 新建成功通知代替原 loading，导致原 loading 永远留着；或复用 id 却保留 Infinity。
- 只在短通知里写失败，消息消失后业务界面毫无说明。
- 把 visibleToasts、getHistory/getToasts 当业务数据库、持久队列或服务器结果。

## 官方原文与证据

[官方 README 原文](official/readme.md)为英文867B，固定官方 `v2.0.8` commit `6739aca5f668a33a4fd1d2fd9f758dff95c57466` 的根 README，SHA-256 `0809d104ce28f9c14b3b1e73257d93096f96134d2a5f2f225e5abf38b1aa4549`。未截断 tree 仅有根 README.md 与 test/README.md，无官方中文候选，原文不翻译拼接。

发布元数据有差异：npm 2.0.8 的 gitHead 是 `ecce1841c55e4a72dfe139a8992b56498660125e`，那个 commit 的 manifest 仍为2.0.7；官方 tag 的 manifest 为2.0.8。两 commit 的 README 和 src/state.ts 原文字节相同。本文保留这项事实，原文展示固定匹配版本 tag，不伪称两个 commit 一致。完整10请求、package/源码比对、同步时间和原始完整headers见 [source-evidence.json](official/source-evidence.json)。

官网 GET200 完整头未见 XFO/CSP，未从 Lab origin 真实确认 iframe，因此 **unknown**；缺头不能标 allowed。直达 [官网](https://sonner.emilkowal.ski/) 保留，不更改宿主 frame-src。

局部 SDK、纯规则、类型/格式/metadata 的实际命令与边界在 [local-validation.md](local-validation.md)。完整三个真实 Playwright 案例在 [browser-proposal.txt](validation/browser-proposal.txt)，实际通知皮肤、焦点/action、有限时长、取消和卸载由主控统一执行。正式 sdk/build/browser 仍 NOT_RUN，不用 Node store 或旧仓库 CI 代替浏览器收据。
