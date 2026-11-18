# lodash-es：集合语义与防抖生命周期

需要复用 Lodash 的去重、分组、多键排序和防抖语义时，ESM React 工程可以选择 `lodash-es@4.18.1`（MIT）。只有简单 map/filter 时原生数组已经足够；新项目可比较 D01 es-toolkit 的类型与函数覆盖。ESM 导入是否减少产物应以你的构建分析为准。本例只使用 lodash-es，没有同时引入 lodash CommonJS。

## 实验一：处理顺序改变业务结果

五条本地 Feed 含两个 ai：前者 81 分、后者 99 分。默认 `uniqBy(rows, 'id')` 留下第一条 81；勾选「先按分数排序再去重」，先 `orderBy` 降序，留下 99。去重后的分组用 `groupBy`，每组按 score 降序、id 升序解决同分，`chunk(unique, 3)` 得到长度 3、1 的批次。

操作复选框，对照输出 unique、groups、batches。它们都是真实 SDK 返回值。fixture 不是后端返回，分数也不是实时数据。去重后才排序不能找回已丢弃的高分记录。`chunk` 只划分数组，不会限制异步并发；需要并发上限时考虑 D03。

## 实验二：防抖有资源所有权

切到进阶，输入 abc 并停手 400ms，外层事件数组新增一次 abc。快速连续输入共用同一个 `debounce` 实例，末尾参数覆盖前面的待执行参数。点击 flush 立刻执行待触发调用；没有待触发调用时不会新增。输入新词后立即 cancel，等待超过 400ms，事件不增加；取消不清空输入框。

组合输入开始时取消待执行调用，组合期间 onChange 只更新输入；compositionend 后以最终字符串重新开始 400ms 等待。浏览器自动化可以验证事件策略，真实中文输入法候选体验仍要人工检查。

输入新词后立即点击「卸载输入并观察」。输入组件 effect 清理调用 cancel；650ms 后，仍挂载的外层观察器显示「卸载后新增 0 次」，事件数组保留。只看到输入组件消失无法证明计时器已取消。重新挂载后输入仍可提交。观察器自身计时器也在外层卸载时清理。

`flush` 不等于每次输入返回一个 Promise；`cancel` 仅取消尚未执行的调用。若回调已经发出请求，还需 AbortController 和旧结果隔离，本例没有网络调用或请求取消实现。异步失败应在业务回调捕获并显示错误，重试由业务决定；debounce 不提供请求错误恢复。

## 迁入 React 项目

在目标项目根运行 `pnpm add lodash-es@4.18.1` 和 `pnpm add -D @types/lodash-es@4.17.12`。目标需要 React、React DOM、TypeScript 与支持 ESM/TSX 的构建器；不需要 Lodash provider、CSS、环境变量、后端或额外 Vite 插件。

复制 [examples/example.tsx](examples/example.tsx)，页面导入默认组件并传 `level="basic"` 或 `level="advanced"`；[examples/demo.tsx](examples/demo.tsx) 仅是 Lab 的重导出适配，不必迁入。集合逻辑可单独提取 buildDigest；Feed 类型和 fixture 也在同一文件。要复跑 SDK 断言，复制 [tests/sdk.test.mjs](tests/sdk.test.mjs)，在安装依赖的目标目录运行 `node --test tests/sdk.test.mjs`。

生产搜索可只带 SearchInput，父组件提供稳定的 onApply（useCallback），否则每次父渲染会替换 debounce 并取消旧计时器。保留 useMemo、composition ref、effect cancel。不要在 render 每次新建防抖函数，也不要对 React state 原地 merge。外层 observer 是教学验收设施，不是 SDK API。

## 来源与验证

固定 tag 4.18.1 对应提交 `454999199c880707789e941d14e5a62e0c7527fa`。官方根目录未发现中文 README，因此保留英文原文 [official/readme.md](official/readme.md)，不把本指南冒充官方译文。API 对照匹配版本安装包的 debounce.js、uniqBy.js、groupBy.js、orderBy.js、chunk.js 及 [官方仓库](https://github.com/lodash/lodash/tree/4.18.1)。

官网实际响应 `X-Frame-Options: SAMEORIGIN`，与 Lab 不同源，按 blocked 展示直达入口；原始响应在 validation/homepage-headers.txt。没有凭 iframe load 事件推定允许。

本地执行和六项状态见 [local-validation.md](local-validation.md)。正式 sdk/build/browser 收据保持 NOT_RUN，不能将本地测试或历史仓库 CI 写成正式 PASS。
