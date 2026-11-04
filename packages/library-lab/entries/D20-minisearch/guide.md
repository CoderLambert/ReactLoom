# MiniSearch 7.2.0｜倒排索引，分数不是 Fuse 的分数

Lab 锁定 `minisearch@7.2.0`。它为标题和摘要建倒排索引。默认分词不是中文专业分词。它也不是权限系统。

没有逐库收据时不要写 PASS。Actions 41779873259 是仓库级结果。

## Lab 当前示例

[`examples/example.tsx`](examples/example.tsx) 调用真实的 `MiniSearch`。[`examples/scope-policy.mjs`](examples/scope-policy.mjs) 先按分组留下文档。

已挂载：

- `fields` 是 `title` 和 `summary`。`storeFields` 只有 `title` 和 `group`，所以命中对象上不要假设还有完整摘要。
- 建库时的默认搜索是 `boost: { title: 3 }`、`prefix: true`、`fuzzy: 0.2`。
- 索引按 `scopedDocs` 重建。`autoSuggest` 和 `search` 用同一份索引，避免建议泄漏其他分组的词。
- 搜索再带 `filter`，只保留仍在这份集合里的 id，然后 `slice(0, 20)`。先过滤再截断。
- advanced 才调用 `autoSuggest`，最多 3 条。
- 组合输入用 ref 挡住未完成的查询。更新文档走替换而不是再 `add` 一个相同 id。

没有挂载：Comlink Worker、Dexie 持久化、`vacuum`、`loadJSON`。分组是 UI 分类，不是上游授权。

## 1. 反例

### 反例 1：改完内容再 remove 旧对象

`remove` 需要索引里的原文。先改 title 再 remove，可能删不掉。保留快照再 `remove`，或用 `replace` / `discard(id)`。

### 反例 2：用 add 更新同一 id

id 唯一。再 `add` 不是更新。用 `replace`。

### 反例 3：discard 之后以为内存立刻没了

逻辑删除不等于马上 compact。需要时再 `vacuum`。Lab 用新索引替换旧的，不在页面上 vacuum。

### 反例 4：loadJSON 配一套新的字段

分词和字段必须和当初建库一致。Lab 不加载外部 JSON 索引。

### 反例 5：默认分词搜索整句中文

连续中文可能召不回。要 `Intl.Segmenter` 或专门分词时，建库和查询用同一套，并准备回归句。不要把 Fuse 的 threshold 套到 MiniSearch 的 score 上。

### 反例 6：所有短词都 fuzzy: 0.8

噪声和 CPU 会上去。Lab 的模糊度是 0.2，并且可以关掉。短查询优先前缀。

### 反例 7：在 render 里同步建巨大索引

会卡住点击。大数据放 Worker，卸载时丢掉索引。Lab 只有 6 篇，不能当成容量证明。

### 反例 8：浏览器里索引全部文档再按权限过滤

机密已经进了内存，建议词也会漏。授权后的集合才能 `addAll`。Lab 的分组演示不是 ACL。

### 反例 9：高亮用 innerHTML

标题用文本节点。不要 `replace` 出 `<mark>` 字符串再写进 HTML。

## 2. 组合

**Comlink**：索引可以住在 Worker 里，但要 `releaseProxy` 和 `terminate`。Lab 没有这条。

**Dexie**：索引的 revision 要和文档版本一起变。不要把搜索分当持久排序键。

## 3. 练习

1. 切到一个分组，确认建议词里没有其他分组的标题。
2. 替换一篇的标题，旧词不再命中，新词可以。
3. 关掉模糊后，差一个字母的查询应掉出结果。

## 4. 证据

`scope-policy` 不 import MiniSearch。sdk PASS 需要真实库的收据。

## 5. 资料

- https://lucaong.github.io/minisearch/
- https://www.npmjs.com/package/minisearch
