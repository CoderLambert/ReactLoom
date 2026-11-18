# AntV G6：把处理步骤变成可以探索的关系网络

新闻采集经过「RSS来源 → 正文解析 → 内容索引」。加入人工审校后，不仅多一行文字，解析的后继也从索引变成审校。G6 用节点、边和视口把这种关系画出来，适合依赖分析、知识图谱和邻居探索。需要端口编辑和执行约束时看 React Flow；只需随文档发布静态流程图时看 Mermaid。当前小图不能证明大规模关系网络的帧率。

本例固定 `@antv/g6@5.1.1`，直接使用 `Graph`，无 React 扩展包。默认后端是真实 Canvas；没有启用 WebGL、自动布局、远程后端或性能采样。MIT 许可不替你授权外部字体、图片和底图。

## 从数据到画布

业务事实是稳定的步骤 id 及相邻关系。`graph-data.ts` 一次产生 `nodes` 和 `edges`，React 文本按钮、边列表和 G6 使用同一份数据。节点的 `data.label` 是业务标签，`style.labelText` 是画布文字；`style.x/y` 是图数据坐标。边的 `source/target` 必须引用已有节点。数组下标只参与本例固定坐标计算，不充当业务 id。

```ts
const data = {
  nodes: [
    { id: 'source', data: { label: 'RSS来源' },
      style: { x: 100, y: 110, labelText: 'RSS来源' } },
    { id: 'parse', data: { label: '正文解析' },
      style: { x: 242, y: 160, labelText: '正文解析' } },
  ],
  edges: [{ id: 'edge-source-parse', source: 'source', target: 'parse' }],
};
const graph = new Graph({
  container, width: 640, height: 330, data,
  animation: false,
  autoFit: { type: 'view', animation: false }, padding: 24,
  node: { type: 'circle', style: { size: 42 } },
  edge: { type: 'line', style: { endArrow: true } },
  behaviors: ['drag-canvas', 'zoom-canvas'],
});
await graph.render();
```

`container` 是已挂载且有尺寸的 HTML 元素。构造与 `setData()` 修改模型；`await render()` 才等待准备画布、绘制及自动适配完成。圆节点 `size: 42` 表示尺寸/直径，不是半径。固定坐标便于追踪前后关系；`autoFit` 使三四个节点适应初始视口。没有执行力导向或 dagre 布局。

上面是接入顺序。完整 React 实现还必须处理异步操作与卸载，直接迁移下面列出的源码，不能只复制片段再忽略 cleanup。

## 三个可以操作的目标

### 1. 节点与边怎样落到真实画布

打开「节点、边与有向关系」。预期看到来源、解析、索引三个圆及两条箭头。拖动空白画布、滚轮缩放，再点「重新适配视口」。展开「查看真实SDK拓扑与视口」，检查 `rendered`、`nodes`、`edges`、`size` 和 `zoom`；它们通过真实 Graph getter 读取，不是把 fixture 再打印一遍。

点击画布节点，或用 Tab/Enter 操作同名文本按钮；预期「当前选择」与对应节点 `states: ["selected"]` 一起变化。`NodeEvent.CLICK` 提供命中元素 id；React 保存选择，`setElementState(states, false)` 应用选中样式。文本按钮给 Canvas 补充可操作的等价入口，不能据此宣称整页符合 WCAG。

### 2. 插入审校时更新同一实例

打开「同实例更新新闻处理拓扑」。初始四节点三边：来源 → 解析 → 审校 → 索引。取消「启用审校节点」后，预期三节点两边，解析直接指向索引；再次勾选恢复。观察 SDK 快照：`instance` 保持一致，`renderEvents` 增加，旧审校边消失。

```ts
graph.setData(nextData);   // 同步替换模型，不会自行绘制
await graph.render();     // 真实重绘；本例 autoFit 也会重新适配
```

这条路径避免把每次数据更新都变成 `new Graph`。稳定 id 让 SDK 对照前后数据。G6 模型保留已有元素的插入顺序，`getNodeData()` 不保证等于新输入数组顺序；拓扑含义由 id 和边决定，页面步骤顺序由业务数组决定。移除当前选中的审校节点会同时清空本地选择。

代价也可观察：本例每次拓扑更新自动适配，所以手动平移/缩放可能被重置。需要保留用户相机时，应移除自动适配并决定何时显式 `fitView`。只修改普通节点样式时，可用 `updateNodeData()` 后 `await draw()`；本例选中态走 `setElementState`，无需另一次全图 `render`。

### 3. 窄容器、交互与异步实例所有权

打开「选择、视口与异步所有权」。勾选「使用窄容器」，预期容器变为最多 320 CSS px，SDK `size[0]` 随实际内容宽度变化，节点仍通过 `fitView` 留在视口中。拖放/滚轮后可重新适配。点击「重新创建图实例」，预期 `instance` 增加，旧专属容器离开 DOM，已运行 SDK 任务结算后销毁旧 Graph。

`ResizeObserver` 读取实际内容宽度，rAF 合并回调，再执行 `setSize(width, 330)` 与 `await fitView({ when: 'always' }, false)`。测量小于 1 或非有限时不渲染、不更新尺寸，上限 4096；不使用会令移动端横向溢出的最小宽度。拖动画布只启用 `drag-canvas`，未启用拖单个节点。显式关闭动画，也没有持续布局/定时器。

图坐标与浏览器坐标有区别。快照的 `position` 是 SDK 元素位置，`client` 由 `getClientByCanvas(position)` 换算为 CSS 视口坐标；缩放/平移后不能直接用 `style.x/y` 去点击屏幕，也不要猜 bounding-box 缩放比。

## 异步边界为什么需要额外代码

5.1.1 的 `render()` 会跨过微任务和 `Canvas.ready`；`draw()`、`fitView()`、`setElementState()` 也返回 Promise。若立即 destroy 正在初始化的实例，迟到代码可能继续使用已清空的 context。仅在 then 里检查 `disposed` 不能避免 SDK 内部竞争。

本例 `async-owner.ts` 是自建任务所有权工具，不是 G6 取消 API。每实例串行执行完整当前意图，尚未开始的旧意图跳过；已运行任务不会被中断，await 之后检查代际才发布 UI。新任务从真实已应用状态继续补齐数据、尺寸及选择，失败显示在状态区且不毒化后续队列。

卸载时立即撤销所有权，断开 ResizeObserver、取消 rAF、移除本例注册的事件，再分离该实例独占的 DOM 容器。等待队列结算后调用一次 `graph.destroy()`。即使马上重建，新实例也有新容器；旧 render 只能完成在已分离的旧容器内。不声称取消 CPU、布局或 GPU 工作，也不能保证永不结算的第三方任务立即释放资源。没有轮询伪造销毁结果。

## 迁入你的 React 页面

依赖 `@antv/g6@5.1.1`、React 和浏览器 DOM/Canvas/ResizeObserver。复制七个运行文件：`demo.tsx`、`example.tsx`、`graph-data.ts`、`graph-options.ts`、`async-owner.ts`、`graph-sizing.ts`、`workshop.css`。入口只 re-export 实际组件；CSS 由组件相对导入，提供容器高度、窄屏和键盘焦点样式。不依赖 Lab 共享 alias、样式或 runner，没有额外图片/字体。父组件渲染 `<G6Example level="business" />` 即可。

用业务 DTO 替换 `createGraphData`，保持 id 唯一、边端点存在、坐标有限。若接远程请求，另行管理取消、租户隔离及权限；G6 不替代服务端授权。未实现的导出、布局、图编辑和大图优化应按需求加入并重新验收。v4 的 `changeData/save/read` 不可套进 5.1.1。

## 官方资料和验收范围

官方中文 README 保存为独立原文快照，对应 5.1.1 提交 [`5a5551c`](https://github.com/antvis/G6/blob/5a5551cea13d021d12c90a87116e3c6092d53210/README.zh-CN.md)。核心 API 按同提交 [Graph 源码](https://github.com/antvis/G6/blob/5a5551cea13d021d12c90a87116e3c6092d53210/packages/g6/src/runtime/graph.ts) 和安装声明核对；[官网](https://g6.antv.antgroup.com/) 提供当前文档，可能先于本例升级。README 不是本地教学的替代品。

Node 套件真实执行 Graph 模型、setData、关系查询和 destroy，没有调用 render；纯策略验证串行所有权和宽度。两者都不证明 Canvas/WebGL、排版、命中或实际卸载。上述可见结果目前是浏览器验收预期，操作源码在 `validation/browser-proposal.txt`，实际状态与原始日志见 `local-validation.md`；正式 SDK/build/browser 收据仍是 NOT_RUN。
