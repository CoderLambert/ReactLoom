# D19 Fuse.js — Agent 最小迁移说明

## 何时推荐
产品内已有几百到几千条本地频道或标题，需要容错拼写、权重和离线排序；与后端全局搜索、大数据量索引分工明确。版本 fuse.js@7.5.0，Apache-2.0。

## 源码事实
examples/example.tsx 的 createArticleIndex() 和业务筛选组合可以复制到其他 React19 项目；examples/demo.tsx 仅是 Lab 适配，不要复制依赖主站。内容与源码从同一文件展示。

## 不可删的边界
1. 索引由当前 data 快照构建；数据更改后重新构建或 setCollection。
2. 搜索时显式指定 limit；查询权限和 tenant 必须先裁剪，Fuse 不提供 ACL。
3. 中文 IME composition 阶段不能提交旧查询。
4. search.match 只能生成文本节点/可控高亮，禁止注入不可信 HTML。
5. 维护稳定文档 id，区别 score 与业务相关性或权限。
6. 数据量大时记录索引构建耗时和主线程响应，必要时切 Worker/服务端。

## 测试契约
真实 fuse.js 包 node:test 断言排序、limit、setCollection；浏览器测中文输入与动态更新。未执行时 verification SDK/browser 保持 NOT_RUN。对比 D20 MiniSearch/D21 Pagefind 时不能只比虚构性能数字。

官方：https://www.fusejs.io/api/options.html
