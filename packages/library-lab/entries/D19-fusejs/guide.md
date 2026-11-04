# Fuse.js 7.5.0｜先缩小集合，再模糊匹配

Lab 锁定 `fuse.js@7.5.0`。它在内存里做模糊查找。它不是权限系统，分数也不是概率。中文不能假设默认分词够用。

没有逐库收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 是仓库级结果，不是本条目 PASS。

## Lab 当前示例

[`examples/example.tsx`](examples/example.tsx) 用真实的 `new Fuse` 和 `search`。[`examples/search-scope.mjs`](examples/search-scope.mjs) 决定这一层看哪些分组。[`examples/index-lifecycle.mjs`](examples/index-lifecycle.mjs) 用不可变数组按 id 插入或替换。

已挂载：

- 键是 `title`（0.65）、`summary`（0.25）、`tags`（0.10）。`includeScore` 和 `includeMatches` 打开。`ignoreLocation: true`。`threshold` 由层级决定，界面上的滑块不会在 basic 里偷偷放宽。
- 先 `visibleDocuments`，再 `useMemo` 建索引。查询变化只调用 `search`，不每次按键 `new Fuse`。
- 空查询返回当前范围内的文档，不把「没打字」显示成零条。
- `search(..., { limit: 20 })` 发生在范围过滤之后。
- 同一 id `imported-rss` 先添加再替换。替换后旧标题不能再被当成命中。删除走 `removeDocument`，然后用新数组重建 Fuse。
- 输入法用 ref 记下组合状态，组合期间不把草稿提交成查询。

没有挂载：`parseIndex`、Worker、`useExtendedSearch`、把 matches 画成高亮 DOM。UI 分组是演示分类，不是租户 ACL。

## 1. 反例

### 反例 1：每次输入新建 Fuse

```tsx
onChange={(event) => new Fuse(docs, options).search(event.target.value)}
```

索引跟数据走，搜索跟查询走。Lab 的 `useMemo` 依赖 `scopedDocs` 和阈值。

### 反例 2：把结果下标当 id

排序和删除之后下标会变。用 `item.id`。

### 反例 3：先 limit 再按来源过滤

高分结果可能被裁掉，过滤后变成空。先限定可搜索集合，再 `limit`。

### 反例 4：把 score 当永久阈值

0.3 在换版本或换语料后含义会变。用一组固定查询做回归，不要把某次分数写成业务规则。

### 反例 5：用 innerHTML 画高亮

```ts
node.innerHTML = text.replace(word, '<mark>$&</mark>')
```

标题里可以有 `<`。用文本节点，或按 `matches` 的区间切文本再包 `<mark>`。Lab 只列出命中的字段名。

### 反例 6：改了对象却留着旧索引

`docs[0].title = ...` 之后旧 Fuse 仍返回旧字符串。用新快照重建，或 `remove` 再 `add`。不要改私有 `_docs`。同 id 替换必须让旧词失效。

### 反例 7：反序列化索引不核对主人

`Fuse.parseIndex` 之前要核对 schema、版本和数据集哈希。不要把 A 用户的索引给 B。Lab 不恢复序列化索引。

### 反例 8：中文查询照搬英文分词

连续中文可能整段对不上。需要同义词字段或 `Intl.Segmenter` 时要在目标浏览器上测，不要从英文标题的演示推断。

## 2. 组合

**Query**：搜索框的请求取消归 Query。Fuse 的同步 `search` 停不下来；若结果写回 React，用代数丢掉过期的那一次。

**MiniSearch**：分数不能互相比较。换库时重做查询集。

## 3. 练习

1. 把「Ract」打进去，确认故意拼错的那条能出现，并且分数只作本次排序。
2. 替换 `imported-rss` 的标题后，旧词不再命中。
3. 先选一个分组再搜索，结果里没有别的分组。

## 4. 证据

`search-scope` 和 `index-lifecycle` 不 import Fuse。sdk PASS 需要真实 `fuse.js` 收据。

## 5. 资料

- https://www.fusejs.io/
- https://www.npmjs.com/package/fuse.js
