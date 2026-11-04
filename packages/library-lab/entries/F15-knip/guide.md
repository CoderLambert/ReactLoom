# Knip 6.41.0｜只扫描隔离夹具，不删文件

Lab 锁定 `knip@6.41.0`（ISC）。它报告从入口到不了的文件、导出和依赖。它不修改源码。删之前要用测试确认反射、配置字符串和生成代码。

执行种类是 `node-ci`。页面展示命令，不启动 Knip。`report-policy.test.mjs` 喂的是合成 JSON，不是 CLI PASS。

没有 `docs/library-lab/evidence/runs/` 收据时 sdk、build、browser 保持 NOT_RUN。Actions 41779873259 是仓库级安装、类型检查、构建、52 个 SDK 文件 / 153 项测试和 45 项 Playwright，不是 F15 的 PASS。

## Lab 当前示例

夹具在 `examples/workspace/`，包名 `@reactloom/knip-demo-fixture`，依赖只有 `clsx@2.1.1`。没有任何文件 import `clsx`，所以它是「未使用依赖」的教材。不要把扫描范围改成 ReactLoom 根目录。

| 文件 | 作用 |
| --- | --- |
| `src/index.ts` | 入口，调用 `formatJob`，并导出没人引用的 `unusedPublic` |
| `src/tasks.ts` | `formatJob` 被用到；`unreachableHelper` 没有 |
| `src/unused.ts` | 从入口到不了 |
| `scripts/generate.ts` | 只在 business/advanced 里当入口 |
| `tests/tasks.test.ts` | 只在 project 含 tests 时纳入 |
| `knip.basic.json` | 入口 `src/index.ts`，project 只有 `src/**/*.ts` |
| `knip.business.json` | 加上脚本和测试；`ignoreIssues` 只忽略 `src/unused.ts` 的 files |
| `knip.advanced.json` | 入口和 `src` 带 `!`，`includeEntryExports: true` |
| `examples/verify.mjs` | 真正 `pnpm exec knip --reporter json` |
| `examples/report-policy.mjs` | 解析 JSON，不启动 Knip |

页面命令（basic）：

```bash
pnpm exec knip --directory entries/F15-knip/examples/workspace --config knip.basic.json
```

advanced 的页面命令额外带 `--production`。这条没有 `--reporter json`。`verify.mjs` 才加 JSON reporter，并用退出码对照发现项。不要把页面上的人类可读输出直接塞进 `checkKnipReport`。

business 的 `ignoreIssues` 必须写明理由：`unused.ts` 在文件头说明它是故意留到业务场景才抑制的。没有理由就不要加忽略。

## 1. 什么时候用

要在 CI 里看见没人 import 的文件、没人调用的导出、package.json 里没人用的依赖。要看「domain 不能 import ui」用 F16。要看打包后谁占字节用 F18。Knip 看不见动态拼出来的路径，除非你把它写成入口或忽略并写下原因。

不要在第一次报告就 `knip --fix` 或手删。本夹具没有任何自动修复步骤。

## 2. 模型

Knip 从 entry 出发，沿着 import 走 project 里的文件。到不了的文件进 `files`。入口导出若打开 `includeEntryExports`，没人在仓库内引用的公开名字也会出现。

退出码：有发现时是 1，没有是 0。配置或崩溃不是这两档。`checkKnipReport` 拒绝其它 status、超过 2 000 000 字节的 stdout、缺 `issues` 数组、条目没有 `file` 或 `name`。发现条数大于 0 必须对应退出码 1，反过来也一样。

basic 必须报告以 `src/unused.ts` 结尾的文件项。business 必须不再把它当孤立文件（`ignoreIssues` 抑制 files）。advanced 用 `--production`，测试文件不再充当「有人用过」的证据。`src/index.ts!` 把该入口标成生产入口。

`clsx` 没有 import。报告里应能看到未使用依赖。这是夹具，不是建议把 clsx 加进产品。

## 3. 三层

### 基本

只认 `src/index.ts`。`unused.ts` 应出现。`scripts/generate.ts` 不在 project 里，不要用它的缺席证明「脚本都是死的」。`unreachableHelper` 若被报出，是未使用导出，不是未使用文件。

### 业务

入口增加 `scripts/generate.ts`。project 含 scripts 和 tests。`unused.ts` 的 files 问题被忽略，其它问题仍可以出现。忽略不是删除。文件还在。

### 进阶

`--production` 加上 `includeEntryExports`。`unusedPublic` 是故意的公开导出，用来让生产入口导出检查有东西可看。测试里对 `formatJob` 的引用不应再把生产图里的死导出救活。具体条目以这次 JSON 为准，不要抄一份旧报告进文档。

## 4. 反例

### 反例 1：扫描整个 monorepo

```bash
pnpm exec knip
```

在仓库根执行会看别的包。本条目的 `--directory` 必须指到 `examples/workspace`。

### 反例 2：看见报告就删

```bash
rm examples/workspace/src/unused.ts
```

教学文件要留着，否则 basic 的断言会空。产品里删除前要跑会加载该模块的测试，并搜配置字符串。

### 反例 3：用 ignore 清空报告

```json
{ "ignore": ["src/**", "scripts/**"] }
```

business 只忽略一个文件的 `files` 问题，并在源码注释里写原因。不要忽略依赖问题来隐瞒没人 import 的 `clsx`。

### 反例 4：策略测试冒充 CLI

`checkKnipReport('basic', 1, fakeJson)` 能在没有二进制时通过。`verify.mjs` 才 `spawnSync` knip。页面命令也不执行。

### 反例 5：生产模式却用测试当入口

advanced 的 project 虽然列了 tests，但命令带 `--production`。不要指望 `tasks.test.ts` 把 `unreachableHelper` 标成已使用。

### 反例 6：把动态 import 的字符串当成已覆盖

Knip 对非常量的 `import()` 会漏。漏报不是干净。把真实入口写进 entry，而不是关掉工具。

### 反例 7：提交含内部路径的完整 JSON 当唯一证据

报告可以含绝对路径。收据留在证据目录。不要把开发机路径贴进指南，也不要把私有仓库的 Knip 输出上传到公开处。

## 5. 组合

**F16**：先保证层与层的方向，再谈死代码。循环依赖不会被 Knip 的 files 规则解释。

**F18**：源码没人 import，和打进包里仍占字节，是两件事。动态 import 的 `heavy.ts` 在 F18 里必须成 chunk；Knip 若看不到那个入口，会误报。

**F12**：删导出之前跑会引用它的测试。Vitest 绿不代替 Knip，Knip 绿不代替测试。

## 6. 清单

- `--directory` 固定在夹具。
- basic 能看到 `unused.ts`；business 的 files 忽略只覆盖这一处。
- advanced 带 `--production` 和 `includeEntryExports`。
- 退出码与发现条数一致。
- 不自动删除，不 `--fix`。
- 页面命令和 `verify.mjs` 的 reporter 不同，不要混用输出。
- 不扫描产品源码，不上传含本机路径的报告。

## 7. 升级

6.41 的 `entry`、`project`、`ignoreIssues`、`includeEntryExports` 和 `--production` 是合同。`src/index.ts!` 的感叹号含义以 https://knip.dev/reference/configuration 为准。升级后重跑 `verify.mjs`，因为 issue 对象的字段名变了，`checkKnipReport` 会拒绝。

schema URL 指向 Knip 6。不要换到另一主版本的 schema 却不改解析器。

## 8. 验收

页面上的三条命令可以人工看文本。机器验收是：

```bash
node packages/library-lab/entries/F15-knip/examples/verify.mjs
```

它会真正启动 Knip。策略单测不是替代品。退出码和 JSON 摘要要写入收据。在那之前 sdk 保持 NOT_RUN。browser 没有界面，保持 NOT_RUN。build 不是 Knip 的产物。

## 9. 资料

- https://knip.dev/guides/configuring-project-files
- https://knip.dev/reference/cli
- https://knip.dev/reference/configuration
