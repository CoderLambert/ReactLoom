# D19 Fuse.js — Agent 最小迁移说明

## 何时推荐
产品内已有几百到几千条本地频道或标题，需要容错拼写、权重和离线排序；与后端全局搜索、大数据量索引分工明确。版本 fuse.js@7.5.0，Apache-2.0。

## 源码事实
examples/example.tsx 的 createArticleIndex() 和业务筛选组合可以复制到其他 React19 项目；examples/demo.tsx 仅是 Lab 适配，不要复制依赖主站。内容与源码从同一文件展示。

## 不可删的边界
1. 索引由当前 data 快照构建；数据更改后重新构建或 setCollection。
2. 搜索时显式指定 limit；查询权限和 tenant 必须在构建索引及 search limit 前先裁剪，Fuse 不提供 ACL；先搜索取前N条后过滤可能遗漏合法结果。
3. 中文 IME composition 阶段不能提交旧查询。
4. search.match 只能生成文本节点/可控高亮，禁止注入不可信 HTML。
5. 维护稳定文档 id，区别 score 与业务相关性或权限。
6. 数据量大时记录索引构建耗时和主线程响应，必要时切 Worker/服务端。

## 测试契约
真实 fuse.js 包 node:test 断言排序、limit、setCollection；浏览器测中文输入与动态更新。未执行时 verification SDK/browser 保持 NOT_RUN。对比 D20 MiniSearch/D21 Pagefind 时不能只比虚构性能数字。

官方：https://www.fusejs.io/api/options.html

## 级别切换与隐藏状态回归

迁移时必须一起复制 `examples/search-scope.mjs` 与 `search-scope.d.mts`，真实组件只从 `resolveScope` 取得生效分组/阈值，再调用 `visibleDocuments` 建立新的 Fuse 索引。basic 不可悄悄应用已隐藏的 business 分组，business 不可继承已隐藏的高级阈值。用 `tests/search-scope.test.mjs` 跑策略测试、`tests/sdk.test.mjs` 跑真实 Fuse 导入测试；前者不能算后者 PASS。

## 动态更新的源码交接

必须同时复制 examples/index-lifecycle.mjs 和 .d.mts：数据变更走 upsertDocument/removeDocument 的函数式 setDocs，不能原地 push/splice 或只刷新列表不重建 Fuse 实例。数据库回传重复 ID 应拒绝并上报，不能以数组索引作记录身份。重建索引必须基于真实新数据快照及当前生效分组/阈值，不能在旧索引先截断 limit 后才过滤。

进阶验收顺序：新增固定 ID 的 React 条目 → 同 ID 替换为 TypeScript → 删除 → 再次新增；旧词结果应随每次重建失效，源数组快照保持不变。纯策略 tests/index-lifecycle.test.mjs 与实际 Fuse tests/sdk.test.mjs 是两类不同证据，前者 PASS 不可填写 SDK PASS。
