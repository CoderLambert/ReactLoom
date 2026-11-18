# React Virtuoso：把变高阅读流保持在一个小窗口里

文章摘要长短不一，展开后高度还会变化，直接渲染一万张卡片会让浏览器承担大量 DOM。React Virtuoso 接收数据数组，测量实际行高，按滚动位置只挂载需要的窗口，并提供前插和追加时的定位能力。本例运行 **react-virtuoso 4.18.19**，MIT，React/React DOM peer 接受 19；Lab 使用 React 19.3.0。普通 `Virtuoso` 属于开源包，这里没有另行安装收费 Message List 产品。

适合变高文章流、日志或历史消息。需要完全掌握定位和 DOM 结构时比较 TanStack Virtual；需要列模型、排序、网格导航时另选表格方案，普通 Virtuoso 不会自动提供这些功能。数据很少时，普通列表更容易维护。

## 从数据到屏幕

```text
应用拥有 articles、筛选条件、分页上限、展开 ID
        ↓ data + computeItemKey
Virtuoso 拥有滚动容器、已测高度和当前渲染窗口
        ↓ itemContent
真实 article DOM；展开或宽度变化后重新测量
        ↓ rangeChanged / atBottomStateChange
应用展示 SDK 通知，不伪造位置或性能结果
```

虚拟化减少挂载的 DOM，**不会减少已经创建的 JavaScript 数组、替你分页或发送网络请求**。basic 一开始就在内存创建一万条虚构文章；business 先过滤 630 条，再把前 `limit` 条传给 SDK。所有摘要都是文本节点，不会执行 RSS HTML。

`computeItemKey={(_index, article) => article.id}` 给 React 稳定业务身份。数组位置、SDK 逻辑下标与业务 ID 是三个概念：追加/前插会改变数组位置，文章 ID 不变。不要把消息展开状态绑在数组下标上。

滚动容器必须有可计算的高度，本例是 360–390px。`defaultItemHeight={86}` 只是首次估计，省去从第一条探测默认值的过程；之后仍测量真实高度。`fixedItemHeight` 会跳过测量，本例不用它。卡片不在外部设置垂直 margin，以免测量边界和实际布局分离。

## 实验一：一万条数据与真实渲染窗口

打开 basic，等待状态出现“已渲染区间”，再点“跳至第 9001 条”。真实调用为：

```tsx
const listRef = useRef<VirtuosoHandle>(null)
// 按钮回调：listRef.current?.scrollToIndex({ index: 9000, align: 'center' })
<Virtuoso
  ref={listRef}
  style={{ height: 360 }}
  data={articles}
  defaultItemHeight={86}
  computeItemKey={(_index, article) => article.id}
  rangeChanged={setRange}
  itemContent={(_index, article) => <article>{article.title}</article>}
/>
```

预期第 9001 篇进入窗口，DOM 卡片远少于一万条；把页面缩窄，长文本重新换行，SDK 继续测量。真实结果需要浏览器观察，源码中的 10,000 不是帧率或性能承诺。

`rangeChanged` 报告**已渲染项区间**，会受 overscan / increaseViewportBy 等设置影响；它不等于精确可见交集。本例把从 0 开始的 index 加 1，方便对应文章编号，没有把它用作服务器 cursor。测量、渲染区间与真实滚动位置的运行验收由浏览器提案分别断言。

## 实验二：搜索、可取消分页与窗口身份

business 默认显示“30/630 篇”。点“加载下一段”，按钮禁用并显示真实本地 260ms 延迟，完成后显示 60 条。滚动到底部也由 `endReached` 调用同一加载函数。`pending` ref 同步阻止重入，`hasMore` 限定总数，`nextWindowLimit` 将末批截到过滤后的总数。

在延迟期间点“取消本地加载”，当前条数保留；随后可以重新加载。这是应用的计时任务，**没有 HTTP 请求、服务器 cursor 或请求成功响应**。本例没有网络错误分支，不能把它当完整远程加载器。

输入“React”后点“搜索”，应看到“30/210 篇”，首项为 article-3。输入不存在的关键词后会出现空态，加载按钮显示“已是最后一段”；改回关键词即可恢复。输入期间仅更新 draft，提交后才更新 query。`normalizeFeedQuery` 做 NFC、移除 C0/DEL、trim，截取最多 80 个 Unicode 码点；它没有移除所有零宽字符，也不做 HTML 净化。原生输入还以 160 个 UTF-16 单元限制草稿长度。

相同关键词再次搜索也要重新开始阅读。本例每次提交增加 `viewRevision`，将其作为 Virtuoso 的 `key`：只重挂该虚拟窗口，丢弃其旧滚动位置与测量实例，不清空宿主页面。重挂是本例选择的明确重置契约，不代表 SDK 要求所有数据变化都重挂；普通追加保持同一实例。

提交搜索同时清定时器、增加 generation、重置 pending/limit。回调只接受当前 generation；卸载再以 alive 拒绝迟到回调。compositionstart/end 维护本组件的合成状态，合成期间提交不改变 query/revision；结束后再点搜索。真实操作系统输入法另需人工或对应环境验收，程序分发 composition 事件只证明应用守卫。

## 实验三：历史锚点、展开重测与底部跟随

advanced 从 article-501 到 article-530 共 30 条开始，`firstItemIndex=100000`。先展开 article-501 的说明，卡片会插入八行真实文本；它在 `Set<string>` 中以文章 ID 记录，不依赖当前是否挂载。

点“向前加载 10 条”：数据变成 article-491…530，窗口起点同时变成 99990。**在同一次 setState 中更新 `data` 和 `firstItemIndex`**，旧 article-501 的逻辑下标仍为 100000，SDK 据此补偿顶部新增高度；业务 ID 和展开状态保持。先改数组再改起点会给 SDK 两份不一致的状态，容易跳动。fixture 的序号仅用于生成更早数据，真实项目应使用服务器返回的消息 ID/游标，不能解析 UUID 数字尾缀。

向下滚一点但保持“正在阅读历史”，点“添加最新消息”，预期当前位置不强行跳到底。点“跳至最新消息”会实际调用 `scrollToIndex({index:'LAST', align:'end'})`，之后追加才跟随底部：

```tsx
followOutput={isAtBottom => isAtBottom ? 'auto' : false}
atBottomStateChange={setAtBottom}
```

浏览器验收先等待折叠行的真实高度已被 SDK 测量，再发起滚动并确认实际 scrollTop 已改变，最后采可见消息锚点。`mouse.wheel` 的返回不代表原生滚动已经结束，“正在阅读历史”也可能在滚动前就已为真；过早采样会把正常虚拟化卸载误判成追加跳位。

`followOutput` 使用 SDK 提供的位置参数决定是否跟随；`atBottomStateChange` 只给状态文字，不反向触发滚动。位置未知时先显示“等待 SDK 位置通知”，不预填“已经在底部”。不要把 followOutput 写成无条件返回 auto，否则用户读历史时会被拉走。

这个本地历史最多 1,000 条，前插还受最早 article-1 与正数 firstItemIndex 约束；达到边界禁用相应按钮，不静默裁掉已有数组。它证明有限 fixture 的锚点流程，不代表已完成长会话内存裁剪、实时推送或服务端分页。

## 迁入自己的项目

携带 `examples/example.tsx`、`examples/view-policy.mjs`、其 `.d.mts` 和 `examples/workshop.css`；`demo.tsx` 只是 Lab 再导出适配。安装匹配的 react-virtuoso、React/React DOM，不需要本仓库脚本、内部别名或额外主题框架。保持 CSS 导入、容器确定高度、卡片内部 padding 和稳定业务 key。

用真实接口替换 business 的 260ms 计时器时，让请求层拥有 AbortSignal、游标、错误与 retry；查询身份要进入 query key，响应仍校验当前身份。不能把 `range.endIndex` 当后端 cursor，也不能因为取消了虚拟窗口就假设网络已取消。

应用只清自己创建的定时器和状态引用。SDK 4.18.19 的 useSize ref 会 unobserve 自己的元素，useScrollTop effect 会移除自己的 scroll 监听；应用不遍历或清理全站 ResizeObserver/RAF。SDK 测量可能已排一个 animation frame，源码对脱离布局的元素检查 offsetParent；本例没有宣称“卸载后全局 RAF 数为零”。实际卸载/重进仍要在浏览器检查原 DOM 脱离、任务不回写、新会话状态干净。

虚拟化后未挂载的条目不在无障碍树中。原生按钮有名称，展开按钮关联稳定文章 ID 和 aria-expanded，SDK 滚动容器可聚焦；这不等于一万篇文章可被连续朗读。产品需要全文访问时应另给分页语义列表或导出入口，本例未实现该入口。普通 `Virtuoso`、TableVirtuoso、Query 无限加载及富文本净化要分清，本例只运行第一种。

## 官方原文与验证边界

[官方原 README](official/readme.md) 从 `petyosi/react-virtuoso` 的 annotated tag `react-virtuoso@4.18.19` 解引用到精确提交 `324f632f2fc745257cc46c28d1cb952eb7c68464`，路径 `packages/react-virtuoso/README.md`。固定提交的真实文件树未发现对应包/根 README 的中文版本，使用英文原文；当前教学是本地中文说明。npm 4.18.19 省略 gitHead，未伪造与 tag 相同的 npm SHA；同提交 package manifest 版本已核实。原文 9703 bytes，SHA-256 `67bcd5ac56f7697428bdeb2bf6ec5eea7ffbb078a16b5979f123411ff6e559df`，同步时间、完整响应头与候选路径见 [来源证据](official/source-evidence.json)。

官网第一次 TLS 握手超时，后续实际 GET 200 取得完整响应头，未提供 X-Frame-Options / CSP；未从实际 Lab origin 在浏览器确认可用，故状态是 **unknown**。HTTP 200 或缺限制头不能证明允许嵌入，始终保留官网直达入口。

真实 SDK Node 测试只检查 SSR 的 initialItemCount、真实两条内容和 firstItemIndex 逻辑下标；不把空 div、相同 HTML 或 policy 测试当成滚动/重挂成功。策略测试单独检查查询、分页与版本边界。[完整浏览器提案](validation/browser-proposal.txt) 交由 root 在统一候选运行，覆盖三个真实目标、ResizeObserver 重测、前插/跟随与卸载。作者未执行浏览器，formal verification 保持 NOT_RUN，实际命令/退出码见 [本地验收](local-validation.md)。
