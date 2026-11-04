# C09 React Virtuoso — 工程手册

## 适用

变高文章流和需要前插锚点的消息列表。固定行高、要自己定位 DOM 时用 TanStack Virtual。虚拟化不代替分页接口，也不代替表格语义。

## 版本

`react-virtuoso@4.18.19`，MIT。列表用 `computeItemKey`、`defaultItemHeight`、`firstItemIndex`、`followOutput`、`endReached`。不要把 C10 的 `getItemKey` 抄过来。

## 迁移

带走 `examples/example.tsx` 和 `examples/view-policy.mjs`。用 Query 的 `fetchNextPage` 替换 260ms 定时器。保留 generation、`pending` 和 view revision。前插继续一次更新数据和 `firstItemIndex`。

## 不可删的清理

搜索提交和卸载都要让进行中的定时器失效。`Virtuoso` 的 `key` 使用 `nextViewRevision`，相同查询也要换。展开状态的键是 `article.id`。组件卸载时增加 generation 并 `clearTimeout`。

## 反例

```tsx
<Virtuoso computeItemKey={index => index} followOutput="auto" data={items} />
```

- 前插时不改 `firstItemIndex`。
- `endReached` 没有门闩。
- 用可见下标当服务端 cursor。
- 复用上一份 `initialMeasurementsCache` 给新的筛选结果。
- 把未挂载行说成读屏器已经能读到。
- 在 item 里插入未净化的 RSS HTML。

## 测试断言

- 查询 NFC、去控制字符、最长 80 个码点。
- `nextWindowLimit` 不超过 total，非法数字抛错。
- revision 不能越过 `MAX_SAFE_INTEGER`。
- 这些断言没有创建 Virtuoso，也没有测量行高。

## 真实限制

数据是确定性 fixture。10,000 不是帧率。没有 `TableVirtuoso`，没有无限查询，没有 DOMPurify。business 的「加载」是 `setTimeout`。

## 证据

没有收据不要写 PASS。Actions 41779873259 不是本条目。不要改 `verification.json`。
