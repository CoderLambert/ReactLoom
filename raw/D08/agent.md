# D08 Ky 2.2.0 集成决策

适合已有 Fetch/ESM 工程集中 HTTP 状态异常、JSON、预算和有限重试；只有少数调用先用原生 Fetch，已有 Axios 上传/拦截器设施先评估迁移成本。Ky 不拥有 React 状态、缓存、schema 或并发队列。固定依赖 ky@2.2.0；Node >=22，浏览器需 Request/Response/AbortController。

读取 library.json → guide.md → examples/example.tsx、transport.mjs、transport.d.mts、demo.tsx → verification.json。官方 readme 固定提交 3541888878c4d303a8bc2ad61815f4e048f55a5d，安装包 distribution/types/options.d.ts 核实 timeout/totalTimeout/maxResponseSize/prefix。勿用 v1 prefixUrl 和旧 hook request 单参。

最小迁移：`pnpm add ky@2.2.0`；已有 React + JSX automatic runtime，复制 example.tsx、transport.mjs、transport.d.mts 到同目录，模块解析 bundler/NodeNext。页面默认组件传 level；demo.tsx 是 Lab 适配出口。没有内部宿主导入、必需 CSS、密钥、env 或服务。生产移除自定义 fetch，替换可信业务 URL；保留校验和生命周期，fixture 不作为生产网络/SSRF 防护。

模型：ky.create 统一传输策略，GET → json<unknown> → validateSources → ticket 相等且未取消才 setData。实例 timeout 1200、totalTimeout 2500、仅 GET 503 可额外重试一次；409/写入不重试。maxResponseSize 在正文读取时生效。泛型不是校验；validateSources 是自建。HTTPError.data 已消费错误正文，不再 response.json；204 只读状态。错误分 HTTP/Timeout/ResponseSize/Abort，不泄露请求头。

不可删：每次新请求 abort 并递增 generation，手动搜索清模拟 timer；取消清 timer；卸载 generation++、abort、clearTimeout；IME composition ref 阻止组合期间提交。慢查询返回 security、快查询返回 frontend，不能改成相同数据而仍声称验证竞态。每次 retry 演示 resetTransient，不能复用上次已成功计数。

实验：basic 三来源；business 关键词筛选、slow→fast 只保留 frontend、取消与 IME；advanced 两次 GET 503、一次 POST409、30ms超时、恶意协议自建校验、100B上限及204。tests/sdk.test.mjs 真实导入 Ky 和实际 UI transport；tests/policy.test.mjs 单列 schema 反例，不能提升为 SDK PASS。Chromium 验证见 local-validation.md。

限制：内存 Response，无真实 HTTP、CORS、Cookie、OAuth、流式外站、真实服务端幂等/Retry-After；Ky 不提供恰好一次写入。Query 集成传 signal，避免双层重试；生产身份头须在允许 origin/path 之后注入。官网禁止嵌入，来源响应头存 official/source-evidence.json。

本地执行与正式收据不同：见 local-validation.md；verification.json 无匹配收据保持 NOT_RUN。不得把 dirty 候选测试改成正式 PASS，不修改共享 runner/锁/索引，不提交推送或部署。
