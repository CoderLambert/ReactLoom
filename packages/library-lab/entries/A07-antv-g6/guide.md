# A07 AntV G6 5.1.1：Graph 生命周期、render 与坐标

G6 画的是关系：节点、边、分组、布局和交互。它不是柱状图库，也不是带端口约束的流程编辑器。编辑器优先 React Flow；静态说明用 Mermaid；手绘用 Excalidraw 或 tldraw。几十万节点的帧率不能从宣传页外推。

Library Lab 钉 `@antv/g6@5.1.1`，MIT。包名是 `@antv/g6`，不是 `g6`。示例用原生 `Graph`，没有 `@antv/g6-extension-react`。

## Lab 当前示例

`examples/demo.tsx` 导出 `examples/example.tsx`。宽度夹取在 `examples/graph-sizing.ts`：非有限或小于 1 的宽度丢弃，上限 4096。

已挂载：

- effect 里 `new Graph({ container, width, height: 330, data, node, edge, behaviors })`。节点是半径 42 的圆，边是带箭头的线。`behaviors` 只有 `drag-canvas` 和 `zoom-canvas`，没有拖单个节点。
- 坐标写在数据的 `style.x` / `style.y` 上，间距 142。没有 dagre，也没有力导向。
- `graph.render()` 是异步的。`disposed` 为真就不再 `observe`、不再 `setStatus`。
- `ResizeObserver` 合并到 rAF，宽度变了才 `graph.setSize(width, 330)`。
- cleanup：`disposed = true`、断开观察者、取消 rAF、`graph.destroy()`。StrictMode 会把 effect 跑两轮，每一轮拥有自己的 Graph。
- basic 三个节点：RSS来源 → 正文解析 → 内容索引。business / advanced 可用复选框插入「质量审校」。advanced 的「重新创建图实例」只增加 `revision`，从而让 effect 整图销毁再新建。
- 容器 `role="img"`。有序列表和「有向边」句子是读屏用的文本，不依赖 Canvas 命中。

这条重建路径适合演示所有权，**不适合**当成数据更新的写法。生产里改颜色用 `updateNodeData` + `draw()`，换数据用 `setData` + `render()`，不要每次勾选都 `new Graph`。Lab 把 `extended` 和 `revision` 放进 effect 依赖，所以勾选也会销毁重建。教学上要认得这个差别。

没有挂上：`NodeEvent.CLICK`、`setElementState`、dagre、WebGL 渲染器、`toDataURL`、HTTP 409/422、搜索邻居、标签随数量隐藏。研究稿的 50–2000 节点生成器也不在这里。

## 数据

```ts
const data = {
  nodes: [
    { id: 'source', data: { label: 'RSS来源' }, style: { x: 100, y: 110, labelText: 'RSS来源' } },
  ],
  edges: [{ id: 'edge-source-parse', source: 'source', target: 'parse' }],
};
```

id 稳定，边的两端必须存在。不要用数组下标当 id。React 里的步骤列表是事实；`Graph` 的数据是投影。Lab 的 `dataset()` 在渲染期和 effect 里各算一次，两边都从同一函数来，避免列表和画布描述分叉。`labelText` 是画布文字，列表用的是 `data.label`。用户字符串不要走 `innerHTML`。

## draw 和 render

- 只改填充色：`updateNodeData` 之后 `await graph.draw()`，避免整图重布局。
- `setData`、换布局、大量增删：`await graph.render()`。`setData` 本身不绘制。
- 短时间多次修改合成一批再画。
- v4 的 `changeData` / `save` / `read` 不要和 5.1.1 混用。对应物是 `setData`、`getData`、`setData` 加 `render`。[upgrade](https://g6.antv.antgroup.com/en/manual/whats-new/upgrade)。

Lab 的复选框没有走这条增量路径。若改成增量，要在已销毁的实例上禁止 `setData`，并用 `disposed` 丢掉迟到的 `render()` Promise。官方说明 `destroy` 不能取消已经进布局器的任务，浏览器里仍要看残留 canvas。

## 坐标和导出

`style.x/y` 是图数据坐标。`clientX` 是视口坐标。缩放和平移之后用视口 API 换算，不要用 `getBoundingClientRect` 除一个猜测的缩放比。[viewport](https://g6.antv.antgroup.com/en/api/viewport)。

`toDataURL({ mode: 'viewport', type: 'image/png' })` 返回 Promise。`overall` 会把整图光栅化，大图内存会涨。插件自己的 DOM 层不一定进这张图。跨域图片会 taint。PNG 不是可编辑的图数据；JSON 另存。Lab 没有导出。

## 三层

### 01 最小拓扑

三个圆、两条箭头。可以拖动画布、滚轮缩放。列表读出 id。容器初始宽度走 `measuredGraphWidth`，量不到就用 330。

### 02 审校节点

勾选后多一个「质量审校」，边改成来源→解析→审校→索引。因为 effect 依赖 `extended`，这是一次销毁重建，不是 `setData`。状态文案在 render 完成前是「正在建立真实 G6 Graph」。

### 03 重建

按钮强制换新实例。离开页面前必须 destroy，不能对旧 Graph 再 `setSize`。观察者在 cleanup 里断开。这仍不是性能基准：节点数始终是 3 或 4。

生产规模手段是服务端只给子图、邻居展开、折叠分组、标签阈值。Force 布局会持续迭代。Worker 或 WebGL 有部署和显存成本，不是默认免费加速。官方支持这些扩展，不等于当前示例启用了它们。[layout overview](https://g6.antv.antgroup.com/en/manual/layout/overview)。

## 反例

```ts
// 错：渲染函数里构造，勾选数据又 new 一次
function Bad({ extended }: { extended: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  if (host.current) new Graph({ container: host.current, data: dataset(extended) });
  return <div ref={host} />;
}

// 对：effect 创建并 destroy。仅换数据时：
// graph.setData(next); await graph.render();
// 仅换色时：
// graph.updateNodeData([{ id, style: { fill: '#d9e7df' } }]); await graph.draw();
```

| 错误 | 正确 |
|---|---|
| StrictMode 不 destroy | 每个 effect 拥有一个 Graph，cleanup 必 `destroy` |
| 改颜色也 `render()` | `draw()`，除非布局必须重算 |
| v4 `changeData()` | v5 `setData` |
| 下标当 id | 稳定业务 id |
| 边指向不存在的节点 | 投影前校验 source/target |
| 请求回来就覆盖 state | 序号 + revision；409 提示重载 |
| 每个节点一套 React DOM | 圆点用 Canvas 元素；少量自定义节点才考虑 React 扩展 |
| 大图全开标签 | 阈值隐藏，列表保留查找 |
| 把 PNG 当源数据 | JSON 与图片分开 |
| `clientX` 写入 `style.x` | 视口坐标转换 |
| `render` 未完成就卸载仍 `setStatus` | `disposed` 标志，Lab 已做 |
| 拖节点和拖画布绑成同一个 behavior 却不调触发器 | 分清 `drag-element` 与 `drag-canvas`。[drag-canvas](https://g6.antv.antgroup.com/en/manual/behavior/drag-canvas) |

## 无障碍与安全

Canvas 上的圆不能代替节点列表。Lab 的 `role="img"` 只是概览，列表才是操作文本。不要凭一个 aria-label 宣称符合 WCAG。当前没有持续动画，但缩放和拖拽仍要在真机上看 `prefers-reduced-motion`。

校验 id 字符、文本长度、有限坐标、唯一性和边端点。浏览器校验不是授权。

## 组合

**G6 + TanStack Query + Zustand。** Query 按租户、图类型、过滤器和 revision 缓存。Zustand 只存选择和折叠。G6 不反向写回文档。Lab 未装这两库。

**G6 + React Flow。** Flow 编辑可执行步骤；G6 只读展示部署后的依赖。布局结果不要互写。

**G6 + ECharts + ExcelJS。** 选中节点后侧栏看时序，表格从同一 DTO 导出，不从像素反读。

## 生产清单

1. DOM 就绪后构造，cleanup `destroy`。
2. 宽度无效不 `setSize`，宽度有上界。
3. 数据更新与实例重建分开。
4. `draw` 与 `render` 不混用。
5. v4 API 不出现在 5.1.1 代码里。
6. 边端点始终存在。
7. 坐标空间不混用。
8. 文本列表与画布描述同源。
9. 导出区分 viewport PNG 和 JSON。
10. 迟到的 render Promise 看到 `disposed` 就返回。

## 升级与练习

从 v4 迁到 5.1.1 时替换 `changeData` / `save` / `read`，并在 StrictMode 下切换数据 50 次，数 canvas 是否增加。[React 集成](https://g6.antv.antgroup.com/en/manual/getting-started/integration/react)。

练习：把审校勾选改成 `setData` + `render`，确认缩放不丢；高亮用 `setElementState` + `draw`，看布局是否被重算；点击加节点时用官方坐标转换。409 的合并必须基于服务端版本，不能在本地覆盖。

## 故障排查

空白：容器宽度 0、没 `render`、布局抛错。第二次挂载白屏：异步回调还拿着已 destroy 的引用。删节点有残影：没有 `setData`+`render`，或旧请求写回。滚轮和拖拽冲突：behavior 的 `enable` / `trigger`。PNG 缺一层：插件 DOM 或 CORS。

## 官方链接

- [仓库与 MIT](https://github.com/antvis/G6)
- [React 集成](https://g6.antv.antgroup.com/en/manual/getting-started/integration/react)
- [Graph](https://g6.antv.antgroup.com/en/api/graph)
- [数据](https://g6.antv.antgroup.com/en/api/data)
- [绘制与渲染](https://g6.antv.antgroup.com/en/api/render)
- [导出](https://g6.antv.antgroup.com/en/api/export-image)
- [v4 到 v5](https://g6.antv.antgroup.com/en/manual/whats-new/upgrade)
- [npm @antv/g6](https://www.npmjs.com/package/@antv/g6)

## 证据

sdk、build、browser 在 `docs/library-lab/evidence/runs/` 有本条目收据之前为 **NOT_RUN**。`measuredGraphWidth` 的测试只证明夹取，不证明 `Graph.render` 或 `destroy`。Actions run `41779873259` 是仓库级 install、typecheck、build、52 个 SDK 文件（153 个测试）和 45 个 Playwright，不是 A07 的 PASS，不要写入 `verification.json`。
