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
