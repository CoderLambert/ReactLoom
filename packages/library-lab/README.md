# ReactLoom Library Lab

独立前端工具库实战与 Agent 知识应用。119条目录已收录，当前仅首批示例逐步接入；目录数量不代表全部示例完成。

```sh
pnpm install
pnpm --filter @reactloom/library-lab dev
# http://127.0.0.1:4319
pnpm --filter @reactloom/library-lab test
pnpm --filter @reactloom/library-lab test:sdk
pnpm --filter @reactloom/library-lab typecheck
pnpm --filter @reactloom/library-lab build
pnpm --filter @reactloom/library-lab test:e2e:setup
pnpm --filter @reactloom/library-lab test:e2e
```

依赖锁文件需由集成任务通过真实pnpm生成。没有依赖时可直接运行 `node scripts/generate.mjs` 和 `npm test` 验证目录与平台纯逻辑，不代表 SDK 通过。

源码、guide.md、agent.md 与相关关系按 `entries/<ID>-<slug>` 组织。运行 `catalog:generate` 生成原文、源码哈希、动态loader和根索引。主站不自动运行下载大型SDK，不把未接入条目伪装成真实效果。

当前实现：119条目录与分类搜索（含移动端）、四Tab深链接、安全Markdown原文/目录与按需 Shiki 高亮、源码SHA-256清单、显式启动/停止、CLI可复现命令提示、sourceFingerprint 证据失效判定、局部错误边界。已接入13个库的真实SDK调用源码（含非Web MSW Node 入口），真实构建/SDK/浏览器状态仍未完成。
待完善：剩余106条完整垂直示例与指南、Worker/SW独立 runner、真实依赖锁文件、CI与浏览器/性能证据。文档图片仅允许本地审核过的 raster 资产。

## 面向 Agent 的离线检索

无需安装前端依赖或启动浏览器，即可从库元数据定位精准条目：

```sh
node packages/library-lab/scripts/find-library.mjs --query "并发" --json
node packages/library-lab/scripts/find-library.mjs --id D03 --agent
node packages/library-lab/scripts/find-library.mjs --id D03 --related --json
node packages/library-lab/scripts/find-library.mjs --group E --limit 10
```

输出定位到 `library.json`、`agent.md`、`guide.md`、`examples/` 和 `verification.json`。条目已收录或源码已存在都不代表真实 SDK 测试通过。离线平台测试命令 `pnpm --filter @reactloom/library-lab test` **不加载 SDK**；SDK 专项测试必须单独执行 `test:sdk`，二者不可混淆。

源码面板使用 `source-index.json` 提供摘要与路径，用户选择后只下载该文件；浏览器支持 Web Crypto 时会核对 SHA-256。无需为查看某个 Demo 把该库所有源码一次下载。

## 静态依赖契约审核

`pnpm --filter @reactloom/library-lab catalog:check` 校验目录完整性及已接入 Demo 所声明的 npm 包名称、精确版本是否与此应用的 `package.json` 一致；该审核不执行安装，也不代表 TypeScript、构建、SDK 或浏览器已经通过。新增库由 AB/CD/EF 提交元数据，PLATFORM 统一确认依赖后再执行此门禁。
