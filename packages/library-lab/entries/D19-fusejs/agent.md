# D19 Fuse.js — 工程手册

## 适用

浏览器内的小集合加权模糊搜索。先缩小可见文档，再 `new Fuse` 和 `search`。分数越小越相似。

不要把它当成 ACL、服务端搜索或 HTML 高亮器。数据量上来后改评估 MiniSearch 或 Pagefind。

## 版本

`fuse.js@7.5.0`，MIT。选项包含 `includeScore`、`includeMatches`、`ignoreLocation`、字段权重和 `threshold`。

basic 与 business 的有效阈值固定 0.35。只有 advanced 接受列出的四档。

## 迁移

从 [`examples/example.tsx`](examples/example.tsx) 带走 `createArticleIndex` 和提交时才更新的查询。范围来自 [`examples/search-scope.mjs`](examples/search-scope.mjs)，增删改来自 [`examples/index-lifecycle.mjs`](examples/index-lifecycle.mjs)。

每次文档快照变化都重建 Fuse。不要在旧实例上改调用方数组。

渲染保持文本节点。

## 不可删的清理

`resolveScope` 在离开 advanced 时丢掉隐藏阈值，在 basic 时丢掉隐藏分组。不要直接把 React state 传进 `new Fuse`。

`normalizeQuery` 在提交时执行。组合期间 `composing` 为真则不更新 `query`。

`upsertDocument` 拒绝重复 id。替换返回新数组，旧对象不被原地修改。

## 反例

- `dangerouslySetInnerHTML` 渲染摘要。
- 先 `search` 再按组过滤，导致 `limit` 被占满。
- 改了标题仍用旧 Fuse。
- 把 UI 分组当成授权。
- basic 沿用 advanced 的 0.55。
- 用 MiniSearch 的“高分更好”描述 Fuse。
- 空查询误走 `search('')` 却不说明语义。
- 控制字符进入索引查询。

## 测试断言

- 真实 Fuse 返回带 id 的排序结果。
- `limit` 生效，且库本身不会偷偷做分组权限过滤。
- `setCollection` 或重建索引不修改调用方数组，并丢掉旧词。
- 活动层级的阈值和分组与隐藏控件无关。
- 同 id 替换、删除、移出当前分组后，旧文本不再命中。
- 重复 id 和坏 id 在重建前失败。
- `tests/sdk.test.mjs` 导入真实 `fuse.js`。无收据则 NOT_RUN。

## 真实限制

种子只有六篇。没有网络。中文查询依赖 Fuse 的默认分词，不是专业中文分词器。`ignoreLocation` 是演示选择。

分组「技术 / 商业 / 开源」是 fixture 标签。

## 证据

sdk、build、browser 保持 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有匹配收据。Actions 41779873259 不是本条目 PASS。不要改 `verification.json`。
