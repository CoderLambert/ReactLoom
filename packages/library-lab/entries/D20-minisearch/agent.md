# D20 MiniSearch — 工程手册

## 适用

浏览器内会变化的文档集合：倒排索引、前缀、轻微错拼和查询建议。分数越高越相关。

分组和授权都要在 `addAll` 之前完成。不要把 Fuse 的分数方向抄过来，也不要输出 HTML 高亮。默认分词不是中文分词器。

## 版本

`minisearch@7.2.0`，MIT。字段 `title`、`summary`；存储字段 `title`、`group`；标题 `boost` 为 3；`prefix: true`；`fuzzy` 默认 0.2。

advanced 可以把 `fuzzy` 设为 `false`。建议最多 3 条，搜索结果最多 20 条。

## 迁移

在已有React/TypeScript工程执行 `pnpm add minisearch@7.2.0`。复制example.tsx、runtime.mjs/runtime.d.mts、scope-policy.mjs/scope-policy.d.mts，保持相对路径；demo.tsx仅适配。runtime导出initialDocs/buildMiniIndex/updateFirstDocument，UI和SDK测试共用。TS使用bundler解析；无需Provider、环境、CSS插件或后台服务。卸载释放局部索引/state，没有外部资源；重挂载恢复种子。

updateFirstDocument返回新数组并替换id1的Suspense为Streaming，旧词消失、新词出现。scope helper对全部浅复制数组，不深克隆对象；禁止原地修改种子。搜索与autoSuggest均使用同一scopedDocs索引。组合态/isComposing/keyCode229时不提交。

## 不可删的清理

`scopeSearchDocuments` 对「全部」返回拷贝。过滤后的数组才进入 `MiniSearch`。

`autoSuggest` 不得另建一个全量索引。

组合输入期间不要 `setQuery`。

## 反例

- 全量索引，只在 JSX 里按组隐藏。
- `slice` 之后再做分组过滤。
- 写成“分数越小越好”。
- `dangerouslySetInnerHTML` 渲染建议词。
- 改标题后继续用旧索引。
- 把 UI 分类当成后端 ACL。
- 用英文结果声称中文分词已验证。
- 把秘密正文放进 `storeFields`。

## 测试断言

- 真实 MiniSearch 能按标题和前缀命中。
- 过滤在截断前；内容更新后重建索引，旧词消失。
- `autoSuggest` 只来自当前分组的索引。
- 「全部」不修改源数组；未知分组为空。
- `tests/sdk.test.mjs` 导入真实 `minisearch`。无收据则 NOT_RUN。

## 真实限制

六篇种子，没有持久化索引，没有自定义 tokenizer。连续中文默认不按语义拆词，完整token命中不证明内部词召回。模糊 0.2 是演示。建议列表不是完整词典。

分类名是 fixture。真实 ACL 必须在数据进入组件之前完成。

## 证据

sdk、build、browser 保持 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有匹配收据。Actions 41779873259 不是本条目 PASS。不要改 `verification.json`。
