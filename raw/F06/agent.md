# F06 PDF.js 工程检索

适用：浏览器 Canvas 预览已有本地 PDF；文字层抽取不是 OCR，生成看 F08、修改看 F09、React 包装看 F07。固定 pdfjs-dist6.3.289 / Apache-2.0，F07 必须同步底层版本。

迁入 `example.tsx`、`fixture.ts`、`render-gate.mjs/.d.mts`、`render-budget.mjs/.d.mts` 六份，React Vite 工程启用 DOM、react-jsx、Bundler、vite/client。挂载 default Viewer 的 level basic/business/advanced。`demo.tsx` 只服务 Lab。不要复制测试充当运行依赖。完整 sources 在 library.json；strict-copy 只检查复制源码和使用方，不是全仓 typecheck。

同模块 `GlobalWorkerOptions.workerSrc = workerSrc`，workerSrc 是同版 `pdfjs-dist/build/pdf.worker.min.mjs?url`；不换 CDN。每次 data.slice 保留调用方源。实际 CSP worker-src 和 Worker 构造/terminate 属于浏览器验收，字符串测试不证明。

关键不变量：
- keyed level 拥有完整会话；卸载增 fileGeneration，cancel render，destroy accepted/candidate/probe。
- 每个 File 选择在校验前增代次并销毁旧候选和探测；空/超3 MiB/非pdf后缀也作废旧读取。arrayBuffer 不是真正可取消，只忽略过期结果。
- 候选成功后才替换 accepted；坏文件/坏字节探测保留当前文档。WeakMap 缓存 destroy promise，重复清理不重复调用；捕获销毁异常不保证资源已释放。
- render cancel 异步，必须通过 render-gate 等前次 settled 再复用 Canvas。active 防页面/文本迟到；失败排队清画布和去旧文字。
- 输入3 MiB不是画布安全保证。分配前 viewport/DPR有限正数、CSS/背板每边≤4096、DPR≤2、乘积≤8,000,000；超限不保旧画面。

基本只画第一页；业务分页并 getTextContent；进阶缩放/本地候选/独立损坏探测。没有远程PDF、OCR、编辑、CMap、标准字体、WASM、口令或完整表单支持。Canvas图片标签不等于完整无障碍阅读器，文字顺序也不保证。生产不可信文件需独立安全隔离。

Node legacy SDK2与policy9分计，Node真实解析/文字但不是浏览器Worker/Canvas。browser proposal主控执行，正式verification无recorder保持NOT_RUN。官方README/LICENSE固定原字节与版本包字段见 official/source-evidence.json，英文README无中文候选；官网GET200无阻止头仍unknown（未真实嵌入）。阅读local-validation保留warning和证据边界。
