# F10 Orval — 工程手册

## 适用

由仓库内 OpenAPI 生成 fetch 或 React Query 客户端。不发请求，不代替运行时校验或 MSW。

## 版本

`orval@8.44.0`，MIT。Node ≥ 22.18。输入只读 `examples/openapi/news.json`。baseUrl 是 `http://127.0.0.1:4319`。

## 迁移

带走 `orval.config.ts`、`news.json`、`run.mjs`、`output-policy.mjs`。三个 project 保持 basic / business / advanced。用 `cleanProject` 删除固定目标，不要加 `--clean`。生成两次再比 SHA-256。

页面命令会多一个 level 参数，脚本忽略它。

## 不可删的清理

只删除当前 project 列出的文件或目录。拒绝符号链接、非 ts、超深目录、单文件 1 MiB、128 个文件和合计 6 MiB。空输出失败。不要把旧的 `.ts` 留在目录里充数。

## 反例

- `orval --clean`。
- 用 `access` 判断生成成功。
- 把 `spec-check` 或策略单测写成 CLI PASS。
- 配置指向生产 URL 或含密钥。
- 两次摘要不同仍提交。
- 删掉 Node 版本检查。
- 手改 `generated/`。
- 认为类型已经处理 409/422。

## 测试断言

- 规范含三个唯一 operationId 和 loopback server。
- basic 导出 `listSources`、`createSource`、`getSource`。
- business 再导出三个 `use*` hook。
- advanced 含 `advanced/` 下的文件。
- 两次生成的 sha256 和文件数相同。
- 策略测试不启动 Orval。

## 真实限制

网页不启动进程。`generated/` 不提交。没有 mutator，没有 React 挂载。hook 文本存在不等于 Query 缓存已配置。

## 证据

sdk 收据必须是一次真实的 Orval 进程，日志在 `docs/library-lab/evidence/runs/`。Actions 41779873259 不是 F10 PASS。browser 保持 NOT_RUN。
