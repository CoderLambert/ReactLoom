# TanStack Virtual · Headless 虚拟滚动与尺寸模型

## 解决什么问题

当一个列表有数千个 DOM 记录，布局和绘制可能变慢。@tanstack/react-virtual 管可见索引、尺寸估计、滚动位置与测量，但不提供视图 CSS、列表 API 或服务器分页。适合高度定制的 RSS 卡片、审计日志、与 TanStack Table 联动的复杂表格。

基线 @tanstack/react-virtual 3.14.21（MIT）；固定 React 19 的 Demo 使用 useFlushSync:false，以避免某些 scroll 生命周期内同步 flush 的警告。若只需普通变高列表且希望更少布局细节，优先比较 C09 React Virtuoso。

## 安装与完整源码

~~~bash
pnpm add @tanstack/react-virtual@3.14.21
~~~

真实组件为 examples/example.tsx；examples/demo.tsx 不写第二份逻辑。最小 API：

~~~tsx
const parentRef = useRef<HTMLDivElement>(null);
const virtualizer = useVirtualizer({
  count: items.length, getScrollElement: () => parentRef.current,
  estimateSize: () => 94,
  getItemKey: index => items[index].id, overscan: 5, useFlushSync: false,
});
~~~

滚动元素要有高度与 overflow:auto。总尺寸占位使用 getTotalSize()；每条真实 DOM 设 data-index、ref={virtualizer.measureElement} 和 translateY(row.start)。缺任意一层，虚拟滚动可能空白、跳动或高估。

## 三层实战

**入门**：8,000 条不同摘要高度，显示实际 DOM 窗口数量，跳转靠近底部与返回顶部。

**业务**：分类+搜索过滤 3,400 条虚构 RSS；使用业务 id 而非 index 作为 getItemKey；变更过滤后重新挂载 VirtualList，避免错误继承旧结果集的测量索引。这些数据全部在内存中，不是网络分页。

**进阶**：长段落展开/收起触发 ref 重新测量，显示滚动窗口与深度跳转。需要向上插入新数据时，TanStack Virtual 没有可无脑使用的 firstItemIndex 接口，必须设计自己的锚点/偏移恢复，不能从本示例推断完整聊天前插功能。

## 关键数据流

业务数据→稳定 ID→虚拟化 count/estimateSize→getVirtualItems()→绝对定位行→ResizeObserver/measureElement→滚动位置观测。所有挂载的可见行必须把 row.index 交给 data-index，以便测量关联回正确索引。getItemKey 返回稳定唯一值；业务排序/分页变化时要明确定义视图重置还是滚动恢复。

React 19 中可使用 useFlushSync:false 防止同步刷新警告，但这影响渲染节奏；不要未经业务测试在生产全局关闭。estimateSize 只是起始估计，不等于最后测量。复杂动态尺寸可结合 resizeItem，但与同元素 measureElement 的双重测量需避免冲突。

## 专属反例

1. **只裁剪 data 而缺高度占位**：滚动条尺寸错误；使用 getTotalSize + 绝对定位。
2. **漏写 data-index**：measureElement 不能可靠定位行索引；保持 DOM data-index。
3. **index 当稳定 key**：分页和排序后错误地复用行；getItemKey 使用业务 ID。
4. **假设虚拟化自动加载后台数据**：需要独立 pagination/cache 层，C07 的 Table 也不代替网络。
5. **展开后不重新测量**：动态高度误差持续累积；绑定 ref 测量并避免冲突的 CSS。
6. **未考虑无障碍**：窗口之外的行不在 DOM，长列表应有查询/分页/跳转的可访问替代路径。

## 组合与验证

和 C07 TanStack Table 组合时 Table 管行排序过滤，Virtual 管可见视图；和 D07 TanStack Query 组合时 Query 拥有分页缓存与请求取消。性能验证以真实设备和 Chromium 收集可见 DOM 数、滚动/交互响应为主，禁止填报虚构 FPS。当前SDK/TS/构建/浏览器均未执行，详见 verification.json。

官方：https://tanstack.com/virtual/latest/docs/framework/react/react-virtual 和 https://tanstack.com/virtual/latest/docs/api/virtualizer

## 补充：查询身份与行键不应复用

原先只用 `category + '|' + query` 作为组件 key，同条件重新提交不会清掉前一批测量缓存，且字符串拼接存在分隔符歧义。现在实际组件调用 `examples/filter-policy.mjs` 的 `viewIdentity`（数组 JSON 编码加递增 revision）区分每次有效提交，用 `stableRowId` 强制按当前列表获得有效业务 ID，不在错误索引时悄悄降级为 `missing-0`。 `getItemKey` 由 useCallback 绑定数据快照，减少不必要的虚拟化 option 重建。纯 Node 回归覆盖排序后 ID、非法索引、长 Unicode 查询、重复搜索的视图身份；真正动态测量、焦点和 Chromium 滚动仍然 NOT_RUN。
