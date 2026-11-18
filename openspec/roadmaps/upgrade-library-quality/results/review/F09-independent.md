# F09 独立迁入复核

从 `node packages/library-lab/scripts/find-library.mjs --id F09 --json`（exit 0）定位条目。用 `agent.md` 的 Node 路径选取 `document.ts`、`document-policy.mjs` 和对应声明，固定 `pdf-lib@1.17.1`。已有六文件严格编译证据仍适用，Node consumer 不需要 React、Worker 或下载面板。

在仓库根以 Node ESM 直接导入声明的 `document.ts`，使用 Lab 安装的 `PDFDocument` 构造新输入。`createNote('  Orion independent W-714  ')` 由真实 SDK 保存并回读 `ReactLoom Orion independent W-714`。新两页输入第一页是 200×200pt、`CropBox(19,33,64,53)`，第二页 96×70pt。`stampOwnPdf` 输出 1079 字节，SDK 回读 2 页，保留两个页面的所查几何。`pdftotext -cropbox /tmp/reactloom-f09-independent.pdf -` 输出 `Reviewed locally`，第二页保持空白。运行 exit 0。新 consumer 测了标签规范化、偏移小框内标注和未改动第二页，作者 3 项 SDK 与 8 项策略证据另计。

guide/agent 能独立判断创建、复制页或局部内容流标注的用途，写明字体/文件/页数边界和解析失败及清理。固定官方来源的 README/LICENSE 摘要与保留原字节记录一致，官网采集证据支持 unknown。非作者实际在生产预览取得 1/2/1 页三个下载，四页 Poppler 渲染无裁切，合并顺序、盖章位置与指南相符。实际 URL 替换、拒绝和晚读取观察见 candidate-36；正式收据 NOT_RUN。
