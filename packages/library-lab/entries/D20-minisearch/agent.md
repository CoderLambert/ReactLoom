# D20 MiniSearch — Agent 复用手册

## 快速选型

MiniSearch 是浏览器/Node 可用的倒排全文检索库，提供索引、字段权重、前缀与模糊词条、查询建议。适合离线资料和中等规模文档目录，不是向量数据库、权限系统或分布式搜索集群。本 Demo 对原创 RSS 文章 fixture 建立真正的 SDK 索引。

## 实际文件及部署前置

`library.json`（版本与依赖）→ `examples/example.tsx`（完整逻辑）→ `examples/demo.tsx`（Lab 导出）→ `verification.json`（分项证据）。前置依赖：minisearch@7.2.0。默认不向外部 API 发起请求。

## 迁移指令

先评估数据量、全文语料语言、更新频率和权限边界。最小迁移是 buildMiniIndex 与数据 ID Map；将源文档与索引生命周期绑定，数据更新后增量维护或重建。搜索后排序由真实 score 决定，谨慎控制字段 boost。

## 禁止的反模式

禁止将 MiniSearch 当安全 ACL；禁止直接注入 HTML 高亮片段；禁止把 Fuse.js 评分语义直接套到 MiniSearch；中文全文不能假设默认 tokenizer 具备专业分词能力。

## 必须保留的能力边界

创建 MiniSearch 时指定 fields、storeFields 与 searchOptions；addAll 建立倒排结构，search 返回 id、score、terms 等；autoSuggest 提供文本建议。storeFields 只存需要在结果中展示的字段，原始正文完整副本不一定需要与索引全部同步。

## 最小测试断言

真实索引对标题和正文关键词返回正确文档；search({filter}) 排除非所属组；新建索引后更新的 title 可被查询；浏览器组成输入期间不触发错误搜索提交。

## 版本 / 证据

采用官方稳定 MiniSearch 7.2.0；搜索评分越高代表相关性越强，不能与 Fuse.js 的越低越相似混为一谈。 当前示例未获得实际 SDK、完整类型检查、构建或浏览器 PASS；迁移到目标项目需要按目标锁文件重新测试，不能声称历史 PASS 可继承。

## 选型关系

alternative D19：Fuse.js 更适合小集合字段加权模糊查询；MiniSearch 对多文档正文采用倒排索引。

alternative D21：静态站点可构建期生成 Pagefind 全文索引，减少客户端下载和实时建立索引的成本。

## 官方出处

官方 API 与 README：https://github.com/lucaong/minisearch

npm 稳定版本：https://www.npmjs.com/package/minisearch

API 文档：https://lucaong.github.io/minisearch/
