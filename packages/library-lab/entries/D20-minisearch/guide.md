# MiniSearch 7.2.0｜先裁索引，再搜索和联想

Lab 锁定 `minisearch@7.2.0`（MIT）。它为文档建倒排索引，支持前缀、轻微模糊和 `autoSuggest`。相关性分数越高越匹配。这和 Fuse.js 的“越小越近”相反。它仍然只搜索你放进索引的那些文档。

没有匹配收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 是仓库级结果，不是本条目 PASS。

## Lab 当前示例

[`examples/demo.tsx`](examples/demo.tsx) 重导出 [`examples/example.tsx`](examples/example.tsx)。`buildMiniIndex` 的字段是 `title` 和 `summary`，`storeFields` 只有 `title` 和 `group`。默认搜索选项 `boost: { title: 3 }`、`prefix: true`、`fuzzy: 0.2`。

[`examples/scope-policy.mjs`](examples/scope-policy.mjs) 的 `scopeSearchDocuments` 在 `addAll` 之前按分组复制或过滤。「全部」返回浅拷贝，避免索引和调用方共享后被意外改写。分组不是授权。无权文档根本不要出现在 `documents` 里。

查询在表单提交时从 draft 写入。`compositionstart` / `compositionend` 挡住组合期间的提交。空查询列出当前范围内的文档，不调用 `search`。

非空查询调用 `index.search`，`fuzzy` 在 advanced 可以由复选框关掉，`prefix` 保持打开。`filter` 再确认 id 仍在 `scopedDocs` 里，然后才 `slice(0, 20)`。先截断再过滤会让当前分组的命中被挤掉。

advanced 的 `autoSuggest` 使用同一个 `index`，所以建议词不会来自未选中的分组。更新 id 为 `1` 的标题和摘要会 `setDocuments`，`useMemo` 重建索引。旧词不应再作为那一篇的标题命中。

结果用文本渲染。不插入 MiniSearch 的高亮 HTML。

没有挂载：自定义中文分词器、持久化索引、服务端查询。默认 tokenizer 不是专业中文分词，短中文查询可能不如英文标题稳定。

## 什么时候用

文档数超过手写扫描、又需要前缀和拼写容错时用 MiniSearch。很小的列表、主要靠字段权重和错拼时，Fuse 更直接。已经生成的静态 HTML 用 Pagefind，避免把正文都下载到浏览器再建索引。

UI 分类必须在建索引前裁掉。只在渲染时隐藏 `<li>` 会让 `autoSuggest` 泄露其他组的词。

## 模型

`new MiniSearch({ fields, storeFields, searchOptions })` 然后 `addAll`。`fields` 是被分词的内容。`storeFields` 是结果里要带回的原文。Lab 的摘要不在 `storeFields` 里，展示时用 id 回查原文档，这样替换文档后不会从旧存储字段读到旧摘要。

`search` 返回带 `id` 和 `score` 的结果。`fuzzy: 0.2` 允许轻微错拼；`false` 关掉它。`prefix: true` 让未输完的词仍能命中。`boost` 提高标题相对摘要的权重。

`autoSuggest` 走同一索引。它不是独立的安全通道。范围必须已经体现在索引内容上。

更新策略是改不可变数组并重建。也可以 `remove` 再 `add`，但要保证旧 id 被移除。Lab 用重建，避免半更新。

## 三层示例

### 基本

默认词 `React`。没有分类控件，索引包含全部种子。每条显示分数，文案写明越高越匹配。

### 业务

分类变成技术、产品或开源。切换后建议和搜索都只看见该组。这仍是 fixture 上的滤镜。

### 进阶

可以关掉模糊。建议最多三条。更新第一篇标题后，索引随 `documents` 变化重建，新标题能被搜到。

## 反例

### 反例 1：只过滤渲染结果

```tsx
const hits = index.search(query).filter(hit => byId.has(hit.id))
```

若索引是全量的，`autoSuggest` 仍会吐出其他组的词。

```tsx
const index = buildMiniIndex(scopeSearchDocuments(documents, group))
```

### 反例 2：先 slice 再按组过滤

```ts
index.search(query).slice(0, 20).filter(hit => hit.group === group)
```

前 20 条可能全是别的组。

```ts
index.search(query, { filter: result => byId.has(String(result.id)) }).slice(0, 20)
```

### 反例 3：用 Fuse 的分数方向写 UI

MiniSearch 分数越高越相关。不要写“越小越相似”。

### 反例 4：把建议词插进 HTML

```tsx
dangerouslySetInnerHTML={{ __html: hit.suggestion }}
```

建议是纯文本，用字符串拼接进句子即可。

### 反例 5：改标题不重建

旧倒排仍指向旧 token。`setDocuments` 必须让 `useMemo` 依赖到新数组。

### 反例 6：假设中文按词切开

默认分词对英文标题更可预期。中文产品搜索要单独换 tokenizer，并准备语料测试。本示例没有换。

## 组合

**Fuse**：交互式小列表可以两套都试，但分数不能混在一个排序里。权限裁剪放在共用的上游数组。

**Pagefind**：公开站点走构建期索引。MiniSearch 留给浏览器里会变的那一小撮文档。

**Query**：搜索词提交后再改查询。不要每个 `onChange` 都重建大索引。Lab 的种子很小，重建是为了正确性。

## 生产核对清单

1. `addAll` 的数组已经按授权和分组裁过。
2. `autoSuggest` 与 `search` 共用该索引。
3. `filter` 在 `slice` 之前。
4. 分数文案与 Fuse 区分开。
5. 更新或删除后旧 token 消失。
6. IME 组合期间不提交。
7. 不渲染 HTML 高亮。
8. 中文语料有单独的命中测试，不把英文标题的结果当成中文分词证明。

## 升级

钉 `minisearch@7.2.0`。升级后重跑前缀、`fuzzy: 0.2` 与 `fuzzy: false`、以及分组索引不含他组建议词。分词器变化会悄悄改命中集合。

不要为了存储字段方便把正文秘密放进 `storeFields`。结果对象可能被日志打印。

## 验收

- `React` 与其前缀能命中标题，分数方向是越高越近。
- 分组索引的 `autoSuggest` 不返回其他组的词。
- 过滤发生在截断之前；更新标题后旧文案不再命中。
- 「全部」不修改源数组。
- 未知分组得到空的可见集合（策略函数的合同）而不是全量。
- `tests/sdk.test.mjs` 导入真实 `minisearch`。无收据则 NOT_RUN。

重建索引用 `useMemo` 依赖 `scopedDocs`。原地 `documents.push` 不会换引用，索引会停在旧词上。更新按钮必须返回新数组。

## 资料

- https://lucaong.github.io/minisearch/
- https://github.com/lucaong/minisearch
- https://www.npmjs.com/package/minisearch
