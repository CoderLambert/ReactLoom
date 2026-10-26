# F15 Knip — Agent 删除审计实施手册

**何时使用**：检查无用 imports/exports、孤立文件、无用dependencies/unlisted；不替代 F16 分层依赖图，也不以报告代替 TypeScript、测试和构建。已核对 knip@6.41.0 (ISC)，当前未运行。

**切入路径**：先读 `examples/workspace/package.json` 和3个 `knip.*.json`，之后读 `src/index.ts/tasks.ts/unused.ts`。这是完全隔离的培训fixture，禁止直接把它的条目路径写到生产仓库配置。

**最小命令**：在 `packages/library-lab` 执行 `pnpm exec knip --directory entries/F15-knip/examples/workspace --config knip.basic.json`；business切换knip.business.json；advanced切换knip.advanced.json并加`--production`。结果异常非零可能是预期未使用问题，必须检查原始报告分类。

**迁移到别的项目**：先读取项目的 `package.json`、pnpm-workspace.yaml、TS aliases、React路由/生成产物规则；先不开 --fix，收集按文件路径分类的真正问题；对仅反射/动态引用的组件/测试配置做有证据的特例；修复前检查公共 API 使用者。Knip 配置的entry/project可能需根据框架插件更新。

**不可删除的保护线**：公开exports、动态导入约定、CLI入口、workers、migrations、测试fixtures、用户通过字符串定位的运行时资源。自动fix之前需要用户安全确认，不允许把报告中每项都断言可删。

**验收**：三个隔离配置按实际knip版本执行，保存命令/退出码/stdout/commit/依赖锁；证明一个未使用文件被报告、加入有理由的ignore后分类变化，生产模式排除测试上下文。未跑之前sdk=NOT_RUN。

参考：https://knip.dev/reference/configuration 与 https://knip.dev/reference/cli
