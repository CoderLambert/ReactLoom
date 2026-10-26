# D01 es-toolkit：数据归一化、排序、去重和分页

**安装**：`pnpm add es-toolkit@1.52.0`（MIT）。示例使用 `import {chunk,groupBy,orderBy,uniqBy} from 'es-toolkit/array'`。这是 RSS 资讯聚合场景，适用于数据处理；不是业务 Schema、数据库、并发限制或网络缓存的替代品。

运行/查看同一份源文件：`examples/example.tsx`；`examples/demo.tsx` 只是重导出入口，代码面板由运行文件生成 SHA-256。参考了恢复的研究资料，但本次源码独立改写，不继承旧测试状态。

## 实战三层

### 入门：真实工具函数
对官方/社区文章使用 `groupBy` 聚合来源，`uniqBy` 合并相同规范化 URL。对比输入条数与去重数量，避免界面直接写死统计。

### 业务：RSS 阅读摘要
先按发布时间降序 `orderBy`，使用第二排序键稳定输出，再 `uniqBy`，最后按页大小 `chunk`。服务端已有准确数据时避免在每次 React render 重复进行大规模完整排序。

### 边界：无效数据隔离
输入可能包含非对象、缺标题、坏日期、`javascript:` URL。`normalizeArticle` 独立捕获每条错误并保留 index，其他有效条目继续处理；预期坏数据进入 rejected，不能导致整批丢失。

## 五个专属反例

1. 直接先 `uniqBy` 后排序：保留的是先抵达的数据，可能是旧版本。先排序，再 uniqBy。
2. 按标题去重：同标题不同内容会错误合并。应以业务 ID 或经审查的规范化 URL 为 key。
3. 清空 URL 所有 query 参数：`?id=42` 与 `?id=43` 可能标识不同内容。只移除明确的 utm_/gclid/fbclid 等追踪参数。
4. 在任意不可信 source 名称上动态建立业务状态：使用受控 Source 类型归类，避免未知 key 渗透。
5. 误把 `chunk` 当 p-limit：分块不会限制同时启动的请求；异步调用须使用真正的 limiter，并单独设计 AbortSignal。

## 与其他库结合

C02 Zod 用于输入 Schema；D03 p-limit 负责并发；D02 Lodash 已存在时无需同时装两套工具，升级前需逐方法校验 null/undefined、deep clone、iteratee 等差异。 es-toolkit/iterator 是独立的惰性迭代器入口，依赖环境支持，不能以此替代数组版 chunk 不经测试。

## 工程边界与验证

强制 pageSize 整数1–100，拒绝非法协议 URL；不同业务 id 保留、仅 utm 不同合并；多版同 URL 留最新；坏输入提供 rejection 位置。API、版本及许可证需要与项目锁文件重新核对。SDK/TS build/浏览器在当前 CD 分支尚未执行，verification.json 全为 NOT_RUN。

官方文档：https://es-toolkit.dev/ · https://github.com/toss/es-toolkit
