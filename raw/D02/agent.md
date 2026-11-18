# D02 工程迁移指南

适合需要 Lodash 既有语义的 ESM 集合处理与输入防抖。固定 lodash-es 4.18.1 / MIT，类型 @types/lodash-es 4.17.12；不要并行打包 lodash CJS。简单 map/filter 用原生即可；并发、缓存、HTML 清洗不属于本例。

复制 examples/example.tsx 即包含全部类型、fixture、组件和处理函数；demo.tsx 仅 Lab 出口。React/React DOM/TypeScript + ESM TSX 构建器即可，无样式、provider、环境变量、网络和额外配置。安装命令与复跑路径见 guide.md。

buildDigest 默认先 uniqBy 留第一条，勾选先 orderBy 则留下最高分；groupBy 产出组数组，orderBy 明确方向和同分 id 决胜，chunk 不是并发限制。数据来自本地 fixture，不能声称后端集成。

SearchInput 的 debounce 实例由 useMemo 持有，onApply 必须稳定；effect 取消待执行调用。compositionstart 取消并进入组合态，onChange 组合期间不调度，compositionend 调度最终值。flush 执行待触发调用，cancel 不清输入、不取消已发出的请求。接网络时另做 abort、旧响应隔离、错误捕获和显式重试。

外层事件数组与 650ms 观察器在输入组件卸载后保留，验证新增次数为零；外层自己的 timer 也需清理。不要用组件消失作为取消证据。不要每次 render 重建 debounce，或让不稳定回调取消待执行输入。

断言：默认 ai=81，先排序 ai=99；批长度3/1；快速输入合并一次；flush 后等待不重复；cancel 后超过等待不提交；组合期间零提交、结束后提交最终值；输入后立即卸载并等待650ms，外层新增0；重新挂载可提交。SDK tests 真正导入 lodash-es，但 IME、React 卸载必须另测浏览器。

官方原文固定提交见 library.json official；官网 SAMEORIGIN 禁止 Lab iframe。正式 verification.json 无干净 recorder 收据保持 NOT_RUN。本地日志只证明其记录的执行范围。
