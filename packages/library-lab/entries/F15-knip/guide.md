# Knip 6 — 识别真正无用的文件、导出、依赖和脚本

## 作用、选型与边界

Knip 会理解 TypeScript/JavaScript 项目入口、引用关系、插件约定和工作区，检查未使用文件、未引用 exports、声明却未使用的 dependencies、未声明的依赖。它不是格式化器或类型检查器；Biome 负责代码风格，dependency-cruiser（F16）负责依赖方向，构建分析工具F18负责真正的bundle体积。Knip报告是一份调查线索，不等于可以安全自动删除的事实。

本条基线 `knip@6.41.0`，ISC。采用完全**原创的最小工作区 fixture**，不对用户正式项目执行自动删除，也不冒充主站的图形运行Demo。

## 安装与复现命令

```bash
pnpm --filter @reactloom/library-lab add -D knip@6.41.0
cd packages/library-lab
pnpm exec knip --directory entries/F15-knip/examples/workspace --config knip.basic.json
pnpm exec knip --directory entries/F15-knip/examples/workspace --config knip.business.json
pnpm exec knip --directory entries/F15-knip/examples/workspace --config knip.advanced.json --production
```

由 PLATFORM 统一添加依赖和生成实际锁文件。命令真实启动 Knip CLI，期望返回可能是**非零退出码**，因为故意放入 unused code；非零不等同命令执行失败。CI验收应断言输出分类及退出码，不能仅看返回0。fixture的 `package.json` 只用于演示依赖声明，不修改主项目生产依赖。

## 三层场景

**Basic**：`knip.basic.json` 指定 `src/index.ts` 为入口和 `src/**/*.ts` 为项目文件。检查 `src/unused.ts` 没有被入口引用，`tasks.ts` 的部分 exported symbol 也未用。故意在fixture package.json中声明 clsx 但不导入，以便观察依赖识别；Knip不会因为你主项目安装clsx就假装它被本fixture引用。

**Business**：`knip.business.json` 添加 `scripts/generate.ts` 为次入口，把 tests 也纳入 project，并通过 `ignoreIssues` 针对 `src/unused.ts` 的 files 分类作显式白名单，用来比较配置差异。这里只是教学白名单，生产不得无限堆积 ignoreDependencies/ignoreIssues。

**Advanced**：`knip.advanced.json` 将带 `!` 的入口/项目文件标记为生产范围，在命令尾加 `--production`；`includeEntryExports` 审查可能是工作区公开 API 的导出。这个开关适合 private/self-contained 项目，不适合直接断言公共库对外导出必定未用。

## 反例和纠正

1. **把测试文件当生产入口**：会让生产未引用代码看上去“有用”；区分普通检查和 production。
2. **把框架自动入口视为垃圾**：路由生成、文件系统约定、runtime反射可能不在显式 imports，配置 entry/project 或插件时应查确切项目规则。
3. **无限增加 ignoreDependencies**：解决报告但留下死依赖。每项抑制写明拥有者、原因和删除时间。
4. **直接加 --fix 并批量删除**：用户生产仓库/模板可能依赖公开导出或动态文件。先 review diff、备份、运行相关单测与 E2E。
5. **把二级 workspace 当主项目路径**：与 monorepo 的 pnpm workspace 根入口不同会影响包解析。使用 --directory 显式指定隔离 fixture，并审查 Knip 读的是哪个 package.json。
6. **只关注数量不关注维护效果**：处理低风险文件前先确认协议稳定、CI通过；报告中的 unresolved 包名可能是别名/环境特定依赖，不应猜测。

## 结果归档与可靠性

真实执行保存 Knip版本、命令、项目内容hash、exit code和原始报告；示例只是 `node-ci` 配方，主站 Tab 只展示源码与运行命令。Knip报告中 `unused files` 与 `unused dependencies` 不同，不能把声明次数相加当成一类。对可以安全删除的候选按单文件进行PR，先跑受影响测试，不强求全仓每次重跑。

## 验收与官方来源

实际 CLI 执行3套配置，比较输出差异；在本仓库配置上另测试 workspace plugins/TS paths，别对原 fixtures 的预计结果凭空标 PASS。目前Knip SDK NOT_RUN、完整构建 BLOCKED、浏览器不适用（NOT_RUN）。
参考 [项目配置](https://knip.dev/guides/configuring-project-files)、[CLI](https://knip.dev/reference/cli)、[完整参考](https://knip.dev/reference/configuration)。

## 真实CLI报告校验增强（2026-10-27）

执行 `node entries/F15-knip/examples/verify.mjs`，真实运行三组 `knip --reporter json`。按 [官方 Knip JSON reporter](https://knip.dev/features/reporters) 读取 `issues[].files[].name` 而不是搜索日志字符串；退出码0代表无问题、1代表发现问题、2代表工具/配置错误，2不可冒充成功。basic应检出孤立文件，business的显式忽略应使该项消失，advanced独立生产扫描。`node --test entries/F15-knip/examples/report-policy.test.mjs` 仅测试解析策略（合成JSON），不是Knip SDK/CLI验收。
