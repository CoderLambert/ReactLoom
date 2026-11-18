# F09 pdf-lib工程入口

1.17.1/MIT，创建/复制页/本地内容流文字盖章；非阅读器/React排版/交互批注/安全redaction。读guide/verification与实际sourceFiles后迁入。

六必需原件example.tsx/document.ts/document-policy.mjs/.d.mts/operation-gate.mjs/.d.mts；ReactDOM/TSX ESM/Bundler/DOM，pnpm add pdf-lib@1.17.1，无Provider/CSS/env/Worker/字体服务。demo可省。Node只需document及policy pair并编译TS，不用URL包装。

basic createNote一页；business load/copyPages两份原创文档2页；advanced stampOwnPdf只盖第一页Reviewed locally。输入10bytes–2MiB/%PDF-/ignoreEncryption:false/1–20pages/MediaBox36–2000pt；输出≤4MiB。盖章在首CropBox∩MediaBox≥36pt内自适应坐标和字号，小页可变小，不承诺避让原内容。createNote label先trim ASCII1–60，标题按505pt宽缩字号，标准Helvetica不承诺中文。

gate.begin同步单飞，isCurrent后才创建URL/写状态，finish只结束自己的id；keyed level重建，卸载invalidate但不abort SDK解析。ownedUrls登记；下载effect旧链接移除后revoke，卸载兜底清集合。失败清页数/链接并回收旧URL；不清全局资源。

policy不能计SDK，真实同源Node3项与policy5/gate3分记。browser实际下载/视觉/URL与held文件读取另验；formalNOT_RUN。任意外部PDF解析无ZIP/CPU/附件/脚本沙箱，不保证表单/签名/书签；ignoreEncryption不得改true。不上传、不执行CSV/HTML或用户脚本。官方固定原文/hash/license/header与本地日志见official/与条目根local-validation.md。
