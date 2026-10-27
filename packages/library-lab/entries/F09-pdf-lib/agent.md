# F09 pdf-lib — Agent 可迁移说明

## 选型判定
要**修改、合并或添加已有PDF内容**时选 `pdf-lib`；纯可视化阅读选F06 PDF.js或F07 react-pdf；React声明式排版生成新PDF选F08。基线 `pdf-lib@1.17.1` / MIT。

## 拿走哪些源码
`examples/document.ts` 提供不依赖React的 `createNote`、`combineNotes`、`stampOwnPdf`；目标项目复制业务相关部分，改写固定字符串。仅在UI需要触发下载时参考 `examples/example.tsx`。不要复制Lab路由、Tabs和DemoHost。

## 保留的生产约束
文件大小限制、PDF签名预筛、PDFDocument.load错误处理、epoch防旧回写、所有objectURL撤销；不把PDF解析视为安全文件审核；禁止未经许可加入外部字体、敏感源PDF。标准字体不支持中文，需 `@pdf-lib/fontkit` +合法字体；不要默默改成损坏字符。

## 必要验证
实际导入pdf-lib，创建→load页数与标题校验；合并页序；原始输入不可变；坏PDF/加密/超限显示失败；切换路由不泄漏下载URL。未进行真实SDK/Chromium验证时不得将结构检查记PASS。

官方：<https://github.com/Hopding/pdf-lib>

## 任务所有权与Blob URL（第12轮）

复用`example.tsx`必须同时带上`operation-gate.mjs`及声明：同步begin挡连点、invalidate挡级别/文件切换后的旧回写、finally只有当前token可复位busy。不要在`setDownload(next)`之前撤销仍在DOM上的旧href；Effect cleanup释放已提交的旧下载链接，unmount清理所有曾创建URL。实际解析大对象不可中止，应另加内存/进程隔离。
