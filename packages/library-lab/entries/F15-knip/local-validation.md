# 2026-11-18 主控闭环补充

六项本地质量PASS。实际隔离 Knip 6.41.0 分别发现 3/3/5 项，三次退出 1，合成策略 5 项通过。非作者独立新增文件确实进入 JSON 报告。浏览器仅显示完整配方。候选37及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/F15.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# F15 Knip 本地六维证据

作者仅本条，未改shared/pkg/lock/队列/results/e2e，未扫描真实项目、--fix、全局生成/build/typecheck、提交或派生agent。正式verification仍NOT_RUN。原先没有可定位真实6.41 raw，经主控确认必要运行隔离fixture。

| 六门槛 | 状态与证据 |
| --- | --- |
| 技术准确 | PASS本地CLI：实装6.41.0/ISC；三场景真实扫描Knip exit1，3/3/5发现。Node CLI与合成policy分别计；不是运行时覆盖/安全删除证明。 |
| 清楚解释 | PASS：guide/agent纠正tests project非entry、ignoreIssues仅报告抑制、production!与includeEntryExports作用及动态/公开API边界。 |
| 有效实验 | PASS CLI：unused基本发现、business有限抑制+脚本入口、production额外公开导出；真实结果不同，不伪造网页终端。 |
| 完整迁入 | PASS源/配置：9份workspace文件+verify/report-policy两运行helper，声明sourceFiles；policy.test可省。verify Lab路径迁出适配明确，CLI可直接指定自己fixture。 |
| 官方可靠 | PASS：固定tag knip@6.41.0→commit13d7f21…，包README/LICENSE原字节与SHA/字节、实装包字段；tree无中文候选en。官网urllib403后curl200头保留，无嵌入确认unknown。 |
| 可复核结果 | PASS本地分层：原始JSON/stdout/stderr/exit+命令保存，synthetic5通过、保存raw重放通过、Biome clean。formal无recorder仍NOT_RUN，browser仅展示待主控。 |

## 真实CLI（工具本身，不是合成结果）

`validation/commands.json`保存每次准确argv/cwd/exit与stdout/stderr路径。最终三次cwd=`/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`：

```sh
pnpm exec knip --directory entries/F15-knip/examples/workspace --config knip.basic.json --reporter json
pnpm exec knip --directory entries/F15-knip/examples/workspace --config knip.business.json --reporter json
pnpm exec knip --directory entries/F15-knip/examples/workspace --config knip.advanced.json --reporter json --production
```

各exit1，raw分别`basic.raw.json`、`business.raw.json`、`advanced.raw.json`（stderr各空）。这是预期发现项，不应伪改exit0。三条真实SDK/CLI调用，不以11项发现当11个SDK测试，也不把policy重复计SDK。

| 场景 | 实际发现 |
| --- | --- |
| basic | src/unused.ts files、package.json clsx dependencies、src/tasks.ts unreachableHelper exports（3） |
| business | tests/tasks.test.ts files、clsx、unreachableHelper（3）；unused.ts files已被窄抑制 |
| advanced | unused.ts files、clsx、unreachableHelper、src/index.ts report/unusedPublic exports（5） |

初次命令在repo root通过`pnpm --filter @reactloom/library-lab exec knip ... basic`，exit1，Knip JSON后pnpm stdout追加`undefined`与`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`，使整段不能作为JSON。保留`basic.stdout.json`（文件名不意味着内容合法JSON）和`basic.stderr.log`，未删除。随后改Lab cwd `pnpm exec`得到上列三干净raw。这是额外一次basic调用及捕获方式纠正，不冒称仅三次总进程。

## 纯policy、增强与重放

自建report-policy原结构解析可读当前真实issues[]，原样保留。新增checkFixtureFindings要求clsx/helper持续报告、business测试孤立项、advanced report/unusedPublic及无dev-only files，wrapper每次真实CLI后调用。它是固定fixture断言，不是Knip SDK，也不是任意项目通用规则。

cwd repo root：

```sh
node --test packages/library-lab/entries/F15-knip/examples/report-policy.test.mjs
```

exit0，`validation/policy.log`原始5/5；合成JSON不启动CLI。`validation/current-report-policy.log`保存当前新检查对三个既有raw的重放，exit0，分别count3/3/5、orphan true/false/true；不为新增断言重跑未变Knip输入。当前verify源码真实spawn pnpm，固定--directory/--config、reporter json，advanced独立production、60s/2MB限制，无--fix。wrapper新增检查通过raw重放，未再次启动三CLI；这一区分保留。

basic必须报告unused；business必须不报该文件，不意味着文件已变可达。advanced一般解析器允许零发现，entry专用checkFixtureFindings会进一步要求本fixture应有的类别，两个函数用途不同。

## 配置与迁入

配置$schema最后从宽泛knip@6改精确6.41.0，仅编辑器参考地址变化，不改entry/project/ignore/production扫描输入，未为此重复CLI。workspace包含package、三配置、src三文件、script、test9份；运行helper两份。迁出verify必须改Lab/fixture定位，文档给直接CLI，不承诺原仓库深度在独立项目即插即用。没有额外依赖安装/TypeScript编译：Knip静态扫描fixture不执行其TS脚本，不能拿scan结果当tsc或测试运行。

## 官方、静态检查和主控

GitHub API解析knip@6.41.0为`13d7f21e8ec5b30d8fe6d8377c9012b9db96f871`，固定递归tree候选根README/包README，无中文；选packages/knip/README.md，LICENSE为ISC。原字节与URL/sha256/bytes/实装package绝对路径、version6.41.0、license ISC、engines ^20.19.0 || >=22.12.0保存official/source-evidence.json。没有凭记忆填许可。

初次urllib首页GET403导致来源脚本exit1（两个原件此前均已成功保存）；后curl命令`curl -L --max-time 25 -D .../official/homepage.headers -o .../official/homepage.body https://knip.dev/` exit0，最终HTTP200、同址、无XFO/CSP。两次观察都保留在source-evidence，unknown不以200/CORS宣称允许iframe。

scopedBiome初次--write 15文件exit0（12格式化、5useTemplate infos），raw biome-initial.log；仅对verify/report-policy执行--write --unsafe将这些拼接改等价模板，raw biome-template.log；最终同范围check exit0，biome-final.log。不因格式/模板改写重复CLI/policy。目录检索`node packages/library-lab/scripts/find-library.mjs --id F15 --agent` exit0，retrieval.log，不当SDK结果。

主控browser只检查三个node-ci配置/命令/完整源文件、真实结果说明及官方README/unknown直达，不在页面实际运行Knip，不要求虚构browser SDK。动态模块、工作区插件、生成代码、下游公开API、误报/漏报与真实产品删除验收均不在本次PASS范围；正式NOT_RUN继续保留。
