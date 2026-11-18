# Knip 6.41.0：用隔离项目解释静态发现

Knip沿入口与静态引用报告未使用文件、导出和依赖。它不是运行时覆盖率、打包体积或“可以安全删除”的证明。固定6.41.0/ISC；本例只扫描原创`examples/workspace`，不扫描ReactLoom产品，不使用`--fix`或删除fixture。

网页为node-ci：展示配置/源码/命令，不启动Shell。真实CLI与原始JSON见local-validation；自建report-policy合成测试不计CLI。

## 三个配置的实际区别

| 场景 | 目标与实际结果（Knip退出1为发现项，不是进程崩溃） |
| --- | --- |
| basic | src/index.ts入口，仅src项目；3项：src/unused.ts孤立文件、clsx依赖、unreachableHelper导出 |
| business | 增加scripts/generate.ts入口、scripts/tests项目范围；只抑制unused.ts的files类别；仍3项：tests/tasks.test.ts孤立、clsx、unreachableHelper |
| advanced | src入口和project用!标生产，--production且includeEntryExports；5项：unused.ts、clsx、unreachableHelper、入口report/unusedPublic导出 |

business的ignoreIssues是报告抑制，不是删除文件、从依赖图排除或访问控制。保留unused.ts的理由是教学fixture，不能套到生产代码换退出0。tests文件虽然在project里，却没有被配置成entry，也没有适用测试插件入口，因此真实报告仍认为它孤立；不能把“project包含tests”等同于测试被执行或被视为入口。

advanced未标!的脚本/测试不是生产扫描对象，且入口导出检查会把公开API也报出来。report/unusedPublic可能供下游或外部使用，不能因此盲删。此fixture没有独立验证“仅被测试引用的生产导出”的复杂图；不推广到全部插件/工作区。

## 完整迁入与命令

复制workspace的package.json、三个knip.*.json、src三文件、scripts/generate.ts和tests/tasks.test.ts，加examples/verify.mjs、report-policy.mjs。完整路径在sourceFiles；report-policy.test.mjs只可选验证，不是运行依赖。配置$schema固定6.41.0，entry/project/ignoreIssues/includeEntryExports为实际字段；$schema只是编辑器参考，不是远程扫描源。

Node需满足实装engines `^20.19.0 || >=22.12.0`，本次26.13.1；用pnpm，精确knip6.41.0。fixture声明clsx2.1.1但故意不import，用来制造unused dependency；独立项目若需安装fixture声明，使用对应精确包，不在真实产品添加无用依赖。无需React/Provider/服务/密钥。

cwd=`packages/library-lab`：

```sh
pnpm exec knip --directory entries/F15-knip/examples/workspace --config knip.basic.json --reporter json
pnpm exec knip --directory entries/F15-knip/examples/workspace --config knip.business.json --reporter json
pnpm exec knip --directory entries/F15-knip/examples/workspace --config knip.advanced.json --reporter json --production
```

三命令各exit1（3/3/5项），必须保留此状态；不要用`|| true`掩盖错误。`node packages/library-lab/entries/F15-knip/examples/verify.mjs`可从repo根调用，内部只在Lab cwd执行上述真实命令，再检查JSON/状态与固定fixture预期；全部符合则wrapper正常退出，不要求Knip没有发现。迁出时需适配verify.mjs的lab/fixture定位，不照搬仓库深度。直接CLI可在自己的包cwd将--directory改到自己的隔离workspace。

不用`pnpm --filter ... exec knip`捕获JSON：在本环境预期exit1时pnpm filter会向stdout补`undefined/ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`文本，破坏纯JSON。初次原始输出保留，之后使用Lab cwd的pnpm exec。工具/配置错误、超时/信号、非JSON都不是“找到了unused”的成功。

## 自建解析策略与边界

checkKnipReport限制stdout≤2,000,000 bytes、issues结构/类别数组和name、只接受exit0/1并对照发现数；basic必须有unused.ts，business必须没有其files项。checkFixtureFindings另要求clsx/helper仍报告、business的tests孤立项和advanced入口两导出及生产报告无dev-only files。这是本条fixture验收，不是Knip API保证，也不是任意项目通用断言。report-policy.test喂合成JSON，不能冒充真实Knip。

扫描不执行fixture脚本/测试；依赖名/文件引用来自静态分析。动态路径、框架插件、生成文件、公开API、独立包边界都可能影响误报/漏报。迁出真实项目先准确配置entry/project和插件，再人工调查、测试/构建确认，最后才考虑删除。不要直接把本例ignore名单或production!写法套全仓。

## 官方和验收

固定tag knip@6.41.0 commit `13d7f21e8ec5b30d8fe6d8377c9012b9db96f871` 的packages/knip/README.md及ISC LICENSE原字节保存official；固定树无中文README候选，保留en。version/license/engines实际包字段、URL/哈希/字节数见source-evidence.json。

官网初次urllib GET403，后curl真实GET200，无XFO/CSP，原始headers保存；没有Lab iframe验收，状态unknown，不从HTTP200/CORS推断allowed。正式verification无recorder保持NOT_RUN，Node CLI不替代浏览器。主控浏览器只需三个配置/命令/源码与来源展示，不宣称网页扫描运行。
