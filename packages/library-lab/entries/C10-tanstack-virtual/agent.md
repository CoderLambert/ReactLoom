# C10 TanStack Virtual — 工程手册

## 适用

需要自己控制滚动标记的长列表。变高消息流若想少写定位，用 Virtuoso。虚拟化不拥有请求、权限或表格语义。

## 版本

`@tanstack/react-virtual@3.14.21`，MIT。API 是 `useVirtualizer`、`getItemKey`、`estimateSize`、`measureElement`、`getTotalSize`。`useFlushSync: false` 是本示例的 React 19 选择。

## 迁移

带走 `examples/example.tsx` 和 `examples/filter-policy.mjs`。保留滚动容器高度、总高度、`data-index` 和业务键。用无限查询替换一次性的 8,000 / 3,400 数组时，游标不要用 `row.index`。展开状态若要跨筛选保留，把它放到列表 `key` 外面。

## 不可删的清理

重复提交也要增加 view revision。`viewIdentity` 保持长度分隔的 JSON，不要改成拼接字符串。`stableRowId` 在越界或空 id 时抛错。滚动中的 `onChange` 不要每帧 `setState`。

## 反例

```tsx
useVirtualizer({ count, getScrollElement: () => null, estimateSize: () => 20 })
<div key={virtualRow.index} style={{ height: 94 }} />
```

- 没有 `getTotalSize` 占位。
- 同一行同时 `resizeItem` 和 `measureElement`。
- `directDomUpdates` 再手写 transform。
- 用虚拟下标当后端 cursor。
- 缺 id 时伪造 `missing-index`。
- 把未挂载行说成已经可被读屏器线性访问。

## 测试断言

- 查询规范化：NFC、去控制字符、最长 80 码点。
- `viewIdentity` 对 group、query、revision 三者编码，非法 revision 抛错。
- `stableRowId` 拒绝越界和空白 id。
- 策略测试没有滚动，也没有测量 DOM。

## 真实限制

没有横向虚拟化，没有分页语义表，没有 Query。8,000 和 3,400 是数组长度。分类选择是即时的，关键词要按按钮，这是当前示例的不一致之处，产品里应统一。

## 证据

没有收据不要写 PASS。Actions 41779873259 不是本条目。不要改 `verification.json`。
