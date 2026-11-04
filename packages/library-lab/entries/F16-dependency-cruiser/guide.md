# dependency-cruiser 18.5.0｜只扫三份隔离 src

Lab 锁定 `dependency-cruiser@18.5.0`（MIT）。它读源码里的 import，对照规则。它不看打包体积，也不删依赖。

执行种类是 `node-ci`。页面展示命令，不启动进程。`result-policy.test.mjs` 只解析 JSON，不是 CLI PASS。

没有 `docs/library-lab/evidence/runs/` 收据时 sdk、build、browser 保持 NOT_RUN。Actions 41779873259 是仓库级安装、类型检查、构建、52 个 SDK 文件 / 153 项测试和 45 项 Playwright，不是 F16 的 PASS。

## Lab 当前示例

规则在 `examples/workspace/config.cjs`。禁止两条：`domain/` 不能指向 `ui/`（`domain-must-not-import-ui`），以及任何环（`no-circular-dependencies`）。`doNotFollow` 和 `exclude` 都是 `node_modules`。不要把配置指到 ReactLoom 的 `templates/` 或 `packages/`。

| 夹具 | 源码 | 预期 |
| --- | --- | --- |
| basic | `main.ts` 调用 domain 和 ui，domain 不引用 ui | 退出码 0，无 error |
| business | `domain/summary.ts` import `../ui/badge` | 规则 `domain-must-not-import-ui` |
| advanced | `first.ts` 与 `second.ts` 互相 import | 规则 `no-circular-dependencies` |

`second.ts` 不在运行时调用自己，避免真的栈溢出。环是 AST 上的 import。注释写明这一点。

页面命令：

```bash
node entries/F16-dependency-cruiser/examples/run.mjs basic
```

business / advanced 换最后的参数。`run.mjs` 用 `pnpm exec depcruise --config config.cjs --output-type json`，工作目录是 `examples/workspace`，只把 `<level>/src` 交给工具。stdout 是 JSON。stderr 里有退出码说明。basic 预期 0，另两层预期非 0。网页不执行这行。

`verify.mjs` 对每一层跑两次：`json` 和 `err`。JSON 模式不一定遵守 err 的非零约定，所以退出码合同只加在 `err` 报告器上。两套都要有，不能只留一种。

## 1. 什么时候用

模块方向已经约定：界面可以依赖领域，领域不能反过来；环让初始化顺序难讲清楚。未使用文件用 F15。chunk 大小用 F18。

不要用它代替类型检查。能 import 的类型错误，cruiser 仍可能画出那条边。

## 2. 模型

工具收集模块列表和 violations。`checkCruiseReport` 要求 `modules` 非空、`summary.violations` 是数组、`summary.error` 是非负整数，并且 severity 为 error 的条数等于 `summary.error`。

basic 的 error 数必须是 0。business 的 error 里要有 `domain-must-not-import-ui`。advanced 要有 `no-circular-dependencies`。stdout 超过 8 000 000 字节直接拒绝。

`checkCruiseExit`：进程必须真的启动（没有 error、没有 signal、status 是整数）。basic 的 status 是 0。另两层必须大于 0。JSON 那次不调用这个函数。

`run.mjs` 未知参数退出 2。启动失败也退出 2。

## 3. 三层

### 基本

`get-article.ts` 与 `render-title.ts` 分属 domain 和 ui。`main.ts` 两边都用，方向是允许的。成功不是「没有输出」，而是 JSON 里 error 为 0，且 err 报告器退出 0。

### 业务

`summarize` 为了教学去调用 `badge`。这是故意的违规边。修复方式是把文案留在 domain，让 ui 去调用 domain，而不是把规则删掉。本页不提供修复后的第二份业务夹具。

### 进阶

`first` import `second`，`second` import `first`。函数体若真的互相调用会递归爆栈，所以实现留在「导入即构成环」。不要为了让进程能跑起来而改成类型-only 导入，除非你同时改了断言：类型导入是否算边，以 18.5 的实际 JSON 为准，改之前先看这次输出。

## 4. 反例

### 反例 1：扫描产品源码

```bash
pnpm exec depcruise --config examples/workspace/config.cjs packages
```

规则里的 `domain/` 会误伤别的目录，也可能把私有路径打进报告。只传 `basic/src`、`business/src` 或 `advanced/src`。

### 反例 2：违规就放宽 from/to

```js
from: { path: 'domain/' }, to: { path: 'ui/', pathNot: 'badge' }
```

这是在把反例收成合法。教学夹具要让规则失败。产品里若要例外，写新规则名和注释，不要改这条的名字却放宽匹配。

### 反例 3：只看 JSON 退出码

有的报告器在有违规时仍返回 0，把违规留在 JSON 里。`verify.mjs` 因此再跑 `--output-type err`。只保存 JSON 不能证明 CI 会失败。

### 反例 4：只看 err 的退出码

退出码 1 没有规则名。`checkCruiseReport` 要见到 `domain-must-not-import-ui` 或 `no-circular-dependencies`。两条都要。

### 反例 5：策略单测当 CLI

构造一段 JSON 调用 `checkCruiseReport` 不需要二进制。sdk 收据必须是 `depcruise` 进程。

### 反例 6：在网页里画依赖图

Lab 不运行 Graphviz，也不把 JSON 画成示意图。要图时用工具自己的报告器，并确认没有绝对路径再分享。本页没有这个步骤。

### 反例 7：用 bundle 大小判断有没有环

F18 的 chunk 可以没有环却仍然很大。环也可以出现在被 tree-shake 掉的文件里。两份报告不要互相填写。

## 5. 组合

**F15**：Knip 说文件没人引用。cruiser 说引用方向错了。一个文件可以既被用到又违规。

**F18**：打包前先让 err 报告器失败退出。体积图不能代替 `summary.error`。

**F10 / F11**：生成代码和 handler 也会形成 import。若把它们放进扫描，要单独的配置。本夹具没有生成代码。

## 6. 清单

- 配置只跟这三份 src。
- 两条规则的名字保持不变。
- JSON 与 err 都跑。
- basic 双双为 0；另两层 JSON 含规则名，err 退出码 > 0。
- 不跟随 node_modules。
- 不把报告里的本机路径公开。
- 页面命令不执行；`run.mjs` 的 stderr 说明不是断言。

## 7. 升级

18.5 的 `forbidden`、`circular: true` 和 `--output-type err|json` 是合同。升级后重跑 `verify.mjs`。规则对象若改名，`RULES` 常量要一起改，不能只改配置。

不要用另一工具的「循环依赖」计数填进这页。边的定义以 dependency-cruiser 的 JSON 为准。

## 8. 验收

页面三条命令对应 `run.mjs`。完整合同是：

```bash
node packages/library-lab/entries/F16-dependency-cruiser/examples/verify.mjs
```

日志应含每层的 modules、errorRules 和 strictExit。策略测试不是替代。没有收据就保持 NOT_RUN。browser 无画布，保持 NOT_RUN。

## 9. 故障对照

| 现象 | 先看 |
| --- | --- |
| basic 非 0 | 夹具被改成 domain import ui，或 config 扫到了别的目录 |
| business 是 0 | 规则被放宽，或 `summary.ts` 不再 import badge |
| 有违规但进程是 0 | 看的是 json 报告器。err 那次才要求非 0 |
| 退出码是 1 但不知道哪条规则 | 没有解析 JSON。名字在 `rule.name` |
| 报告巨大 | 跟随了 node_modules。配置应排除 |
| 页面没有输出 | 页面本来就不执行。命令在终端里跑 |

`run.mjs` 的 stderr 只是说明文字。断言以 `verify.mjs` 的两次报告器为准。不要把 stderr 里的「预期非 0」当成已经观察到的退出码。

## 10. 资料

- https://github.com/sverweij/dependency-cruiser
- https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md
- https://www.npmjs.com/package/dependency-cruiser
