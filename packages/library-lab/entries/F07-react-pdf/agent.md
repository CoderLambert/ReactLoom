# F07 react-pdf — AI Agent 集成准则

**用途**：展示已有 PDF、分页/文本层/Annotation，React19。需要创建文档用 F08 @react-pdf/renderer；需要编辑现有 PDF 用 F09 pdf-lib；需要自定义 Canvas 渲染用 F06 PDF.js。

**来源与版本**：官方 react-pdf v11.0.0 (MIT)；主线程 pdfjs 与 worker 必须同版本；当前 react-pdf 11.0.0 与 F06 约定 pdfjs-dist 6.3.289，安装后仍须从实际锁文件核对解析到的依赖，不复制随手找到的其他 worker。Node>=22.13，React>=19。读 `library.json` 和 `verification.json`，不可照搬未实测的 PASS。

**迁移源码**：`examples/example.tsx`、`examples/fixture.ts`。业务代码只需 Document、Page、worker同模块配置、page state和处理 onLoadSuccess/onLoadError；fixture 仅教学使用。按业务引入TextLayer.css，决定 Annotation layer 是否开启。

**硬性工程约束**：pdfjs-dist 使用本地构建版本相同 worker，不使用无版本的外链；用户PDF受权限/大小/密码保护，不能未经许可发第三方CDN；本地File读取要避免旧请求回写；大量页按需渲染，控制Canvas与文本层内存。SPA懒加载不等于Worker/字体一定被清理，需实测。

**验证指令**：typecheck/build，Chromium打开原创2页PDF/第二页导航、坏文档错误、恢复、文件尺寸拒绝、离开Tab取消异步读取；检查网络面板只加载本地Worker，无上传/外链。没有这些证据，所有SDK/build/browser仍 NOT_RUN/BLOCKED。

**官方文档**：https://github.com/wojtekmaj/react-pdf


静态合同回归：`node --test entries/F06-pdfjs/examples/worker-version.test.mjs`；浏览器还要验证 F06 与 F07 交替挂载时没有版本错误、重复Worker或已销毁状态回写。禁止将该静态测试记为SDK PASS。

## Wave21 Worker迁移注意

不要直接把React可复用PDF数据或内建fixture作为`Document.file`传给PDF.js Worker。迁移 `worker-payload.mjs/.d.mts`，经 `createPdfWorkerPayload(bytes)` 建独立Uint8Array，`useMemo`保持file对象身份，文档generation变化才重建。没有真实SDK/浏览器运行证据，Node transfer策略PASS不能升级verification。
