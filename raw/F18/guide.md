# rollup-plugin-visualizer：先解释包里有什么，再验证改动值不值

页面变慢时，先分清你要回答的问题。**Visualizer 解释一次生产构建的模块组成和导入关系**：哪个模块落进哪个 chunk、谁把它带进来、是否在多处出现。它适合调查首屏依赖和大包来源；加载耗时、执行耗时和交互延迟还要用浏览器 Network、Performance 和真实用户指标验证。

本例面向已经使用 React/Vite 的工程师。夹具故意不引入 React，避免框架运行时淹没实验：相同的数字统计与 Fibonacci 计算，用两种导入方式构建。`heavy.ts` 是保留的历史文件名，实际只是一个很小的纯函数，**不代表大型图表或编辑器 SDK**。它能证明模块边界，不能证明产品性能收益。

## 从源码到报告，数据在哪里变化

```text
index.html → main.ts → view.ts → helper.ts
                    → heavy.ts（静态导入）
                         ↓
Vite 8 / Rolldown 的模块图、tree shaking、chunk 划分与压缩
                         ↓
generateBundle 中的 bundle / chunk.modules / source maps
                         ↓
Visualizer：treemap 面积、network 导入边、raw-data 模块归因
本例自建 inventory：最终 chunk、静态与动态 import、真实 JS 字节
                         ↓
verify.mjs：重新读取磁盘产物 → 入口静态闭包 → 两份构建比较
check-budget.mjs：对当前有效产物执行预算，返回真实退出码
```

模块是源文件；chunk 是构建输出的 JS 文件；entry 是 HTML 启动的 JS 入口。一个 chunk 可以容纳多个模块，一个源模块也可能出现在多个构建输出中。找“大块”后还要看导入边，才能知道该删依赖、改导入位置、拆业务入口，还是接受这份成本。

本机锁定 `rollup-plugin-visualizer@7.1.1`、`vite@8.3.4`，Vite 实际解析到 `rolldown@1.2.13`。Vite 8 的插件接口继承 Rolldown；插件名虽然含 Rollup，本例不是运行 Rollup 的独立构建。匹配安装包的 `dist/plugin/index.js` 在 `generateBundle` 遍历 `chunk.modules`，用 `getModuleInfo()` 补充导入边。[Vite 插件机制](https://vite.dev/guide/api-plugin)与[Visualizer 官方用法](https://github.com/btd/rollup-plugin-visualizer)提供背景；具体行为以这些锁定包的源码、类型和本次产物核对。

## 先运行一条完整命令

前提：已按仓库 pnpm 锁文件安装依赖，Node 至少 22.18。下面所有命令都从 **Library Lab 目录**运行，不是仓库根目录：

```sh
cd /home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab
node entries/F18-rollup-plugin-visualizer/examples/verify.mjs --scenario=basic
```

脚本打印实际 cwd、每条 Vite 命令、真实 stdout/stderr 和 exit，生成：

```text
entries/F18-rollup-plugin-visualizer/examples/reports/
├── static/
│   ├── treemap.html
│   ├── network.html
│   ├── raw-data.json
│   ├── build.log
│   └── dist/                 # 独立 fixture，不是 Lab 应用
│       ├── index.html
│       ├── bundle-inventory.json
│       └── assets/           # JS 与 hidden source maps
└── summary.json              # 当前源码、版本、磁盘产物摘要
```

脚本只删除本条目 `reports/` 内固定的 `static/`、`lazy/`、`summary.json`、`budget-result.json`，拒绝把 reports 符号链接当输出根。每次构建失败就中止，不会把上一次摘要显示为本次结果。直接运行 `pnpm exec vite build --config entries/F18-rollup-plugin-visualizer/examples/vite.config.ts --mode static` 只生成单份报告，完整比较和有效摘要由 `verify.mjs` 生成。

## 基础：把一个模块的体积归因到导入者

**问题**：为什么计算模块会进入首页，即使用户还没按“计算”？

1. 执行 basic 命令后，在本机浏览器打开 `reports/static/treemap.html`。在入口 chunk 内找到 `view.ts`、`helper.ts`、`heavy.ts`，观察矩形对应的模块与体积。矩形相对大小来自这次构建，不是原始源码行数。
2. 打开同目录 `network.html`，定位 `main.ts` 到 `heavy.ts` 的导入关系，再核对[静态入口源码](./examples/fixture/main.ts)。Network 图回答“为什么进来”，treemap 回答“落在哪、占多少”。它们是同一份构建的不同视角。
3. 查看 `summary.json` 的 `builds[0].initialFiles` 和 `chunks[].moduleIds`。`heavy.ts` 在入口静态依赖闭包中；统计函数也由 `view.ts` 同步引用。

这里的 Visualizer 使用 `sourcemap: true`，Vite 使用 `build.sourcemap: 'hidden'`：模块 `renderedBytes` 按压缩后代码的 source map 映射归因，生成的 map 不在 JS 末尾增加 sourceMappingURL。运行时包装和未映射代码使**模块归因之和未必等于最终文件大小**。本例没有把这些模块字节相加当预算。

`gzipSize` 与 source-map 归因模式不能混为一个精确模块指标。7.1.1 的实现会在 `sourcemap: true` 时关闭模块 gzip/brotli 计算；因此本例在另一个自建 inventory 中对**完整最终 chunk**执行 Node `gzipSync(..., { level: 9 })`。

## 业务：同功能入口只改加载边界，再读变化

**需求**：计算是用户主动触发的可选功能，希望它不进入首页静态依赖。只移动 import，不改变算法或展示结果。

```sh
# cwd 仍是 packages/library-lab
node entries/F18-rollup-plugin-visualizer/examples/verify.mjs --scenario=business
```

它执行两次独立构建，分别写入 `reports/static/` 和 `reports/lazy/`。`main.ts` 顶层静态导入计算函数；[main-lazy.ts](./examples/fixture/main-lazy.ts)只把 `() => import('./heavy')` 作为 loader 交给相同的[界面逻辑](./examples/fixture/view.ts)，有效提交后才调用 loader。

比较按如下顺序读：

| 观察 | 对应结果 | 能支持的判断 |
| --- | --- | --- |
| 入口递归 `imports` | `initialFiles`、`initialBytes`、`initialGzipBytes` | 初始静态 JS 闭包的产物成本；共享静态 chunk 也计入 |
| 动态 import 和模块成员 | lazy 的 `deferredFiles` 含 `heavy-*.js`，入口模块成员不含 `/heavy.ts` | 构建确实移动了计算模块的边界 |
| 所有 chunk | `totalBytes`、`totalGzipBytes` | 把动态 chunk 和加载辅助代码也算进去，避免只看入口获益 |
| 两次差值 | `comparison` 中 lazy − static 的有符号字节差 | 正值表示增加；输出不会预设“优化成功” |
| treemap + network | 两份构建中相同模块的归属与导入边 | 把数字变化解释回代码修改 |

小函数的独立 chunk 可能比原来更贵：动态 import 会带来加载辅助代码、额外请求和分文件压缩成本。本机真实执行已观察到 lazy 入口 gzip 比 static 更大；当前精确数字以可校验的 `summary.json` 为准。工程结论是**这个夹具验证了边界，未证明拆分值得**。迁入业务时用真实可选 SDK 或页面做相同对照，再决定是否保留。

### 还要在浏览器确认加载时机

构建出现动态 chunk 不等于证明请求在点击后才发生。路由预取、别处的静态引用、modulepreload、Service Worker 和缓存都会影响实际请求。

分别启动其中一份生产预览，观察完成后先停止，再切另一份：

```sh
# cwd: packages/library-lab；static 的预览
pnpm exec vite preview --config entries/F18-rollup-plugin-visualizer/examples/vite.config.ts --mode static --host 127.0.0.1 --port 4338 --strictPort
# 停止前一个进程后，lazy 的预览
pnpm exec vite preview --config entries/F18-rollup-plugin-visualizer/examples/vite.config.ts --mode lazy --host 127.0.0.1 --port 4338 --strictPort
```

打开 `http://127.0.0.1:4338`，Network 勾选禁用缓存并刷新。两份界面都应显示“3 个数字，总和 15”；输入默认 12 并计算，应得到 `Fibonacci(12) = 144`。lazy 首次有效点击才调用 `import()`，核对 `heavy-*.js` 的请求先后；再次计算可能命中模块缓存。先用 DevTools 屏蔽该 chunk 的请求再点击，可观察错误文案和按钮恢复；解除屏蔽后浏览器可能缓存失败请求，必要时刷新后重试。输入 0 应得到 0，超出 0–40 或非整数会被表单或业务校验拒绝。

上述是可复现操作，**尚未作为浏览器验收执行**；不要从构建日志推导浏览器 PASS。

## 进阶：预算约束一个明确定义的产物指标

**问题**：以后再次把可选模块带回首屏时，CI 应怎样阻止预算回退？

```sh
# cwd: packages/library-lab；真实构建 static/lazy，默认检查 lazy
node entries/F18-rollup-plugin-visualizer/examples/verify.mjs --scenario=advanced
# 复用已经校验仍有效的产物；默认阈值为本夹具的 2500 字节
node entries/F18-rollup-plugin-visualizer/examples/check-budget.mjs
# 故意把阈值设到 1 字节，观察真实 FAIL 和 exit 1
node entries/F18-rollup-plugin-visualizer/examples/check-budget.mjs --max-initial-gzip=1
```

预算是**入口及其递归静态依赖的各 JS 文件，用 gzip level 9 单独压缩后的字节之和**。`report-policy.mjs` 用已访问集合处理共享依赖和循环，缺失的静态 import 会失败，不能少算后继续变绿。`check-budget.mjs` 先验证源码摘要、已装版本与全部构建产物，再比较实际值和阈值；不是拿页面里的固定数字执行 if。

2500 是这个小夹具的演示阈值，不是通用产品标准。1 字节示范证明门禁会失败，不代表发现了业务回归。把阈值、适用入口和压缩方式写进业务仓库的版本化预算文件，再让 CI 执行同一检查。这个指标不含 HTML、CSS、图片、HTTP 头、服务器压缩配置或缓存，不等于线上传输量；延迟加载也不能减少用户最终调用功能的计算成本。

## 配置里值得迁移的部分

[完整配置](./examples/vite.config.ts)有两处时序是实验正确性的关键：

- 入口选择的 `transformIndexHtml` 用 `order: 'pre'`，使 Vite 在解析入口前看到 static 或 lazy 入口。默认后处理替换 HTML 会导致两份实际构建仍使用同一个入口。
- inventory 和 Visualizer 都在插件 `enforce: 'post'`、`generateBundle` 的 `order: 'post'` 执行。Vite 会在生成阶段替换动态 import 的 preload 占位符；过早统计可能拿到与磁盘 JS 不同的字节。本例读回文件的长度、gzip 与 SHA-256，发现不一致就失败。

在 React 项目中，优先选真实交互边界，例如点击后启动编辑器，或用 `React.lazy(() => import('./editor-page'))` 与 Suspense 承载页面。确认没有其他同步引用把相同依赖拉回首屏；不要用随意 `manualChunks` 替代加载边界设计。仅做分析时，通常只迁入 Visualizer 配置；双入口夹具、摘要和预算脚本属于本例自建验证工具，不是插件内置功能。

## 如何判断结果可信

`reports/summary.json` 只在成功构建并校验后写入，记录时间、运行版本、输入摘要、实际命令、chunk 大小、模块归因、产物摘要和比较。平台只读调用 [summary-reader.mjs](./examples/summary-reader.mjs) 的 `readCurrentSummary()`；源码、锁文件、版本或报告改动后返回 `not-generated`，不会继续展示过期结果。生成文件均在本条目忽略范围，缺文件时只显示未生成。

这是本地复核材料，不是签名或逐库正式收据。`report-policy.test.mjs` 使用合成 chunk 图，只验证本例的闭包和预算逻辑；它不能证明 SDK 执行。正式 sdk/build/browser 状态仍以项目现有 `verify:record` 和匹配输入的收据为准，当前均保持 NOT_RUN。报告 HTML 在本机手动打开；Lab 不提供任意构建命令 Web endpoint，也不把报告 HTML 当站内可执行源码发布。

报告和 hidden maps 可能包含私有目录、模块名与源代码；`projectRoot` 裁剪并非脱敏保证。对外分享前检查真实内容。

## 与相邻工具的分工

dependency-cruiser（F16）（F16）在源码导入图上约束架构规则；Knip（F15）（F15）寻找没有使用的文件与依赖；Visualizer 解释已经生成的包。源码规则零违规、不再有未使用文件和包体积合适是三个不同结论。先用模块归因提出可验证的改动，再用真实构建和运行数据判断结果。
