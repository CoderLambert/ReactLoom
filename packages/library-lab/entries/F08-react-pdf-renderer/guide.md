# @react-pdf/renderer 4.9.0：生成原生PDF与管理下载链接

用React组件声明报告并生成新的PDF，选择@react-pdf/renderer。浏览已有PDF看F07 react-pdf，两者不是同一个包；编辑/合并已有字节看F09 pdf-lib。本例用Document/Page/View/Text和PDF布局StyleSheet，不使用HTML div或浏览器CSS，不截图DOM。

实装4.9.0/MIT，固定官方包README与LICENSE见official。所有fixture原创ASCII，使用标准Helvetica，不注册远程字体/图片，无账号/env/上传/网络请求。Helvetica不覆盖中文，不能把非ASCII直接放进来并宣称字形完整；生产中文字体必须另核实许可、注册和真实渲染。

## 数据流与三个目标

用户点击→validatedRows→pdf(<ReportDocument/>).toBlob()→检查Blob MIME/最小大小→创建objectURL→用户显式下载。没有自动挂载生成、内嵌PDF阅读器或服务器renderToBuffer。本例100字节/MIME检查只防空结果，不是完整PDF有效性验证。

basic为一条来源的单页报告；business为三条摘要，观察React原语列布局、标题与页脚；advanced为100行跨页文档，并提供“测试141行输入拒绝”验证预算与失败回退。分页真实页数和裁切需将实际生成PDF交pdftoppm/阅读器检查，不能从行数或生成Promise成功推断。business不是另一套分页引擎，仅展示多来源摘要。

ReportDocument的A4 Page wrap允许自动分页，每条行View wrap=false避免拆开，footer fixed使用pageNumber/totalPages真实布局回调。name列flexBasis0/shrink与数值固定70pt列分配宽度。wrap=false和固定页脚**不自动担保任意内容不溢出**，长不可断词、字体、padding和每行高度都可能影响版式。当前固定标题与受限ASCII数据需要实际渲染确认；不承诺任意标题/未来扩展数据版式。

## 输入合同

validatedRows是UI与Node共源纯策略：1–140行；id为1–48位ASCII字母数字/下划线/连字符且首位字母数字，大小写不敏感去重；name为1–70可打印ASCII字符；articles为0–1,000,000安全整数。额外字段被拣除，不传到PDF。可打印ASCII包含<和>，它们作为PDF Text字面值不是HTML；这不是HTML sanitizer。空白名称未trim，策略不承诺非空白业务语义。

ReportDocument是低层布局组件，仅接受已验证rows和可信固定ASCII title；若迁出后允许用户编辑标题，需自行补标题的ASCII/长度/换行预算。140行是示例预算，不是SDK的最大页数或性能上限；没有Worker/流式或海量文件能力证明。

## 单飞与资源所有权

running ref在await之前置true，阻止React disabled尚未flush时重入；disabled提供UI反馈。epoch在每次生成和卸载时递增，迟到toBlob成功先比epoch，过期Blob不创建URL；迟到错误也不写状态。toBlob没有本例可用的AbortSignal，这不是停止布局/序列化任务。

成功先创建新URL再撤销旧URL，失败撤销旧URL并清链接/大小。release清ref后撤销，防重复清理旧URL。卸载撤销当前自有URL，切level用key重建会话并撤旧下载链接。只有自己创建的URL归本组件回收，不清全局Blob/字体缓存。不把URL撤销或DOM消失称为renderer destroy；没有提供这样的实例API。

advanced的141行测试通过同一generate路径在pdf调用前拒绝，清掉上一成功链接；不是renderer生成失败的SDK证明。URL.createObjectURL异常路径由浏览器方案另受控触发；实际生成的Blob仍来自renderer。预览/下载文件已由用户下载后不再受URL生命周期影响。

## 完整迁入

```bash
pnpm add @react-pdf/renderer@4.9.0
```

已有React/ReactDOM/TypeScript浏览器ESM项目复制四份：example.tsx、report.tsx、report-policy.mjs、report-policy.d.mts，保持相对路径。TS strict、jsx react-jsx、Bundler解析，DOM Blob/URL API可用。默认导出挂载`<PdfRendererExample level="advanced" />`。demo.tsx只Lab转发可省，无Provider/CSS/env/字体图片/服务。

浏览器打包器须使用包browser映射；Node默认解析lib/react-pdf.js，browser对应lib/react-pdf.browser.js。两端都支持pdf().toBlob，但Node生成不证明浏览器打包/DOM下载成功。Node SDK测试定向编译实际report.tsx后调用同一布局，不另手写一个简化Document冒充同源。

## 操作与证据

点击创建后状态显示真实行数和字节，下载链接仅成功后出现；再创建替换旧链接。advanced生成100行后点击141行测试，看到Row count失败且下载消失；切换basic后不残留旧链接。Blob大小和文件头只能确认产物基本形态，实际字体/分页/页脚/裁切必须渲染文件检查。

tests/sdk.test.mjs真实Node renderer2项（1/100行）独立于tests/policy.test.mjs纯策略6项。validation/browser.spec.ts两提案保存实际PDF给主控pdftoppm，并用真实Blob/URL外层探针检查替换、失败、卸载后晚完成。注入URL创建异常只是错误分支，不能叫真实平台故障；不伪造PDF字节或API成功。作者未跑共享browser或生产build，formal verification仍NOT_RUN，命令/log见local-validation.md。

官方README取固定renderer4.9.0 tag对应commit包目录原文字节，无中文候选采用en。官网实际响应见source-evidence；无Lab-origin嵌入确认保持unknown，不以200/CORS等同可嵌入。
