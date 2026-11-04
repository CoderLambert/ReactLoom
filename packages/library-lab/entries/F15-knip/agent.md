# F15 Knip — 工程手册

## 适用

在隔离夹具里看未使用文件、导出和依赖。不删除代码，不扫描产品仓库。

## 版本

`knip@6.41.0`，ISC。入口配置用 `entry` / `project`。advanced 打开 `includeEntryExports` 并加 `--production`。

## 迁移

带走 `examples/workspace` 下的源码和三份 `knip.*.json`，以及 `verify.mjs` 与 `report-policy.mjs`。`--directory` 必须留在夹具内。页面命令没有 JSON reporter；脚本里的验证才有。

## 不可删的清理

不要删 `unused.ts` 来让 basic 变安静。`ignoreIssues` 只覆盖该文件的 `files`，注释里的理由要留着。`clsx` 保持未被 import，用来代表未使用依赖。不运行 `--fix`。

## 反例

- 在 monorepo 根目录裸跑 knip。
- 按报告直接删教学文件。
- 用大范围 ignore 换退出码 0。
- 把 `report-policy.test.mjs` 当成 CLI。
- 让测试文件在 production 模式里充当引用。
- 忽略非常量动态 import 造成的漏报。
- 公开含本机绝对路径的 JSON。

## 测试断言

- basic 退出码 1 且报告含 `src/unused.ts`。
- business 不再把该文件当孤立文件。
- 退出码与发现条数一致；其它 status 失败。
- 非 JSON 或超限 stdout 被拒绝。
- 策略函数不启动 Knip。

## 真实限制

网页不执行命令。漏报可能来自动态路径。`unusedPublic` 是否出现取决于本次生产分析，不要用旧笔记顶替。夹具不是 ReactLoom 的依赖图。页面命令没有 `--reporter json`。

## 证据

只有 `verify.mjs` 或等价的真实 Knip 进程可以成为 sdk 收据，并且要落在 `docs/library-lab/evidence/runs/`。Actions 41779873259 不是 F15 PASS。browser 保持 NOT_RUN。

`report-policy.test.mjs` 使用合成 JSON，不能补上这一条收据。
