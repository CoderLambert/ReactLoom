# Fuse.js 7.5.0｜先缩小集合，再模糊匹配

Lab 锁定 `fuse.js@7.5.0`（MIT）。`Fuse.search` 在浏览器里对当前数组做加权模糊查找。分数越小越接近。它不是服务端全文索引，也不是权限系统。大文档集合应比较 D20 MiniSearch 或 D21 Pagefind。

没有匹配收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 是仓库级结果，不是本条目 PASS。

## Lab 当前示例

[`examples/demo.tsx`](examples/demo.tsx) 重导出 [`examples/example.tsx`](examples/example.tsx)。索引在 `createArticleIndex`：`includeScore` 和 `includeMatches` 打开，`ignoreLocation: true`，键权重 title 0.65、summary 0.25、tags 0.10。阈值来自当前层级，不来自隐藏控件的残留值。

[`examples/search-scope.mjs`](examples/search-scope.mjs) 的 `resolveScope`：basic 强制分组「全部」、阈值 0.35；business 使用可见分组，阈值仍是 0.35；advanced 才接受 0、0.15、0.35、0.55。未知分组落到「全部」。`normalizeQuery` 做 NFC，去掉控制字符，trim，并按码点截到 80。输入框 `maxLength` 是 120，真正搜索用规范化后的查询。

`visibleDocuments` 在建索引之前按分组过滤。注释写明分组是 UI 滤镜，不是 ACL。`search` 的 `limit: 20` 作用在已经缩小的集合上。空查询不调用 search，直接列出当前分组的文档，分数为 null。

advanced 用 [`examples/index-lifecycle.mjs`](examples/index-lifecycle.mjs)。`upsertDocument` 按 id 替换或追加，返回新数组。`removeDocument` 按 id 过滤。重复 id 或空 id 在重建索引前抛错。替换「imported-rss」后，旧标题里的 React 不应再被这张新索引命中。组件每次用 `useMemo` 从最新数组 `new Fuse`。

IME：`compositionstart` 把 `composing` 设为真，提交时若仍在组合则不把 draft 推进 `query`。

结果用文本节点渲染标题和摘要，不把命中片段插成 HTML。

没有挂载：服务端索引、高亮 HTML、多租户 ACL。阈值面板在 basic 和 business 上不出现，隐藏值也不能改变有效阈值。

## 什么时候用

几百条以内、字段权重和错拼容忍重要时用 Fuse。需要倒排、前缀和联想时看 MiniSearch。静态站点在构建期出索引用 Pagefind。需要权限过滤时，在建索引之前丢掉无权文档，而不是在结果里再藏一行。

Fuse 的分数是距离，越小越好。不要把 MiniSearch 的“越高越相关”抄过来。

## 模型

构造函数接收文档数组和选项。`threshold` 越低越严格，0 接近精确。`ignoreLocation` 让匹配不依赖词在字段里的位置。`keys` 的 `weight` 决定标题比摘要更重要。

`search(query, { limit })` 返回 `{ item, score, matches }`。Lab 把 `matches` 收成字段名列表。泛型不会在运行时验证文档。

`setCollection` 会换掉索引所用的数组引用意义上的内容；Lab 选择每次用新的不可变快照 `new Fuse`，避免在旧实例上原地改调用方数组。测试要求重建后的索引不再包含已删除或已替换的正文。

索引不是安全边界。先 `visibleDocuments`，再构造 Fuse。若先索引全部文档再在结果上按组过滤，`limit` 可能被别的组占满，当前组一条都看不到。

## 三层示例

### 基本

默认查询 `React`。分组控件不出现，有效分组是全部，阈值 0.35。带「Ract」错拼的那条可以因为模糊匹配出现。分数显示在每条下面。

### 业务

可以选择技术、商业或开源。切换分组会重建索引，而不是只隐藏 `<li>`。搜索仍在提交时发生，组合输入不提交。

### 进阶

改阈值后用同一查询比较条数。新增 `imported-rss` 后应能找到 React Query 那条。同 id 替换成 TypeScript 标题后，旧 React 句子不再属于该 id。删除后条数回到种子。未知 id 的删除返回原数组。

## 反例

### 反例 1：结果 HTML 拼接

```tsx
<li dangerouslySetInnerHTML={{ __html: hit.item.summary }} />
```

```tsx
<li><strong>{item.title}</strong><p>{item.summary}</p></li>
```

### 反例 2：先搜索再按权限过滤

```ts
engine.search(query, { limit: 20 }).filter(hit => hit.item.group === group)
```

无权或他组文档会占满 limit。

```ts
const engine = new Fuse(visibleDocuments(docs, group), options)
engine.search(query, { limit: 20 })
```

### 反例 3：原地改文档还用旧 Fuse

```ts
docs[0].title = '新标题'
engine.search('新标题')
```

旧索引仍可能命中旧词。

```ts
setDocs(old => upsertDocument(old, next))
```

然后用新数组构造 Fuse。

### 反例 4：basic 仍沿用 advanced 的阈值

用户在 advanced 选了 0.55，切回 basic 时若直接读 state，容错会变宽。`resolveScope` 在 basic 和 business 把阈值钉在 0.35。

### 反例 5：把分组当成 ACL

下拉框是客户端状态。真正的租户过滤发生在可信数据进入 `docs` 之前。

### 反例 6：用分数排序规则套到别的库

Fuse 越小越近。展示时不要写成“越高越匹配”。

## 组合

**MiniSearch**：同一份已授权数组可以另建倒排索引做前缀。不要混用两种分数的文案。Lab 的 D20 是独立条目。

**Pagefind**：已发布的静态 HTML 走构建期索引，而不是把整站文章下载到 Fuse。

**Query**：搜索框的提交词可以进 queryKey。Fuse 只过滤已经下载并且允许看见的那一页时，要在文案里说明这不是全库搜索。

## 生产核对清单

1. 建索引前按授权和分组缩小数组。
2. `limit` 加在缩小之后。
3. 同 id 替换和删除都会丢掉旧 token。
4. 层级切换时隐藏控件不能改变有效阈值或分组。
5. 查询去掉控制字符并限制长度。
6. IME 组合期间不提交。
7. 结果是文本，不是 HTML。
8. 空查询的含义写明：当前分组的全部文档，不是一次空字符串搜索的分数。

## 升级

钉 `fuse.js@7.5.0`。升级后用固定文档集比较 `threshold` 0 与 0.35 的命中 id，避免默认分数公式变化不被发现。不要改权重而不更新验收列表。

从旧版 `keys: ['title']` 迁到带权重的对象时，重测摘要里的词是否还会压过标题。

## 验收

- `React` 查询命中带标题权重的文档，并返回 id 与分数。
- `limit` 生效；索引本身不含未授权分组时，那些文档不会出现。
- basic 忽略界面上残留的分组和 0.55 阈值。
- 同 id 替换后旧标题不再被索引；删除后该 id 消失。
- 重复 id 在 `upsert` 前抛错。
- 控制字符被去掉，超长查询被截断。
- `tests/sdk.test.mjs` 导入真实 `fuse.js`。无收据则 NOT_RUN。

空查询列出当前分组，是为了让阈值实验有可见的全集。不要把这个行为抄成“空字符串应该匹配所有字段得分”。

## 资料

- https://www.fusejs.io/
- https://www.fusejs.io/api/options.html
- https://www.fusejs.io/api/methods.html
- https://github.com/krisk/Fuse
