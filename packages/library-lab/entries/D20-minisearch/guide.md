# MiniSearch — ReactLoom 工程实战

## 定位与适用范围

MiniSearch 是浏览器/Node 可用的倒排全文检索库，提供索引、字段权重、前缀与模糊词条、查询建议。适合离线资料和中等规模文档目录，不是向量数据库、权限系统或分布式搜索集群。本 Demo 对原创 RSS 文章 fixture 建立真正的 SDK 索引。

## 安装及版本约束

~~~bash
pnpm add minisearch@7.2.0
~~~

采用官方稳定 MiniSearch 7.2.0；搜索评分越高代表相关性越强，不能与 Fuse.js 的越低越相似混为一谈。

## 真实代码路径

实际入口为 examples/demo.tsx，完整可迁移实现为 examples/example.tsx。Library Lab 展示的代码由这两份源文件生成并计算 SHA-256；三个 Demo 场景共享真实实现，使用 level 切换学习层次。不得为文档另外维护一份看起来相同但不可运行的伪代码。

## 索引模型

创建 MiniSearch 时指定 fields、storeFields 与 searchOptions；addAll 建立倒排结构，search 返回 id、score、terms 等；autoSuggest 提供文本建议。storeFields 只存需要在结果中展示的字段，原始正文完整副本不一定需要与索引全部同步。

## 三层实战

基础：输入 React，检查 title boost 与排序分数；业务：结合 RSS 技术/产品/开源分类过滤，使用 search filter 在 slice 前控制范围，并对中文输入法组成态暂缓提交；进阶：启用/关闭拼写容错、执行 autoSuggest，修改标题后重建索引使搜索结果真实更新。

## 常见错误

一、修改原文数组后不更新 MiniSearch 索引，结果仍是旧文本；应 replace/remove/add 或重建/增量更新并明确边界。二、先对搜索结果取 topN 才应用分类条件，可能隐藏实际应该展示的匹配；应在查询阶段 filter 或分租户建索引。三、把搜索结果当权限检查，用前端 filter 隐藏敏感文档并认为安全；必须在服务端授权及索引构建阶段控制数据访问。四、把中文整句按默认英文分词保证准确率；真正中文全文检索需设计分词/归一化插件和针对数据的回归语料。

## 组合选型

小型候选列表使用 D19 Fuse.js 更直观；规模稍大、需要 prefix/fuzzy/autoSuggest 的正文资料可选择 MiniSearch；纯静态文档可比较 Pagefind 构建时索引。数据量大时将索引构建放入 Worker 并设置内存与时间预算，Lab 中不自动加载外部服务。

## 运行与测试

本例基于 React useMemo，文档变化时重建 index；这是小集合的教学简化，大列表应增量维护与异步分批。node:test 真实 import MiniSearch，验证字段搜索、分类过滤、替换索引后的结果。浏览器再验证 IME 和快速输入行为，未运行前保持 NOT_RUN。

## 演示场景与预期

1. **倒排索引、字段权重与 score**：添加本地文档后按正文和标题评分检索
2. **RSS 分类过滤与输入法**：查询后引擎内部过滤，再控制显示数量
3. **前缀、错拼联想与重新索引**：autoSuggest 与文档更新后建新索引

## 练习与迁移

将本地 NewsHub 频道搜索升级为两个查询模式：名称容错建议和文章正文搜索，并保证租户分组不会出现先截断导致的漏结果。

## 验证分级与限制

本条目包含真实目标包 import 的示例和 Node 定向测试源码。**SDK、TypeScript、生产构建及 Playwright 本轮均未在依赖完整环境执行，状态为 NOT_RUN**。`tests/sdk.test.mjs` 必须在真实依赖安装后执行；Mock 业务数据不等于 Mock 目标库。测试成功后才能按当前源指纹绑定 evidence，不得沿用历史研究报告的 PASS。

## 官方一手资料

- [官方 API 与 README](https://github.com/lucaong/minisearch)
- [npm 稳定版本](https://www.npmjs.com/package/minisearch)
- [API 文档](https://lucaong.github.io/minisearch/)

## 授权

该条目源码与文字为独立编写的教学材料；目标库使用上游 MIT 许可，未捆绑第三方图片、字体或付费资源。

## 第16轮：搜索建议与索引的分类所有权

过去的演示仅对 `search({filter})` 做分类限制，`autoSuggest` 却基于**完整**索引，切换“技术”分组时仍可能从其他分组词条联想出文字。现在 `scopeSearchDocuments` 在 `buildMiniIndex` 之前裁剪可见分组，同一份 `scopedDocs` 同时驱动 ID 映射、空词结果、`search` 和 `autoSuggest`；切换分类后通过 React `useMemo` 重建真正索引。不是把未授权数据塞入浏览器、只靠展示时过滤的安全措施。

官方 `autoSuggest` 同样支持 search 的 filter 选项，但索引构建前隔离更便于讲清缓存所有权和误泄漏风险。真实生产必须由服务端先鉴权后给浏览器最小许可文档，浏览器分类只是用户视图；索引里一旦出现敏感正文，UI 过滤不能收回泄露。索引大时要使用分组/租户 key 限定缓存与 Worker 生命周期。

离线策略：`node --test entries/D20-minisearch/tests/scope-policy.test.mjs`；真实 MiniSearch SDK 的 search / autoSuggest 边界回归：`node --test entries/D20-minisearch/tests/sdk.test.mjs`。后一项需要安装目标 SDK，本轮未实际执行。
