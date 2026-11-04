# D20 MiniSearch — 工程手册

## 适用

浏览器里的小文集倒排搜索。它不是 Fuse，分数不能混用。它也不是权限层。

## 版本

`minisearch@7.2.0`。字段、boost、prefix、fuzzy 以示例为准。

## 迁移

带走 `examples/example.tsx` 和 `scope-policy.mjs`。先得到允许搜索的文档，再 `addAll`。`search` 和 `autoSuggest` 用同一索引。

## 不可删的清理

更新用 `replace` 或按 id `discard`，不要对改过的对象 `remove`。组合输入期间不要查询。卸载时丢掉索引引用。

## 反例

- 相同 id 再 `add`。
- 建完全部文档再按权限过滤。
- 把 fuzzy 开到 0.8 覆盖短词。
- 用 innerHTML 高亮。
- 把 MiniSearch 分数当成 Fuse 的 threshold。
- 假设默认分词能做中文。

## 测试断言

- 分组外的文档不会出现在搜索或建议里。
- 替换标题后旧词消失。
- 截断发生在过滤之后。
- 策略单测不是 SDK 通过。

## 真实限制

没有 Worker，没有 vacuum，没有持久化索引。storeFields 不含摘要。

## 证据

没有收据不要写 PASS。
