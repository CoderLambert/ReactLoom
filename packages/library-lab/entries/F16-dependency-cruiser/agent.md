# F16 dependency-cruiser — 工程手册

## 适用

隔离夹具上的依赖方向和环。不扫描产品树，不代替 Knip 或打包体积。

## 版本

`dependency-cruiser@18.5.0`，MIT。配置 `examples/workspace/config.cjs`。报告器至少包括 `json` 和 `err`。

## 迁移

带走 config、三份 src、`run.mjs`、`verify.mjs`、`result-policy.mjs`。命令只接收 `basic|business|advanced`。不要把 cruiser 指到仓库其它目录。

## 不可删的清理

`domain-must-not-import-ui` 与 `no-circular-dependencies` 两条都留着。`verify.mjs` 必须各跑一次 JSON 和 err。JSON 不拿来证明退出码，err 不拿来证明规则名。不跟随 `node_modules`。

## 反例

- 扫描 `packages/` 或模板。
- 放宽 to 路径让 business 变绿。
- 只保存一种报告器。
- 用策略单测代替 `depcruise`。
- 在网页里画假图。
- 用 chunk 大小推断没有环。
- 公开带绝对路径的 JSON。

## 测试断言

- basic：error 数 0，err 退出码 0，modules 非空。
- business：违规里有 `domain-must-not-import-ui`，err 退出码 > 0。
- advanced：违规里有 `no-circular-dependencies`，err 退出码 > 0。
- `summary.error` 等于 severity 为 error 的条数。
- 超限或损坏 JSON 被拒绝。

## 真实限制

网页不启动 CLI。`second.ts` 的环是 import，不是一次真实递归调用。类型导入算不算边，以这次 18.5 的输出为准。没有 Mermaid 产物。json 报告器的退出码不能代替 err。

## 证据

sdk 收据来自真实 `depcruise` 进程，写入 `docs/library-lab/evidence/runs/`。Actions 41779873259 不是 F16 PASS。browser 保持 NOT_RUN。

只跑 `run.mjs` 的 json 输出还缺 err 报告器的退出码合同。
