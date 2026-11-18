# 2026-11-18 主控闭环补充

六项本地质量PASS。真实 CLI JSON/err 各三次。三个图分别有 3/3/2 模块和 0/1/1 类违规，严格退出 0/1/1。迁入、纯策略及独立新 fixture 另计，Lab 浏览器仅核对配方。候选37及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/F16.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# F16 本地质量证据（2026-11-18，STABLE）

仅F16目录，未改shared/e2e/队列结果/依赖，未全局generate/build/typecheck/commit/subspawn。主控同步固定JS入口的共享reproduction，自有条目不越权修改。formal sdk/build/browser无匹配receipt仍NOT_RUN。

| 六门槛 | 状态/层级 | 证据 |
| --- | --- | --- |
| 技术准确 | PASS真实CLI | 18.5.0/MIT，verify实跑6进程（3level×json/err），basic错误0、business/advanced各1；JSON均0而err0/1/1，准确区分 |
| 解释清楚 | PASS | from依赖发起→to被引用、静态环非运行递归、图数据非图像、JSON进程码非无错误、TS7实际不兼容和原生JS替代 |
| Demo有用 | PASS Node工坊 | 三隔离图/反例真实扫描，verify合同通过；Lab网页仅配方展示待主控 |
| 可迁入 | PASS复制consumer | 13运行原件复制ownedtmp、真实installedCLI定位/配置/白名单检查exit0，不重复六CLI；无React/env/server，明确Node支持范围 |
| 官方来源 | PASS原字节 | fixedv18.5.0→0c973… README7600/LICENSE1086重新HTTP200 sameBytes，MIT实装；完整tree无中文主README；GitHub实际deny/frame-ancestors none blocked |
| 可复核结果 | NodePASS；Lab展示NOT_RUN | 真实6进程command/cwd/status/stdout/stderr及两类前置红保留，纯policy4独立；没有用策略替CLI或空图假绿 |

## 实际verify与两类真实失败

cwd `/home/lambert/githubRepos/lambert/ReactLoom`，`node packages/library-lab/entries/F16-dependency-cruiser/examples/verify.mjs`最终exit0。完整命令validation/verify-command.json，stdout/stderr原样verify.log；6条内部CLI的实际process.execPath/bin/argv/cwd/status/signal/stdout/stderr保存actual-cli-commands.json。各level/report的原始stdout/stderr另存`{level}-{json|err}.stdout.txt/.stderr.txt`。

| level | modules/dependencies | JSON status/summary.error | err status/真实规则 |
| --- | --- | --- | --- |
| basic | 3/2 | 0/0 | 0/no dependency violations |
| business | 3/2 | 0/1 | 1/domain-must-not-import-ui，domain/summary.js→ui/badge.js |
| advanced | 2/2 | 0/1 | 1/no-circular-dependencies，first.js→second.js→first.js |

只执行这次成功verify六CLI，不重复整套或额外三run；后续仅格式化/透传说明/元数据，未改变已验证规则和fixture图。err1是预期反例，不是将工具错误忽略。run只提供JSON透传，文字已纠正不能用JSON0代表没有违反。

前置红保留：

- initial-verify.log及initial-actual-cli-commands.json：深层workspace `pnpm exec depcruise`实际254、command not found，JSON解析拒绝。修cli.mjs从ESM resolve定位已安装18.5 main→真实manifest.bin，以当前Node启动，cwd仍workspace，不改锁或PATH。
- ts7-verify.log及ts7-basic-json.stdout.txt：真实Node启动后JSON0但modules空。environment明确typescript>=2<7不可用（本仓库7.0.2），verify因空模块拒绝，未假PASS。等价原生JS fixture去类型且补.js import，保留同一三图；TS7兼容不在成功声明，未借别处TS5路径。

当前固定entryPoint：examples/workspace/basic/src/main.js、business/src/domain/summary.js、advanced/src/first.js。JS是静态AST扫描不执行fixture业务函数；advanced函数若真调用将递归，不在运行验收。

## 其它必要定向检查

所有命令cwd仓库根，完整argv/cwd/exit在validation/*-command.json，raw同名.log：

- `node --test …/examples/result-policy.test.mjs` exit0，4纯policy；原结构/exit3项复用，补prototype场景名/坏JSON/8M预算拒绝1项。不import dependency-cruiser，不计SDK。
- `node …/validation/check-official.mjs` exit0，协议errors[]、实装18.5.0/MIT；README SHA84886df812fd8c6d7e1381922b269351c15b9bdb271bed82cb73136bd7099b53；LICENSE SHA046799de79c54f5366624ef97e3d5518afbefcd784a23aa74ef58d8f8bfcb2be。
- `pnpm exec biome check` entry examples/library/verification/browserproposal/checker exit0，18files No fixes；没有共享lint。
- `node /tmp/f16-portable-…/consumer.mjs` exit0：13必需运行文件复制、installed18.5 CLI resolves、config2条规则、unsupported fixture拒绝。未再spawnCLI；文件路径/原字节SHA与consumer存migration-manifest.json，仅清本次ownedtmp。不是fresh-install，复用现有node_modules。

## 迁入/资源/来源边界

run+cli+config+所选3或2个src模块即可单场景；verify需verify/result-policy以及全部8个fixture模块，共13运行原件，advanced sourceFiles完整列出跨场景verify所需源。原纯test可选不是运行依赖。依赖用pnpm add -D dependency-cruiser@18.5.0；Node ^22||^24||>=26，本次v26.13.1。深层cwd不会决定bin查找，cli实际ESM定位安装包并锁版本。

level与reporter固定白名单，cwd与src路径固定，不扫描生产树或外部任意shell。每同步子进程60秒、8M缓冲，启动/超时/信号拒绝；完成退出，无server/Worker/句柄需另清理。JSON真实optionsUsed包含本机baseDir/environment，作为本地证据保留；外发图报告前自行审查路径与业务信息，不宣称全报告已脱敏。

官方固定tree完整、无主库中文README候选，en原文非改写。GitHub真实响应X-Frame-Options deny和frame-ancestors none，blocked直达；不是通过200猜allowed。没有执行README命令。

## 主控展示提案

validation/browser.spec.ts仅Lab三命令/README展示，不由作者运行。页面展示`node entries/F16-dependency-cruiser/examples/run.mjs <level>`，真正SDK证据来自上面verify。主控另有非作者新fixtureconsumer，不重复双报告器。formal三项保持NOT_RUN，网页显示/生成/索引通过不证明CLI运行。
