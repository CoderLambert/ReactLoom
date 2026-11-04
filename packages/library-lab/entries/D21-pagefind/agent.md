# D21 Pagefind — 工程手册

## 适用

为已经公开的静态 HTML 和自定义笔记在构建期生成 Pagefind 包。运行在 Node 临时目录。访客搜索运行时没有启动。

不要索引草稿、凭据或仓库根目录。过滤器不是访问控制。不要把本脚本挂成会执行任意路径的页面接口。

## 版本

`pagefind@1.5.2`，MIT。`createIndex` 使用 `forceLanguage: 'en'` 和 `excludeSelectors: ['[data-sensitive]']`。

种子是英文。改语言前先换文档和测试，不要只改选项。

## 迁移

从 [`examples/workshop.mjs`](examples/workshop.mjs) 带走添加顺序、`getFiles` 校验和 `writeFiles`。公开性与转义来自 [`examples/publication-policy.mjs`](examples/publication-policy.mjs)。

三个入口在 `finally` 调用 `pagefind.close()`。`runWorkshop` 在 `finally` 调用 `deleteIndex`，并按 `keepOutput` 决定是否删除临时目录。

`visitorSearchExecuted` 保持 false。

## 不可删的清理

无论成功与否都 `deleteIndex` 和 `close`。`keepOutput` 不是 true 时删除整个 scratch，包括写出的包。

Pagefind 返回的 `errors` 非空要抛错，不要继续 `writeFiles`。

不要把 `addDirectory` 的路径改成仓库根或用户主目录。

## 反例

- 未标记 `public` 的 HTML 进入索引。
- 拼接未转义的标题或正文。
- URL 含 `..` 或双斜线。
- 扫描整个仓库。
- 用 `filters` 模拟登录角色。
- 进程结束不 `close()`。
- 把 `wroteActualBundle` 写成浏览器搜索 PASS。
- 在 Lab 页面上提供未审核的 `/pagefind/` 输出。

## 测试断言

- 真实 Node API 写出非空包，且不执行访客搜索。
- 自定义 RSS 笔记不需要 HTTP 服务器。
- 目录扫描只针对生成的临时 HTML，结束后删除原生索引。
- 非公开、不安全路径在添加前失败。
- HTML 转义阻止 fixture 文本变成可执行标记。
- `tests/sdk.test.mjs` 导入真实 `pagefind`。无收据则 NOT_RUN。

## 真实限制

没有浏览器搜索框，没有中文分词验证，没有与 Workbox 一起部署。`keepOutput: true` 的目录在系统 tmp，不是站点资源。

`forceLanguage: 'en'` 使结果不能代表中文文档的索引质量。

## 证据

sdk、build、browser 保持 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有匹配收据。Actions 41779873259 不是本条目 PASS。不要改 `verification.json`。
