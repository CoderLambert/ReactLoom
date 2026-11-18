# Orval：把本地 OpenAPI 变成可编译的客户端

固定 Orval8.44.0（MIT），Node≥22.18。适合团队以版本化OpenAPI同步端点、参数、响应类型和Query hooks。它是构建期生成器：本例执行生成不发送HTTP，不验证运行时响应，不证明服务端契约已实现。

## 三个真实CLI实验

| 项目 | 新目标 | 已执行结果 |
| --- | --- | --- |
| basic | single模式生成fetch函数与模型 | 双次6文件，相同SHA 7736739f32c8bdfe456c544c78bbf272f607ad2bc5ad138a0539c75a5fdb2fa5 |
| business | react-query生成hooks和query keys | 双次6文件，相同SHA fcba05284087e80c5aad869934c74fded51781f6cc9c1dc5ae59e5f6547836ec |
| advanced | tags-split按标签组织模块 | 双次7文件，相同SHA f6e8522f6927a456025bdc81be7575dc1d76fb9f1b77837c01c15e8030f8a3ca |

三者使用同一原创教学契约：listSources/createSource/getSource。loopback server只是生成URL目标，本例不启动服务。页面是node-ci命令展示，不是网页终端；实际raw见validation/*cli*.log。上述摘要是本次原始生成产物，不是预制假输出。文件在gitignored generated，需本机重现。

## 完整最小迁入与命令

保留examples整个相对结构：orval.config.ts、openapi/news.json、run.mjs、output-policy.mjs、basic/business/advanced.mjs、generated-tsconfig.json；verify.mjs和spec-check.mjs是可选复核工具。测试不是运行依赖。安装精确orval8.44.0、TypeScript、React19及@tanstack/react-query5（business需要，当前宿主已装）。Node≥22.18；pnpm。本库不需要React DOM来生成。

在此仓库root执行：

```sh
node packages/library-lab/entries/F10-orval/examples/basic.mjs
node packages/library-lab/entries/F10-orval/examples/business.mjs
node packages/library-lab/entries/F10-orval/examples/advanced.mjs
pnpm --filter @reactloom/library-lab exec tsc -p entries/F10-orval/examples/generated-tsconfig.json
```

网页展示命令以Lab包为cwd，所以显示 `node entries/F10-orval/examples/basic.mjs basic`，尾部level被入口忽略。run.mjs从import.meta.url定位Lab包并在该cwd调用pnpm exec orval。迁入独立项目时必须把run.mjs的labRoot/config改成目标包位置，不要照搬仓库深度；配置内输入和输出则按**config文件目录**解析：`./openapi/news.json`、`./generated`。本次实际CLI抓出旧配置错误重复拼接entries路径，已修复，不再声称按cwd解析。

单项目直接命令（cwd packages/library-lab）：

```sh
pnpm exec orval --config entries/F10-orval/examples/orval.config.ts --project basic
```

直接命令只生成一次，完整验收必须用入口run。run先清理该project固定路径，执行两次实际CLI，读产物并比较路径+内容SHA。没有`--clean`；90秒进程超时和1MiB输出缓冲。advanced target必须 `./generated/advanced/client.ts`，实装tags-split按target所在目录生成标签文件，不会自动按advanced.ts basename建advanced目录。

产物含`.ts`后缀的barrel导出，因此生成专用tsconfig开启noEmit+allowImportingTsExtensions；strict/Bundler/ES2022/DOM。若业务编译器不支持该方式，按所用打包器调整生成配置，不直接改生成代码。本次三项目产物一起严格检查通过。

## 所有权和信任边界

cleanProject只删basic.ts/basic-models或business对应路径，advanced只删advanced.ts/advanced/advanced-models；不会清空共享generated根。inspectProject拒绝符号链接、非TS文件、超过8层、128文件、单文件1MiB、总6MiB，要求三个operation导出；business还检查三个hook。它们是自建策略，不是SDK功能。不要把输出目录改成已有业务源码；不要用Orval --clean。第二次生成检验一致性，不是生成器支持所有schema的证明。

输入只读原创news.json，禁止远程schema。生成配置本身是可执行代码，不能执行外来未知配置。类型只在编译时有效，生成fetch实际调用会JSON.parse并用类型断言返回，不做模型验证；409/422是类型分支，使用方仍处理HTTP状态、网络异常和业务错误。Query hooks需要真实QueryClientProvider才能在应用运行，本例不挂载Provider、不验证缓存或请求取消。生产集成若要求通过@reactloom/api-client，需另设mutator并定向验收，此处原生fetch不直接复制到模板feature。

## 官方与验收

官方包README原文为固定v8.44.0 commit f7c7afdb0dfc1b928d0f18b19a5d4287bddff9d5的packages/orval/README.md；固定树未发现该包中文README。保存在official/readme.md，不用根项目介绍替代包原文。LICENSE原字节和包version/license字段在official。官网实际GET403，嵌入unknown，保留直达，不将403当frame-ancestors结论。

Node output-policy和spec-check仅策略；真实CLI三项目各双次、独立tsc另列。正式verification无recorder仍NOT_RUN。不存在浏览器SDK流程，浏览器只核对CLI命令/源码/结果说明展示，不能冒充在线生成。故障时查raw：ENOENT先核对config相对路径；tags输出缺失核对target父目录；TS5097核对生成tsconfig；摘要不同必须调查不能跳过。
