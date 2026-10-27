# C09 React Virtuoso 维护规则

读上级 AGENTS.md、library.json、agent.md、verification.json。三层示例都使用 examples/example.tsx，demo.tsx 仅重导出。保持浏览器真实虚拟化库和有界确定性 fixture，不 mock 所研究的 SDK。更新组件源码后保证指南匹配并让 PLATFORM 通过 generator 刷新真实 sourceFingerprint。不得将 Node 模型测试宣称为滚动/测量浏览器 PASS；不编辑公共代码、package.json 或锁文件。

新增 view-policy.mjs/.d.mts 为真实 UI import，修改时同步 Node 策略回归与三个 level 的 sourceFiles。不要用同名 query 当唯一 viewport 身份。
