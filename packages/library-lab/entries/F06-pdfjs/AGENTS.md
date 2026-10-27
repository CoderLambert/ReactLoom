# F06 PDF.js 条目维护

先读上级规范及本条目agent.md。演示只允许本地字节/原创fixture，不从第三方PDF域名直接fetch。Worker与主线程须同版；取消渲染与destroy不能删除。PLATFORM统一调整依赖和锁；仅真实浏览器证明后填写PASS。

单Canvas并发绘制必须经 `examples/render-gate.mjs` 串行化；Node测试运行 gate + 静态版本合同，真正PDF.js/React-PDF渲染仍需PLATFORM安装依赖后在浏览器验收。F06/F07使用 `pdfjs-dist@6.3.289`，统一升级，禁止异版Worker。

## Wave21 条目维护硬约束

每次真实PDF页渲染前执行render-budget；CSS边长和物理Canvas背板边长均不超过4096px、总像素不超过800万。拒绝超限页面不可分配巨大Canvas，不得以3MiB输入文件检查替代。
