# D09 Axios 工程检索指南

适合需要独立 HTTP 实例、拦截器和 AxiosError 约定的 React/Node 工程。少量请求优先考虑 Fetch；Fetch 风格与声明式重试比较 Ky；服务端缓存与失效由 Query 负责。固定 axios@1.20.0，MIT，类型随包提供。

## 读取与集成

先读 library.json、[guide.md](guide.md)、[fixture-client.ts](examples/fixture-client.ts)、[example.tsx](examples/example.tsx)、verification.json。源码面板直接展示这些原件。普通 React/TypeScript 应用 `pnpm add axios@1.20.0`，复制两个实际源码文件，渲染 `<AxiosWorkshop level="business" />`；demo.tsx 仅为 Lab 重导出。无环境变量、私密数据或自有样式依赖。

生产删除本地 adapter/resetTransient，配置受信 baseURL 与真正服务端鉴权。请求拦截器给实例加头，adapter 返回 AxiosResponse，响应拦截器再处理；业务取 data 并校验。不要给全局 defaults 加令牌。自定义 adapter 自己映射 HTTP 错误；fixture 的延迟/过滤/503/409 均非网络。

## 三个目标

- basic：GET 列表，adapter 日志必须见 isolated 头，响应拦截器见 200；团队 b 只有 b1。
- business：IME 组合时不提交，组合结束后手动 GET；先慢后快只保留 React 结果。新请求清旧 timer、abort 并增 generation，换租户也遵守此规则。
- advanced：自建 boundedGetRetry 仅 GET503 最多两次，取消或非503立即结束。每次故障演示重置计数。POST409一次且不重放。Axios没有内置重试。

## 必须保留的边界

卸载作废 generation、abort、清 timer、eject 自己的拦截器；effect setup 幂等 install 处理 StrictMode重演。Signal取消资源，generation保证写回归属。不要无条件重放 error.config；不要把租户筛选当授权。Query键包含租户和查询参数，并透传 signal。

fixture 配了 timeout 但没有网络 adapter 超时实现，因此不能证明2秒超时；真正 transport、CORS、Cookie、认证刷新和上传进度均未实现。不要导入到SPA/SSR/mobile模板；这些模板有自己的API-client协议。

## 证据与测试

[SDK套件](tests/sdk.test.mjs)真实导入 Axios 和显示中的客户端，断言头、租户、拦截器重装、origin拒绝、两次重试上限、单次409与取消。[浏览器套件](validation/browser.spec.ts)交主控复制到公共 e2e 后运行。结果见 [local-validation.md](local-validation.md)，本地结果与正式验证收据分开。

README固定官方提交84a9f3b9a4f3244b8c8e818f557d64c7b964fb25，英文原文（固定树无中文README）；homepage unknown，不把GET200当可嵌入证明。sdk/build/browser正式状态无匹配收据保持NOT_RUN。
