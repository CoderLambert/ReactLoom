# A07 AntV G6 — 工程手册

## 适用

`@antv/g6@5.1.1` 画关系网。可编辑端口和 DAG 约束用 A06，静态 DSL 用 A08。Lab 用固定坐标的圆和箭头，behavior 只有拖动画布和缩放。不要把每次数据变化都写成 `new Graph`。

## 版本

包名 `@antv/g6@5.1.1`。不要 `import from 'g6'`，不要混入 v4 `changeData` / `save` / `read`。React 扩展包不在本条目依赖里。MIT 不覆盖外部字体、底图和图片。

## 迁移

v4 数据入口改成 `setData` + `render`。只改变样式时 `updateNodeData` + `draw`。节点 id 改为稳定业务 id，边在投影前检查端点。Lab 现在把 `extended` 放进 effect 依赖，勾选会销毁重建；迁到增量更新时保留 `disposed`，避免对已销毁实例 `setSize`。

## 不可删的清理

cleanup 设置 `disposed`，`observer.disconnect()`，`cancelAnimationFrame`，`graph.destroy()`。`render()` 的 then/catch 在 `disposed` 后不得 `setState` 或 `observe`。宽度小于 1 或非有限时不调用 `setSize`。

## 反例

```ts
if (host.current) new Graph({ container: host.current, data }); // 错：在 render 中
// 对：effect 内构造；换数据 graph.setData(data); await graph.render();
```

用下标当 id、`clientX` 写入 `style.x`、用 PNG 代替 JSON、改颜色却 `render()`，都不要做。

## 测试断言

`measuredGraphWidth` 拒绝无效宽度并封顶 4096。SDK 收据还要看到真实 `Graph` 构造、`render`、`setSize`、`destroy`，以及 StrictMode 下 canvas 不累积。没有 runs 收据则为 NOT_RUN。

## 真实限制

没有 dagre、节点拖拽、点击事件、PNG、HTTP 修订。节点数是 3 或 4。列表是文本等价物，不是画布命中。没有 FPS 或 GPU 数字。`labelText` 与列表文案必须来自同一次 `dataset()`。

## 断言边界

`tests/graph-sizing.test.mts` 只夹宽度。SDK 用例要 `import { Graph } from '@antv/g6'`，等待 `render()`，在 `destroy()` 之后不再 `setSize`。勾选审校若仍走重建，测试应看到旧实例已销毁。缺收据时保持 NOT_RUN。数据更新优先 `setData` 加 `render`，不要把 Lab 的整实例重建当成唯一写法。颜色变化用 `draw`。

## 证据

Actions `41779873259` 的仓库级 install、typecheck、build、52 SDK 文件（153 测试）和 45 Playwright 不是 A07 PASS。不要把宽度测试或历史研究 PASS 写入 `verification.json`。

对照 `library.json` 的版本编写 import，不要升到条目未钉死的版本。
`tests/` 中的策略用例不能改写成 sdk 字段的 PASS。
浏览器与构建未留下收据时，对应字段维持 NOT_RUN。
