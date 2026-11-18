# D01 es-toolkit 工程指南

适用于需要组合数组排序、按键去重、分组和切块的 React 业务。固定 `es-toolkit@1.52.0` / MIT，示例只调用 `es-toolkit/array` 的 `orderBy`、`uniqBy`、`groupBy`、`chunk`。原生数组能清楚完成的简单转换无需引库；Lodash 存量调用需逐项审查 compat 语义。

## 当前唯一实验

入口 `examples/demo.tsx` 重导出 `example.tsx`。UI 编辑 JSON、页大小、坏行注入和恢复；实现实际来自 `pipeline.mjs`，公共类型在 `pipeline.d.mts`。SDK 测试也调用这一实现，不能另写副本冒充 UI 的执行证据。

`normalizeArticle` / `canonicalUrl` 是业务规则，不是 SDK 校验：对象、非空标题、可解析日期、HTTP/HTTPS、去 hash、移除已知追踪参数、保留业务 query，来源收为 official/community/other。随后先 `orderBy` 日期降序和 URL 升序，再 `uniqBy` 规范化 URL，保留最新；同 URL 同日期保留输入先到者。`groupBy` 后补空组，`chunk` 仅切数组。输出包含每一步结果便于观察。

## 迁移与边界

复制 `example.tsx`、`pipeline.mjs`、`pipeline.d.mts`，安装 `pnpm add es-toolkit@1.52.0`，在已有 React/ESM/JSX 项目渲染默认组件。demo.tsx 只为 Lab 适配；没有必需 CSS、环境变量、插件或额外资产。fixture 由生产接口数据替换；接口仍用项目 HTTP 层。纯函数没有监听或异步资源，无额外清理。

保留逐行隔离、错误下标、协议白名单、追踪参数白名单、1–100 安全整数页大小检查。日期解析不是严格 ISO schema，生产应按接口约定扩展。URL 不处理重定向、内容身份、跨租户隔离。内存排序和切块不等于服务端分页，不提供缓存、调度或并发限制。

反例：去重后才排序会保留旧稿；清空 query 会合并不同 id；用标题去重会误合并同名文章；chunk 不是请求池；SDK 工具函数不代替校验或鉴权。不要从未演示的 debounce/limitAsync 推导本例能力。

## 断言与证据

根目录 `pnpm --filter @reactloom/library-lab test:sdk --entry=D01`：五行规范化、四行唯一、official/community 各二、页长 2/2；改页大小 3 得 3/1；拒绝 javascript/缺标题/坏日期/非对象但保留正常行；非法页大小抛错；空数组为空页。浏览器另查编辑、错误清空、恢复和控件行为，方案在 `validation/browser-proposal.md`。

官方中文版 README 为 v1.52.0 tag 对应固定提交原字节；library.json 记录 provenance，official/api-evidence.json 固定四个实际 API 的源码摘要。官网 iframe 尚未从 Lab origin 确认，保持 unknown 和直达入口。本地 SDK 结果见 validation/local-validation.md，不提升为正式收据；verification.json 的 sdk/build/browser 仍 NOT_RUN。
