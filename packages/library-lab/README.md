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

当前实现：目录搜索、分类、四Tab深链接、Markdown安全渲染、原文复制、源码manifest、显式启动/停止、局部错误边界，clsx与p-limit三层示例源码。
待完善：全量指南与示例、Markdown目录/高亮/相对资源、Worker/SW独立runner、完整CI与锁文件、真实浏览器与性能证据。
