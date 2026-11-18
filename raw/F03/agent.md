# F03 Papa Parse：迁入与验收入口

使用CSV带引号/换行导入导出时选papaparse5.7.0/MIT；不是XLS/XLSX/宏/远程抓取。先读guide、verification及实际全部sourceFiles。完整迁入五份example.tsx、report.mjs/.d.mts、policy.mjs/.d.mts，pnpm add papaparse@5.7.0，ReactDOM/TSX ESM Bundler/DOM/Blob/TextDecoder目标，挂载default组件level="business"；无需Provider/CSS/env/server，demo可省。

真实reportCSV共源：header:true、greedy空行、dynamicTyping:false；严格title,url,note与renamedHeaders非空全拒；字段数不符仅拒该记录，未闭引号等其它错误全拒。业务trim/字段长度/无凭据HTTPS/去fragment规范化去重。不联网，URL验证不是SSRF或ACL。

输入预算：textarea手工15,000 UTF16码元；文件≤256,000原始字节先检查再arrayBuffer+fatalUTF8，report任何来源≤256,000 UTF8bytes。文件程序设值可超textarea手工maxLength，单位不可混淆。keyed level确保新fixture；编辑/parse/reset/选择/卸载失效generation，旧成功/错误均不回写，未物理abort读取。

导出仅accepted，真实unparse escapeFormulae用前缀正则/^[=+\-@\t\r]/，覆盖含内嵌换行公式单元格；5.7默认true的.*$可能漏跨行，不能改回而删回归。CSV不是Excel宏安全证明；页面pre纯文本，不HTML执行/URL抓取/文件下载。

本地真实SDK与纯policy分日志，不能合并称SDK；真实 input、错误、公式前缀、场景切换和迟到读取见本地 Chromium 证据。formal三NOT_RUN，详情local-validation。固定官方原文/hash/license/header在official，官网未宿主嵌入验证unknown。
