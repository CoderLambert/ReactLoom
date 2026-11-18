# PDF.js 6.3.289：已有 PDF 的本地分页预览

PDF.js 解析已有 PDF，`getPage().render()` 绘制 Canvas，`getTextContent()` 抽取文字层；它不生成或编辑 PDF，也不是 OCR。Lab 固定 `pdfjs-dist@6.3.289`，Apache-2.0，与 F07 的 React-PDF 使用同版底层。需要修改字节看 F09，需要生成报表看 F08。

示例不访问远程 PDF。默认两页由 `fixture.ts` 原创生成，advanced 的用户文件只读入当前浏览器内存，不上传。客户端限制不是文档安全沙箱，也不是服务端验证。

## 三个独立目标

| 场景 | 操作与可观察结果 |
| --- | --- |
| 基本 | 启动后真实 Worker 解析，Canvas 画出 `ReactLoom PDF Guide`；状态包含页码和背板尺寸 |
| 业务 | 下一页显示第二页，文字输出含 `ReactLoom News Summary` / `Page Two`；两端按钮禁用 |
| 进阶 | 80%–200% 缩放、本地 PDF 候选解析、独立坏字节探测；失败保留已接受文档，过大页面则清空旧画面并报预算错误 |

文字抽取不保证阅读顺序、表格结构或无障碍文字层。扫描件可以无文字；空输出不表示 PDF 没有内容。Canvas 的图片标签不能代替可选文字与完整阅读器无障碍设计。

## 最小迁入

安装精确 `pdfjs-dist@6.3.289`，React/ReactDOM 与项目版本一致。复制下面六份文件并保留相对路径：

- `examples/example.tsx`、`examples/fixture.ts`。
- `examples/render-gate.mjs`、`examples/render-gate.d.mts`。
- `examples/render-budget.mjs`、`examples/render-budget.d.mts`。

在 Vite React 工程中挂载 `<PdfViewerExample level="business" />`。迁入 TypeScript 工程启用 `jsx: react-jsx`、`moduleResolution: Bundler`、DOM lib 和 `vite/client` 类型以识别 `?url`。`demo.tsx` 只是 Lab 宿主适配，可省。Node 测试不是运行依赖，不必复制。完整声明见每个 demo 的 `sourceFiles`，隔离严格迁入编译记录见 `validation/strict-copy-command.json`。

`example.tsx` 在调用 `getDocument` 的同一模块设置：

```ts
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
GlobalWorkerOptions.workerSrc = workerSrc
```

这由 Vite 发出本地同版 Worker asset，不能换成未知版本 CDN。部署应允许本地 `worker-src`，实际请求、构造、终止要看浏览器；源码字符串检查不证明 Worker 成功。输入传 `data: source.slice()`，避免 Worker 转移调用方保留的原始 buffer。

## 任务所有权和迟到结果

外层以 `level` 为 key 创建独立会话。切换场景销毁旧会话，不把用户文件/页码带进新会话。acceptedTask 持有已接受文档，pendingTask 持有候选解析，probeTask 只持有坏字节诊断。每个加载任务通过 WeakMap 缓存 destroy promise，避免重复调用销毁；销毁异常被捕获，不表示资源释放已经成功。

任何新的 File 选择都先增加 `fileGeneration` 并销毁旧候选/探测，再检查空文件、3 MiB 上限和 `.pdf` 后缀。即使新选择非法，旧 `arrayBuffer()` 的迟到结果也不会提交。浏览器 File 读取自身不能被取消，这里是忽略结果。取消选择文件（没有 File）不改变会话。后缀不证明内容格式。

候选解析成功才提交新的 PDF，并取消旧 render、销毁旧 accepted loadingTask。读取/解析失败保留原文档；损坏探测只解析五个坏字节，不替换当前文档。初始文档未加载时文件和探测按钮禁用。卸载增加代次、取消 render，并 destroy accepted/candidate/probe。迟到的解析、页面和文字结果都有代次或 active 检查，不再更新已离开的会话。

`renderTask.cancel()` 不会同步释放 Canvas。`createRenderGate` 必须保留：下一次实际绘制等上次 promise settled，拒绝不会毒化队列；过期排队项进门后直接跳过。文档加载和文字抽取不用占着 Canvas 队列。渲染失败会排队清零画布，避免把上一页冒充失败页；文字在新渲染开始时清空。取消异常不覆盖状态。

## 两种不同的预算

输入只读非空且不超过 **3 MiB（3,145,728 bytes）** 的文件。体积小也可能声明巨大的 MediaBox，不能据此批准画布。

`boundedCanvasSize` 在非零背板分配前检查：viewport/DPR 必须有限且为正，CSS 边长向上取整后 ≤4096，DPR 夹在 1–2，背板每边 ≤4096 且乘积 ≤8,000,000。旧 render 结束后先清零旧画布，再做预算；超限不会保留旧像素或分配巨大背板。内部 viewport 为 `1.15 * scale`，所以 200% 不是 CSS 原始页尺寸的两倍以内安全保证。

## 限制与反例

- 没有配置 CMap、标准字体、WASM、口令、注释/表单层。原创 Helvetica 两页夹具成功不能推出任意中文/复杂 PDF 支持。Node 原始日志里的 `standardFontDataUrl` warning 必须保留。
- 不提供任意远程 URL 输入。跨域、网络范围请求、鉴权和远程文档访问都没有验收。
- 不是任意不可信 PDF 的安全隔离服务；生产接收文件需要独立配额、隔离和更新策略。
- 不在 `cancel()` 后直接 `render` 同一 Canvas；不把清 React state 或 DOM 消失称为 Worker 已终止。
- 不一次将所有页画成大位图。Canvas 尺寸预算不限制解析器所有内存/CPU，也不是 PDF ZIP bomb 防护。

## 分层验证与官方来源

本次本地 Node legacy SDK 2 项：实际解析原创两页并抽取不同文字、坏字节拒绝且已接受文档仍可读取。它使用 `pdfjs-dist/legacy/build/pdf.mjs` 的 Node 路径（同版6.3.289），不是浏览器 Worker/Canvas 验证。纯策略 9 项包括 gate3、budget4、声明/路径2，后者只读仓库元数据，不算 SDK。

原始命令、退出码和输出见 `local-validation.md` 与 `validation/`。浏览器方案 `validation/browser.spec.ts` 由主控接入现有宿主执行：Canvas 非白像素/分页/文字、快速缩放、真实 Worker 请求和逐实例 terminate、候选失败保留文档、巨大 MediaBox 拒绝、held File 读取后非法选择/切场景/卸载忽略迟到结果。此文件本身不是执行记录。没有正式 recorder 收据时 `verification.json` 仍 NOT_RUN。

官方根 README 在固定 `v6.3.289` commit `1c8020a7d4e43668ac287a3ecf9a8dbea17e4c56` 的树中只有英文根 README，无官方中文候选；原字节保存在 `official/readme.md`，哈希/完整 URL/包字段见 `official/source-evidence.json`。LICENSE 同样固定原字节。官网实际 GET HTTP200，响应无 XFO 或 CSP frame-ancestors，但没有真实嵌入结果，状态保持 unknown，保留外部直达。
