# D21 Pagefind — Agent 实施指南

## 选型

公开静态资料、文档站和静态 RSS archive 需要轻量浏览器搜索时选 Pagefind。运行时数据变化快的本地列表用 MiniSearch；小数组模糊匹配可用 Fuse.js。Pagefind 是静态索引发布工具，不是权限系统，也不访问目标应用后端。当前目标 pagefind@1.5.2，MIT。

## 最小可迁移代码和能力

- examples/workshop.mjs 使用真实 pagefind Node API 创建索引、addHTMLFile、addCustomRecord、addDirectory、getFiles、writeFiles、deleteIndex。
- examples/basic.mjs、business.mjs、advanced.mjs 三个独立 CLI；运行者自选级别，绝不从站内输入执行 shell。
- tests/sdk.test.mjs 对真实 Pagefind native binary 产物做断言。
- 输出资源应完整放进经授权的公开静态目录（例如 /pagefind），部署后页面按需 import pagefind.js。

## 不能省的工程约束

先确认资料可公开，再生成索引；隐私授权在生成前而非搜索后过滤。HTML 需安全转义，meta/filters 值遵守官方类型。对独立索引调用 deleteIndex，对退出 CLI 调用 pagefind.close。保留全部索引分片以及缓存/路径配置，不将生成内容直接当可执行脚本。多语言索引、部署子路径、筛选和排序需由实际浏览器测试验证。

## 常见反例

1. 使用纯 SPA 路由但未将页面渲染成 HTML，结果为零。
2. 把未授权的用户私密数据写进静态索引，任何访客都可下载。
3. 仅上传一个 JS 文件，遗漏索引分片。
4. 将 addCustomRecord 的 filters 写成字符串或 sort 数字，而不是文档要求的字符串数组和字符串。
5. 用 Node 生成器输出成功证明中文浏览器搜索正常；它们是不同门禁。

## 运行和断言

~~~sh
pnpm --filter @reactloom/library-lab exec node entries/D21-pagefind/examples/advanced.mjs
pnpm --filter @reactloom/library-lab exec node --test entries/D21-pagefind/tests/sdk.test.mjs
~~~

断言真实 getFiles 返回非空二进制资源、writeFiles 输出实际目录、过滤前就审查公开内容。部署后在独立站点测试浏览器 import/search/result.data、中文输入法、索引更新。现在没有 npm/Native 二进制执行证据，SDK/build/browser 仍 NOT_RUN。

## PLATFORM 交接

需要 devDependency pagefind@1.5.2（按平台版本策略统一加入）、真实 package/lock 安装、CLI recipe 白名单 D21、专用静态预览 E2E。不要擅自改公共文件。

来源：https://pagefind.app/docs/node-api/

## 新增发布前策略门禁

读取 `examples/publication-policy.mjs`：`assertPublicDocument` 是显式公开状态与站内 URL 的 fail-closed 断言，`escapeHtmlText` 让 CMS/RSS 文本只能以文本形式进入 HTML 结构；三层真实 Pagefind 入口实际调用两个函数。切勿把请求侧的 `visibility` 当 ACL 授权，必须由可信上游决定。迁移时先运行独立 `tests/publication-policy.test.mjs`，再在装有 Pagefind 原生包的环境执行 SDK 测试并检查 bundle，没有浏览器实测则维持 NOT_RUN。
