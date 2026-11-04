# C10 TanStack Virtual · Agent 实现规则

## 选择条件

需要基于现有设计系统自己控制列表 DOM 结构与尺寸时使用 @tanstack/react-virtual 3.14.21。一般变高列表可先比较 C09 Virtuoso，避免过度维护测量逻辑。React 19 项目核对 useFlushSync 配置。

## 可迁移文件与所有权

打开 examples/example.tsx，其中 VirtualList 是主要复用单元，SearchableFeed 是本地业务 fixture，examples/demo.tsx 仅重导出。不要直接复用 Lab 的 8,000 条虚构数据。生产项目由 Query/API 拥有远端数据、分页与重试，由 Virtualizer 拥有可见窗口，由业务 ID 拥有行身份。

## 改造时必须保留

- viewportRef 绑定实际滚动容器，要求明确 height/overflow。
- 占位 getTotalSize() 与每行 getVirtualItems() 的 translateY(start)。
- 每项包含 data-index 和 measureElement ref。
- getItemKey 必须使用业务稳定 ID；过滤/排序身份变化时定义缓存重置。
- 动态高度避免同时强行固定 size；卸载滚动容器后不保留旧观察器。
- 焦点键盘、屏幕阅读器与非虚拟化导出/分页替代。

## 应验收的边界

不同高度、滚动至首/末、动态展开、搜索后旧索引清理、行 ID 保留、IME、React19滚动警告、宽窄屏以及浏览器真实 ResizeObserver。不能用纯 Node 数据切片断言声称虚拟化成功。当前SDK/build/browser标 NOT_RUN。

官方：https://tanstack.com/virtual/latest/docs/framework/react/react-virtual

## 当前关键补丁

复制 `examples/filter-policy.mjs` 与声明：`getItemKey` 通过 `stableRowId(items,index)` 获取当前行 ID（缺失立即暴露），`viewIdentity(group,query,revision)` 将相同条件的二次搜索区别为新虚拟视图。过滤后保持 React 的 keyed remount 清空旧尺寸缓存。检查 `tests/filter-policy.test.mjs`，但不要把其纯 Node PASS 解释成 ResizeObserver 或 React 实际渲染验收。
