# es-toolkit：把 RSS 列表处理成可分页摘要

当业务需要组合排序、按键去重、分组和切块时，es-toolkit 提供可读的纯函数。这里固定 **1.52.0 / MIT**，从 `es-toolkit/array` 导入四个函数。单次 `map` 或 `filter` 已能清楚表达的需求可直接用原生数组；存量 Lodash 项目应逐 API 比较 `es-toolkit/compat`，不能全局换包后假定行为一致。它不负责 HTTP、schema、缓存、并发控制或数据库唯一约束。

## 一个完整实验

打开 Demo，点击「运行真实工具函数」。五条本地 RSS fixture 经过同一流水线，输出直接来自实际函数返回值，不请求网络。三个旧场景已合并为一个目标：理解处理顺序如何决定最终列表。

1. `normalized` 有 5 条：手写 `normalizeArticle` 验证对象、非空标题、可解析日期；`canonicalUrl` 拒绝非 HTTP/HTTPS 协议，去掉 hash 和 `utm_*` / `fbclid` / `gclid`，保留业务 `id` 并排序 query。此阶段是本例业务逻辑，SDK 不会替你验证或识别追踪参数。
2. `sorted` 有 5 条：真实 `orderBy` 按发布时间降序，再按 URL 升序。`Release notes` 最先，旧稿 `Same article older` 仍存在。
3. `unique` 有 4 条：真实 `uniqBy` 对规范化 URL 保留**第一次出现**的记录。由于已排序，留下 `Frontend Insights`，丢掉同 `id=42` 的旧稿。`id=43` 独立保留。
4. `groupSizes` 是 official 2、community 2、other 0：真实 `groupBy` 在去重后分组，缺失组由业务代码补空数组。
5. `pages` 是两页、每页两条：真实 `chunk` 切最终文章数组。它只切数组，既不请求下一页，也不限制异步并发。

修改「每页文章数」为 3 后重新运行，页长应为 `[3,1]`，去重后的文章仍是 4 条。勾选「包含两个坏输入」后运行：`inputCount` 为 7，`rejected` 的下标为 5、6，正常文章仍为 4 条。这说明坏行逐条隔离，不会让整批失败。

「文章 JSON」可直接编辑：把较旧稿的日期改成更新日期，再运行，便能观察保留者改变。输入 `{}` 或破损 JSON 会显示 alert 并清空旧输出；点击「恢复示例输入」恢复五条 fixture，再运行恢复结果。空数组是合法输入，得到空页；空标题、坏日期、非对象进入拒绝列表。

## 为什么顺序不能随意调整

`uniqBy` 不知道“最新”是什么，它只看键是否出现过。先去重再排序会把旧稿留下，排序无法找回已经丢掉的数据。先规范化才能让只差追踪参数的 URL 相等；若直接清空 query，又会误合并 `id=42` 与 `id=43`。分组在去重之后，计数才表示最终文章数。

相同 URL、相同发布时间的冲突当前保留输入中先出现的记录。跨租户、转载、URL 大小写、重定向和内容主键都需要产品另定规则。本例不擅自移除未知查询参数，也不证明该 URL 一定指向可信内容。日期只使用 `Date.parse` 的可解析性，不是严格 ISO schema；生产接口应按约定进一步验证。

## 从实际源码迁入 React 项目

执行 `pnpm add es-toolkit@1.52.0`。把以下文件复制到同一个功能目录：

- [`examples/pipeline.mjs`](examples/pipeline.mjs)：纯函数、fixture 和真实 SDK 调用。
- [`examples/pipeline.d.mts`](examples/pipeline.d.mts)：JS 模块的 TypeScript 公共类型；TS 项目需与模块一起保留，也可把实现改为带类型的 `.ts`。
- [`examples/example.tsx`](examples/example.tsx)：交互 UI，默认导出组件。

在已有 React 入口渲染 `<ToolkitExample />`。现有项目需有 React、JSX 编译和 ESM 模块解析；不需要环境变量、API key、CSS 资产或额外插件。`demo.tsx` 只是 Lab 的重导出适配，不是业务必需文件。示例 className 仅供宿主排版，组件功能不依赖它。生产用接口返回值替换 `seed`，在数据层调用 `makeDigest`，不要复制查询结果到第二个全局 store。

核心入口为 `makeDigest(raw, pageSize)`：页大小必须为 1–100 的安全整数，否则抛 `RangeError`。它返回规范化记录、排序结果、去重列表、分组、分页和拒绝原因，便于业务界面各取所需。错误只包含短原因和行号，不回显整条原始 payload。纯函数没有定时器、监听、网络或持久资源；组件离开时只有 React 本地状态需回收。

这是内存处理：排序需要持有整个数组，页面不是服务端游标分页。大数据应在服务端处理或明确设计 Worker；引入 SDK 并不自动改善大列表性能。这里没有测包体、耗时或浏览器兼容矩阵，不把官方性能宣传当成本实验测量。

## 核对实际结果

[`tests/sdk.test.mjs`](tests/sdk.test.mjs) 导入真实 SDK，并调用与 UI 相同的 `pipeline.mjs`：覆盖最新稿保留、id 区分、追踪参数、坏行隔离、空输入、分页和页大小边界。

从仓库根运行 `pnpm --filter @reactloom/library-lab test:sdk --entry=D01`；命令是否支持该参数以当前 runner 为准。本地实际命令、退出码、日志和六项状态见 [`validation/local-validation.md`](validation/local-validation.md)。浏览器需独立检查可编辑输入、错误及恢复；Node 成功不能证明组件已点击通过。正式 sdk/build/browser 收据仍按 `verification.json` 的 NOT_RUN 处理。

## 官方资料

官方中文 README 原文保存在 [`official/readme.md`](official/readme.md)，来自 [v1.52.0 对应固定提交](https://github.com/toss/es-toolkit/blob/32f4c8fb33828ad6512064ba84b0fdd8fda966a3/README-zh_hans.md)。源路径、语言、摘要与同步日期在 `library.json`，原树和 tag 查询保存在 `official/`。README 的宣传与基准是上游陈述。

[官方中文站](https://es-toolkit.dev/zh_hans/)保留直达入口。响应检查记录在 `official/homepage-headers.json`；尚未从实际 Lab origin 确认 iframe 内容，状态 unknown。API 机制可对照该固定提交的 `src/array/{orderBy,uniqBy,groupBy,chunk}.ts`；此处只讲实际调用的四个 API。
