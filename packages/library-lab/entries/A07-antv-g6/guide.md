# AntV G6 5.1.1：关系网络与图拓扑实战

## 核心定位
G6 适合关系图谱、依赖关系、风控链路、知识图谱等**节点与边**优先的场景。若是标准业务统计图，先考虑 A01 ECharts；若需要复杂的拖拽流程编辑器，先评估 A06 React Flow。G6 5.x API 与旧版 4.x 不兼容，不能沿用 `graph.data()`/`changeData()`。

## 安装及版本
```bash
pnpm add @antv/g6@5.1.1
```
```ts
import {Graph} from '@antv/g6';
const graph = new Graph({container: div, width: 600, height: 330, data:{nodes,edges}});
await graph.render();
graph.setData(nextData); await graph.render();
graph.destroy();
```
源码以 `examples/example.tsx` 为唯一事实源，`examples/demo.tsx` 仅负责 Library Lab 懒加载。数据来自本地确定性 fixture，不会连接真实 NewsHub 数据。

## 演示分层
基础层验证 G6 的坐标节点、边和 Canvas 绘制。业务层切换新闻处理链中的“质量审校”节点，使 source→parse→review→index 的拓扑可以变化。边界层重复创建实例、拉伸容器以暴露资源泄漏和尺寸计算问题。右侧节点列表是不可依赖 Canvas 的无障碍替代。

## 数据模型与行为边界
节点必须使用稳定业务 ID，而非数组下标；edges 的 source/target 必须引用存在的节点。适配来自后端的关系数据时先进行去重、拓扑校验和裁剪。Graph 实例应由单个容器所有；容器由 React ref 保持。G6 `render()` 为异步，因此每次 effect 需要防止卸载后继续更新 React 状态。

## React 生命周期
在 effect 中构造 Graph，渲染成功后安装 ResizeObserver，cleanup 必须 `disconnect()` 并 `destroy()`；不能把 graph 放入可导致 React 无限重渲染的 state。StrictMode 的开发态二次执行用于检验残余 Canvas。当前示例为了教学可见性在节点变化时销毁重建；高频业务更新应稳定持有实例、调用 setData / render 并避免重建 GPU 上下文。

## 典型错误与纠正
1. **旧版 API 混用**：`changeData` 是 4.x 风格；5.x 请用 `setData` 和 `render`。
2. **尺寸为零**：在隐藏 Tab 中初始化会得到不可用画布；DemoHost 只挂载激活 Tab，并给容器明确高度。
3. **异步完成后回写**：卸载后 render promise 才 resolve，会误更新已切换页面；effect 使用 disposed 守卫。
4. **清掉 DOM 但未销毁图**：这会遗留 G6 事件和 Canvas 资源；必须调用 `destroy()`。
5. **仅有可视图没有数据替代**：Canvas 中的标签不能代替 DOM 表格和读屏解释。

## 与其他技术组合
可用 D07 TanStack Query 把 API 结果映射为 graph nodes/edges，缓存属于 Query，Graph 只负责可视化；使用 B16 面板调整画布时应监听容器尺寸而非 window resize。不要让 D3 和 G6 同时操作同一画布。

## 生产验证清单与当前结果
复现：在仓库根运行 `pnpm --filter @reactloom/library-lab catalog:check`、`typecheck`、`build`，并运行该条目浏览器 E2E。断言首次渲染、更新后边数量、窗口拉伸、StrictMode 重挂载以及资源清理。SDK / 构建 / 浏览器在本次开发批次均 **NOT_RUN**，不能把结构检查称为运行通过。

## 官方一手资料
- [G6 5.x React 集成](https://g6.antv.antgroup.com/en/manual/getting-started/integration/react)
- [Graph.destroy 等 API](https://g6.antv.antgroup.com/en/api/graph)
- [GitHub 仓库](https://github.com/antvis/G6)

许可证：MIT。
