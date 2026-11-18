# F18 工程迁移指南

当问题是“实际构建把哪个模块带进了哪个 chunk、为什么包含它”时选 rollup-plugin-visualizer。它不测网络时机、运行时 CPU 或 React 渲染成本；架构规则用 F16，未使用文件/依赖用 F15。

## 版本与数据流

本例锁定 visualizer 7.1.1 / Vite 8.3.4；安装图实际是 Rolldown 1.2.13。核对本地 Vite `dist/node/index.d.ts`，Vite 8 插件继承 Rolldown，`build.rollupOptions` 是 `rolldownOptions` 的弃用别名。本配置不需要这两项中的任何一个。

Visualizer 的 `dist/plugin/index.js` 在 `generateBundle` 中读取 chunk.modules、source map 和 getModuleInfo()，生成体积树与导入边。`sourcemap: true` 时关闭模块 gzip/brotli；模块 renderedBytes 是最终代码映射归因，可能不包含包装/未映射字节。预算另用完整最终 JS 的 gzip level 9，不能加总模块面积当最终大小。

## 最小接入与工程选择

1. 把 Visualizer 加在真实 Vite 生产构建的插件末端，配置 `open: false`、自己的报告目录。分析 source-map 归因时同时保留 Vite hidden maps；注意 maps 包含源码。
2. 先用 treemap 定位模块/chunk，再用 network 的 importedBy 找到业务导入路径。
3. 在实际可选交互或 React.lazy 页面边界移动 import；排查同依赖的其他同步引用。
4. 保持功能相同，分别构建改动前后，比较初始静态闭包和全部 JS，再用浏览器验证请求时机及执行影响。

本例同功能夹具由 index.html、main.ts/main-lazy.ts、view.ts、helper.ts、heavy.ts 构成。heavy.ts 是小 Fibonacci 函数，不能称为大依赖或据此承诺收益；真实本地结果已出现拆包后入口 gzip 增大的情况。

## 可直接复现的配方

所有命令 cwd 是 `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`：

```sh
node entries/F18-rollup-plugin-visualizer/examples/verify.mjs --scenario=basic
node entries/F18-rollup-plugin-visualizer/examples/verify.mjs --scenario=business
node entries/F18-rollup-plugin-visualizer/examples/verify.mjs --scenario=advanced
node entries/F18-rollup-plugin-visualizer/examples/check-budget.mjs
node entries/F18-rollup-plugin-visualizer/examples/check-budget.mjs --max-initial-gzip=1
```

最后一条预期真实 exit 1，其余在当前夹具与默认 2500 字节预算下预期 exit 0。`verify.mjs` 无参数默认 advanced，兼容平台 CLI runner。basic 只构建 static；business/advanced 都构建 static/lazy，两者知识目标分别是改动归因和预算门禁。不要为不同报告格式另造 Demo。

## 需要带走什么

只分析业务项目时迁入 `visualizer` 配置即可。本例的可复现对照要复制完整 `examples/`（排除生成 reports），包括 vite.config.ts、两份入口与共享 view/helper/heavy、verify.mjs、summary-reader.mjs、report-policy.mjs 和 check-budget.mjs；按目标项目修改固定路径、版本输入和预算。合成图策略测试不是运行依赖。

入口替换必须 `transformIndexHtml.order: 'pre'`；inventory 和 Visualizer 用 `enforce: 'post'` 加 `generateBundle.order: 'post'`，等 Vite 替换 preload 占位符后再分析。读回真实 JS 再校验 SHA-256、字节与 gzip，避免中间输出与磁盘产物不符。

## 摘要与清理边界

固定输出是 `examples/reports/static`、`lazy`、`summary.json` 和 `budget-result.json`。清理不得扩大到 Lab dist、别的条目或调用者输入路径；reports 与关键目录不能是符号链接。生成目录受条目 .gitignore 忽略。

平台可只读 import `readCurrentSummary()`：成功返回 `{status:'ready', summary}`；输入或版本变化、产物缺失、摘要/产物不一致返回 `{status:'not-generated', reason}`。它重新从真实磁盘产物派生指标，不执行构建。摘要不是正式收据，更不是签名。

## 应验证的断言

- 两入口同功能：统计总和15；输入12得到144；输入0得到0；非法值不能计算；加载错误有可见信息，按钮恢复。
- static 初始闭包含 heavy.ts；lazy 初始闭包不含它且真实产物有其动态 chunk；不能仅断言“有两个 JS”。
- 初始预算递归静态 imports，排除动态专有 chunk；共享/循环依赖只计一次，缺失静态依赖必须失败。
- 报告模块归因必须包含 helper/view/heavy，最终 chunk 的字节/gzip/digest 与磁盘一致。
- check-budget 默认预算应通过；1字节预算应真实非零退出；源码或产物变更后拒绝读取旧摘要。
- 浏览器禁用缓存观察点击前后实际请求，再屏蔽 heavy chunk 验证错误路径。分包证明构建边界，不能代替该观察。

## 证据限制与反例

`report-policy.test.mjs` 的合成图只测自建策略。仓库 Lab 应用 build 不是隔离 fixture build。当前本地实际命令、退出码和产物见 local-validation.md，verification.json 没有正式收据仍为 NOT_RUN。不要把报告存在、任意HTML、两个chunk、主应用CI或预算阈值示范写成 SDK/浏览器 PASS。

不要用模块 gzip 面积冒充网络字节；不要预设 dynamic import 会降低初始体积；不要公开未审查的 raw-data/maps；不要加任意命令 Web 执行接口。
