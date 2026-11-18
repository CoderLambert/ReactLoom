# F18 本地定向验证记录

时间：2026-11-10。范围：本次 F18 独立 fixture 与自建分析/预算脚本。所有以下 Node/pnpm 命令 cwd 是 `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`。这些是本地执行记录，**不是** `verify:record` 的正式 sdk/build/browser 收据；verification.json 保持 NOT_RUN。

## 实际执行

| 命令 | exit | 实际结果 |
| --- | --- | --- |
| `pnpm exec ./node_modules/.bin/biome check --write entries/F18-rollup-plugin-visualizer/examples entries/F18-rollup-plugin-visualizer/library.json entries/F18-rollup-plugin-visualizer/verification.json` | 0 | 14 文件；最后一轮修正格式后无警告 |
| `pnpm exec ./node_modules/.bin/tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --strict --skipLibCheck --types node,vite/client entries/F18-rollup-plugin-visualizer/examples/vite.config.ts entries/F18-rollup-plugin-visualizer/examples/fixture/main.ts entries/F18-rollup-plugin-visualizer/examples/fixture/main-lazy.ts entries/F18-rollup-plugin-visualizer/examples/fixture/view.ts` | 0 | 定向配置/fixture TypeScript 检查，无诊断 |
| `node --test entries/F18-rollup-plugin-visualizer/examples/report-policy.test.mjs` | 0 | 两项自建策略测试通过；不执行 SDK |
| `node entries/F18-rollup-plugin-visualizer/examples/verify.mjs --scenario=advanced` | 0 | 真正执行 static/lazy 两条 Vite CLI，均 exit 0；生成报告并读回校验 chunk |
| `node entries/F18-rollup-plugin-visualizer/examples/check-budget.mjs --max-initial-gzip=1` | 1 | `Initial JS gzip(level 9): 2119 B; limit: 1 B; FAIL` |
| `node entries/F18-rollup-plugin-visualizer/examples/check-budget.mjs` | 0 | `Initial JS gzip(level 9): 2119 B; limit: 2500 B; PASS` |

本机 `pnpm exec biome` 因现有 vite-plus pnpm shim 的解析报 npm `could not determine executable to run`；使用同一已安装 Biome 的明确本地可执行路径后成功，没有修改依赖。

## 真实构建结果

执行版本：Node 26.13.0 / Vite 8.3.4 / Rolldown 1.2.13 / rollup-plugin-visualizer 7.1.1。

| 产物指标 | static | lazy |
| --- | ---: | ---: |
| 初始 JS 字节 | 2558 | 4024 |
| 初始 JS gzip level 9 字节 | 1473 | 2119 |
| 全部 JS 字节 | 2558 | 4122 |
| 动态专有 chunk 数 | 0 | 1 |

lazy 中 heavy 模块对应 `assets/heavy-rpweQXhK.js`（98 字节）；入口中不再有 `/heavy.ts`。初始 gzip 相比 static **增加 646 字节**，并非优化收益。这个小函数实验验证加载边界，额外 preload helper 与分块开销不值得被包装成性能改善。

原始构建 stdout/stderr 与 exit 记录在忽略目录 `examples/reports/static/build.log`、`examples/reports/lazy/build.log`；每份目录还有实际 treemap.html、network.html、raw-data.json、dist/index.html、dist/bundle-inventory.json、dist/assets 中 JS/maps。全量真实体积、模块归因与 SHA-256 在 `examples/reports/summary.json`，当前脚本验证后才可供平台读取。生成产物不会提交到源码仓库。

本次最终脚本输入摘要：`eb6f36d7aac1b799f8e0844a58a1d7a94dfe1de734c5a76c2f905ed3319a4dc0`。该摘要覆盖 examples 源码以及根/本包 package、lock、workspace；文档和生成 reports 不反向参与。后续输入变更后，请以 reader 判定为准，不复用本表当当前结果。

## 摘要失效检查

实际调用 `readCurrentSummary()` 首次返回 ready。只在本条固定 reports 下向 lazy/build.log 追加一次探针文本，再读返回 `not-generated`，原因 `Summary or actual generated artifacts changed`；finally 恢复原始精确字节后再读返回 ready。未修改应用或其他条目。

## 边界与尚未运行

- 内容/源码静态对应：三个 Demo 分别定位模块、比较真实改动、执行预算；所有必要运行文件均列在 sourceFiles。
- 真实 CLI：本地通过，生成的是隔离 fixture；不是主 Lab 应用 build。
- 浏览器计算、请求时机、阻断 chunk 后错误恢复：NOT_RUN，guide 提供操作步骤。
- 正式逐库 sdk/build/browser 收据：NOT_RUN。不得把本表或策略测试提升成正式 PASS。
