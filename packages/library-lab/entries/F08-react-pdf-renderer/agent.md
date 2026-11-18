# F08 @react-pdf/renderer：工程迁入

需求：React原语生成新PDF；浏览已有PDF用F07，改已有字节用F09。固定renderer4.9.0/MIT，只原创ASCII+Helvetica，不远程字体/图片/上传。先读guide/verification/全部实际源码。

完整迁入四份example.tsx、report.tsx、report-policy.mjs/.d.mts。ReactDOM/TSX ESM Bundler/DOM目标pnpm add @react-pdf/renderer@4.9.0，挂default组件level="advanced"，无需Provider/CSS/env/服务。demo可省。不要把Lab入口写进模板。

真实pdf(element).toBlob仅用户点击，非renderToBuffer/DOM截图。validatedRows先于SDK：1–140，ASCII ID长度48且大小写不敏感去重/name1–70printableASCII/articles0–1000000整数，拣掉额外字段。title固定可信ASCII；用户title需自加策略。可打印<>只是Text字面值，不当HTML sanitizer。

A4 Page wrap、行wrap=false、fixed动态页脚、flex列；不保证任意长内容无溢出。basic1行/business3行/advanced100行+141行拒绝。真实PDF要下载并pdftoppm视觉检查，不靠Promise成功/行数/MIME/100bytes宣称分页已验。

保留running ref await前单飞、epoch成功/错误检查；过期Blob不createURL，无AbortSignal不物理取消。替换新URL后撤旧，失败清旧URL/链接/bytes，卸载revoke自己的URL，keyed level重建。无renderer destroy API宣称，不清全局字体缓存。141测试同路径先拒绝，不计SDK异常。

Node默认包main与浏览器browser映射不同，实际Node同源report compile+toBlob2项与纯policy6分计，不能替代真实浏览器。browser提案含保存实际PDF和外层原生Blob/URL探针，未执行不填formalPASS。fixed README/license/header见official，主页unknown无宿主嵌入确认；详细原始证据local-validation。
