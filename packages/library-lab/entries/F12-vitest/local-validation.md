# 2026-11-18 主控闭环补充

六项本地质量PASS。真实Vitest三条CLI共19项，独立新consumer 2项。共享复现策略9项通过，Chromium仅核对三CLI命令/源码和官方面板。候选36及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/F12.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# F12 Vitest 本地质量证据

作者范围仅F12；保留他人改动，未改shared/pkg/lock/e2e/队列/results，未全局generate/build/typecheck、提交、安装或派生代理。正式verification全部NOT_RUN，没有recorder不标正式PASS。此条为Node-only，浏览器只检查命令/源码/来源展示。

| 六门槛 | 状态 / 证据 |
| --- | --- |
| 技术准确 | PASS本地：实际Vitest CLI5.0.5，basic6/business9/advanced4，总19；注入Response是fixture、fake timer是虚拟时钟，不宣称真实HTTP/后端/浏览器。 |
| 解释清楚 | PASS：guide/agent给出URL规则非SSRF、after3非Retry-After、generation非强制终止、Vitest转译非typecheck等边界。 |
| Demo有用 | PASS Node：规范化、HTTP状态/解析取消、最新请求竞态三个不同目标；没有拼凑同界面或网页在线shell。 |
| 源码完整 | PASS：domain+三测试+独占vitest.config.ts，五文件严格复制编译exit0；每demo声明本测试/domain/config，无全局配置隐含依赖。 |
| 官方可靠 | PASS：v5.0.5固定7a825db43e2beca0b219d2eadaec334cb81af0c7 README/LICENSE原字节与SHA、完整tree无中文候选en、实装version/MIT/engines/peer字段；官网HTTP200但XFO DENY所以blocked。 |
| 验证可复现 | PASS本地，formal NOT_RUN：三份verbose原始日志、cwd/argv/exit、migration与Biome日志；无重复policy计数，无共享browser或旧Actions替代。 |

## 运行结果

`validation/commands.json`保存三条实际argv/cwd/exitCode0，cwd均`/home/lambert/githubRepos/lambert/ReactLoom`：

```sh
pnpm --filter @reactloom/library-lab exec vitest run --config entries/F12-vitest/vitest.config.ts examples/basic.test.ts --reporter=verbose
pnpm --filter @reactloom/library-lab exec vitest run --config entries/F12-vitest/vitest.config.ts examples/business.test.ts --reporter=verbose
pnpm --filter @reactloom/library-lab exec vitest run --config entries/F12-vitest/vitest.config.ts examples/advanced.test.ts --reporter=verbose
```

原始`validation/basic.log`为1文件6通过、`business.log`1文件9通过、`advanced.log`1文件4通过；runner标识v5.0.5。本机`pnpm --filter @reactloom/library-lab exec vitest --version`原输出`vitest/5.0.5 linux-x64 node-v26.13.1`。这是实际Vitest SDK/runner使用19项业务断言，纯策略额外套件0项，不能将19再计一遍policy而宣称38。

配置root由自身import.meta.url计算，include只有三文件、environment=node，明确绕过宿主Vite插件/收集范围。CLI每次选一个文件，不将一个命令结果冒称全部通过。源文件测试并没有真实HTTP、浏览器、jsdom、MSW、Provider或外部凭证。

## 必要完善

新增503不调用json/422缺code fallback、403错误；新增旧任务finally先完成后新controller仍可cancel且重复cancel安全。原有规范化、三状态矩阵、200/422解析中取消、真实活动失败vs过期失败保留。假时钟fixture成功与abort都移除自己的listener，abort清timer，推进后timerCount0；afterEach恢复真时钟。不声称业务manager能强制停止忽略abort的工作或代替组件卸载cleanup。

原domain算法未做无关重构；最后将三处字符串拼接改模板只为Biome info，无逻辑变化，不重复已经通过套件。

## 迁入与其他检查

`validation/migration-command.json`记录精确临时路径和命令`pnpm --filter @reactloom/library-lab exec tsc -p /tmp/f12-portable-i_2lf6dk/tsconfig.json`，exit0，`migration.log`为空。临时目录复制五源、node_modules链接当前安装，strict/ES2022/ESNext/Bundler/DOM/node/noEmit；skipLibCheck只跳第三方声明，非fresh-install/全仓typecheck。ownedtmp清理完成。

Biome初次`--write examples/config` exit0输出保存biome-initial.log；最后`--write examples/config/library/verification/source-evidence` exit0（两metadata格式修正和三template infos保留在biome-final.log）。修正三个info后定向`pnpm --filter @reactloom/library-lab exec biome check entries/F12-vitest/examples entries/F12-vitest/vitest.config.ts entries/F12-vitest/library.json entries/F12-vitest/verification.json entries/F12-vitest/official/source-evidence.json` exit0，`biome-clean.log`为8files No fixes。只检查entry，未运行workspace检查。

目录检索`node packages/library-lab/scripts/find-library.mjs --id F12 --agent` exit0，原始retrieval.log；目录收录不是SDK PASS。

## 来源与预览

官方API解析`https://api.github.com/repos/vitest-dev/vitest/git/ref/tags/v5.0.5`为固定commit，并读取固定树确认根README且无中文候选。原字节下载URL、sha256、byte length、实装包绝对路径及关键字段在official/source-evidence.json，保存README与MIT LICENSE不改写。

实际urllib GET `https://vitest.dev/`最终200，响应`X-Frame-Options: DENY`，finalURL及完整headers保存在source-evidence/homepage-headers.json，禁止Lab iframe，标blocked而保留直达。不是200便allowed；也未用静态截图冒充官网。

## 主控与剩余边界

主控浏览器仅需验证basic/business/advanced的三个CLI入口/完整源码可见、指南给出带--config的真实命令、官方README与blocked直达状态。网页不启动Vitest。共享reproduction.mjs自动短命令不包含entry --config，已通知主控；guide/agent明确短命令未作隔离验收，完整命令以上为准，本作者未改共享实现。

真实HTTP契约/网络、组件生命周期、浏览器IME/焦点、覆盖率、并发压力、性能/安全审计均未运行。URL验证不阻止内网地址；latest返回null会与合法null结果混淆，产品可改显式结果union。正式security也NOT_RUN，不把有限业务断言当生产安全通过。
