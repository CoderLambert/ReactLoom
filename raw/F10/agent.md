# F10 Orval复用

固定orval8.44.0 MIT，Node≥22.18，pnpm；只读本地原创OpenAPI，不运行远程schema。先读guide/library/实际source/verification。

完整运行文件：orval.config.ts、openapi/news.json、run.mjs、output-policy.mjs、三个入口、generated-tsconfig.json。verify/spec-check为可选辅助。迁入后run的labRoot/config要适配包位置，配置input/output按config目录解析，不按cwd；advanced target的父目录必须generated/advanced。

在repo root依次node packages/library-lab/entries/F10-orval/examples/{basic,business,advanced}.mjs，然后pnpm --filter @reactloom/library-lab exec tsc -p entries/F10-orval/examples/generated-tsconfig.json。花括号是三次命令缩写，guide列完整命令。生成TS含.ts barrel，noEmit+allowImportingTsExtensions是实际前提。

每项目只清固定targets，真实CLI两次，对输出读内容/导出/大小/路径摘要，不用--clean，不手改产物。策略suite不计SDK。原始logs与manifest在validation；generated被gitignore，复现需重跑。不要把格式化产物后的摘要与原始摘要混比。

business只生成Query hooks，未挂Provider/运行HTTP；生成类型和错误响应union不是运行时schema校验。原生fetch产物要进入模板需另配api-client mutator，不跳过仓库规范。网页只是CLI展示，不会启动进程。

本次真实CLI三个项目双次和产物strict已执行；正式verification无收据仍NOT_RUN。官方固定包README/LICENSE/package字段与homepage403 unknown均保留原始证据，不推定可嵌入。
