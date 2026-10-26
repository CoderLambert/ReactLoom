# D01 es-toolkit — Agent 编码迁移规范

基线 es-toolkit@1.52.0 / MIT。适合 RSS/搜索文档的纯函数整理：`orderBy`、`uniqBy`、`groupBy`、`chunk`。不要因此把 Lodash 全量移除或将其作为 Schema 校验、HTTP 并发/取消库。

从 `examples/example.tsx` 提取 `canonicalUrl`、`normalizeArticle`、`makeDigest`；`examples/demo.tsx` 只是展示重导出，无需复制 UI。保持入参未知类型、逐条 rejected、协议白名单、追踪参数白名单、稳定排序、pageSize 预检。分组 source 使用显式受控枚举，不接受任意来源字段作动态配置。

设计审查：\n
- 从最新到最旧排序后 uniqBy 才能保留最新同 key。
- 规范化 URL 不要丢业务 id/page。
- 处理大输入时计算空间与内存预算，并考虑在 Worker 中处理；async 不自动启用多核。
- p-limit 只限制真正启动的异步任务，chunk 只是生成批次。
- 浏览器界面中的种子数据是本地 fixture，不是实测真实 RSS API。

验收需使用真实 es-toolkit SDK 调用，对不同 id/同 id+utm、坏 URL、空标题、非法页大小进行断言，再做类型/构建/浏览器验证。此版本目前未执行这些 SDK 门禁，状态 NOT_RUN，不得宣称 PASS。

来源：https://es-toolkit.dev/ · https://github.com/toss/es-toolkit
