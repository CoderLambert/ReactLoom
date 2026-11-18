# F07 工程复用

先读 guide.md、library.json、verification.json 和 examples 原件。react-pdf11.0.0 MIT / pdfjs-dist6.3.289 Apache-2.0；用于阅读，不用于生成。

迁入 example.tsx、fixture.ts、worker-payload.mjs/.d.mts、render-budget.mjs/.d.mts。React19+Vite，vite/client 支持 ?url；保留 TextLayer.css，同模块 Worker 绑定。默认未启用批注，未配置密码/CMap/标准字体/WASM。fixture 原创两页，不代表任意 PDF。

SDK 管 Document/Page 生命周期。自建策略：3MiB、读代次、keyed session、transfer副本、Canvas 几何门控。必须先 renderMode none，从实际 viewport 同时拟合宽高，固定DPR1，验证后才挂Canvas。不要替换成仅 width 或仅 scale；巨大MediaBox文件可很小。上限1080×1440不是整个PDF解析内存或CPU保证。

input.onClick 在打开新 picker 时先失效旧读取，不依赖原生取消触发 change；onChange 新选择（包括无效输入）、重置、损坏、卸载也失效旧读取；不声称物理abort arrayBuffer。file memo稳定，换文档key，页面和zoom另key重做几何。不要把原状态buffer转移，也不要一次渲染所有页。

Node仅policy；真实Document/Page/Worker/Canvas/textLayer和terminate由浏览器证明。正式verification保持NOT_RUN；validation/browser.spec.ts是主控提案，不是收据。官方固定来源见official/source-evidence与library.json；首页unknown不等于允许嵌入。

副本必须 new Uint8Array(source)，不能 source.slice()：Node Buffer 也通过 instanceof Uint8Array，但其 slice 共享底层内存。

显式设置 Document 与 Page 的 `suspense={false}`。v11默认true会在useSuspenseResource中use(resource.promise)，初挂载重试无法依赖尚未提交的session useMemo身份稳定，还会将错误交给宿主边界。本例选择SDK useResource的Effect加载路径：active拦截迟到结果，cleanup调用task.dispose（Document映射loadingTask.destroy），Page上下文传递false给Canvas，render effect cleanup取消实际任务；loading/error/onLoadError继续在阅读器局部处理。不能删掉这两个false后仍声称相同行为。主控candidate35曾稳定停宿主Suspense，此修复须由主控重建真实浏览器验证。
