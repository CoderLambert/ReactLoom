# pdf-lib 1.17.1｜本地创建、合并和盖一句字

Lab 锁定 `pdf-lib@1.17.1`（MIT）。它改 PDF 字节：建文档、复制页、嵌入标准字体、`save`。它不把页面画到 Canvas 上。阅读用 F06 / F07，从 React 树排版用 F08。

用户显式启动后挂载 [`examples/demo.tsx`](examples/demo.tsx) → [`examples/example.tsx`](examples/example.tsx)。字节操作在 [`examples/document.ts`](examples/document.ts)。

没有 `docs/library-lab/evidence/runs/` 收据时 sdk、build、browser 保持 NOT_RUN。Actions 41779873259 是仓库级安装、类型检查、构建、52 个 SDK 文件 / 153 项测试和 45 项 Playwright，不是本条目 PASS。

## Lab 当前示例

| 文件 | 作用 |
| --- | --- |
| `examples/document.ts` | `PDFDocument.create` / `load` / `copyPages` / `save` |
| `examples/document-policy.mjs` | 页数、边长、输出大小 |
| `examples/operation-gate.mjs` | 同步单飞；React 的 disabled 来不及挡第二次点击 |
| `examples/document-policy.test.mjs` | 纯边界 |
| `examples/operation-gate.test.mjs` | 纯单飞 |

输入最大 2 MiB，输出最大 4 MiB，页数 1–20，边长 36–2000 pt。字体是 Helvetica。英文夹具，无第三方字体。

advanced 可以选择本地 PDF。文件留在浏览器里，不上传。文件头 `%PDF-` 不能代替沙箱。加密文档 `ignoreEncryption: false`，解不开就失败。

## 1. 什么时候用

要新建一页、把两份自己生成的 PDF 接在一起，或在第一页底部写「Reviewed locally」。版式复杂的报表用 F08。只展示用 F07。

不要用它渲染预览，也不要承诺表单填写、签名、附件剥离已经在这页验证过。那些 API 存在于库里，本示例没有调用。

## 2. 模型

`createOperationGate`：`begin` 在已有活动 id 时返回 null；`isCurrent` 核对 id；`finish` 只清掉自己的 id；`invalidate` 增加序号并清空。换 level 和卸载都会 invalidate。因此换场景时进行中的保存不能再 `setState`。

```text
begin
  → createNote / combineNotes / stampOwnPdf
  → PDFDocument.load 自己的输出
  → 仍是当前 id 才 createObjectURL
  → finish 才放开 busy
```

URL 记在 `ownedUrls`。`download` 变化时回收上一个。卸载时全部 revoke。

`createNote` 建 A4（595×842），标题截到 60 字符，保存后走 `validateOutputPdf`。

`combineNotes` 做两份笔记，`copyPages` 全部页，必须正好 2 页，再 `validatePdfLayout`。

`stampOwnPdf` 要求 10 字节到 2 MiB，头五个字符是 `%PDF-`，然后 `load`。第一页必须存在。在 y=50 画一行字。布局和输出再校验一次。

页面在成功后再次 `PDFDocument.load`，把 `getPageCount()` 显示出来。这是读回，不是视觉回归。

## 3. 三层

### 基本

按钮执行 `createNote('Getting started')`。状态写出字节数和页数。链接下载 `reactloom-pdf-lib.pdf`。

### 业务

`combineNotes` 合并 “Weekly summary” 和 “Technical review”。页数必须是 2。没有网络。

### 进阶

无文件时盖在一份新笔记上。有文件时先看 2 MiB，再 `stampOwnPdf`。超过大小、头不对、页尺寸出界、没有页，都会进失败文案，并清空下载链接。处理中按钮和文件框都禁用，但真正的互斥是 gate，不是 disabled。

## 4. 反例

### 反例 1：连点靠 setState

```tsx
async function run() {
  setBusy(true)
  await createNote('x')
}
```

第二次点击可以在重绘前进入。`begin()` 返回 null 就退出。

### 反例 2：忽略加密

```ts
await PDFDocument.load(bytes, { ignoreEncryption: true })
```

本页明确 false。打不开就失败，不要跳过加密去改内容。

### 反例 3：不校验页数和边长

恶意或损坏文件可以声明很多页或极大页面。`validatePdfLayout` 在盖章前执行。输出再卡 4 MiB。这仍不是完整的 PDF 沙箱。

### 反例 4：泄漏 blob URL

每次成功都 `createObjectURL`。不 revoke 会留下整份文档。本页在替换、依赖变化和卸载时回收。

### 反例 5：把盖章当成阅读器

`drawText` 改的是字节。屏幕上没有 Canvas。要看版式，把字节交给 F07，并遵守那边的 3 MiB 和 Worker 规则。本页没有嵌阅读器。

### 反例 6：上传用户 PDF

```ts
await fetch('/api/pdf', { body: file })
```

不要把选择的文件发到服务端教学接口，也不要提交进仓库。夹具全部在浏览器里生成。

### 反例 7：非拉丁文字用 Helvetica

中文会缺字。本页标题是英文并截断。要其它字形就嵌入有许可的字体，本示例没有。

## 5. 组合

**F07 / F06**：保存后的 `Uint8Array` 可以复制给阅读器。不要共享同一块可能被 transfer 的 buffer。

**F08**：新报告的复杂排版用 renderer。pdf-lib 负责已有文件的页复制和短标注。

**表单与签名**：库支持更多操作。没有在 `document.ts` 里出现的 API，不要写成这三条 Demo 已覆盖。

## 6. 清单

- 单飞 gate 包住整段 async。
- 换 level 先 invalidate，进行中的结果丢弃。
- 输入 2 MiB、输出 4 MiB、1–20 页、边长 36–2000。
- 头五个字节是 `%PDF-`，加密不忽略。
- 合并结果必须 2 页。
- 每个 object URL 都有主人，卸载清空集合。
- 不上传、不写服务器、不把用户文件当夹具提交。

## 7. 升级

1.17.1 的 `PDFDocument.create`、`load`、`copyPages`、`embedFont(StandardFonts.Helvetica)`、`save` 是合同。升级 minor 时重做三层：单页、两页合并、坏头拒绝。不要打开 `ignoreEncryption`。

页尺寸单位是 point。不要把 CSS 像素直接传给 `addPage` 而不换算。

## 8. 验收

```bash
node --test packages/library-lab/entries/F09-pdf-lib/examples/document-policy.test.mjs
node --test packages/library-lab/entries/F09-pdf-lib/examples/operation-gate.test.mjs
```

两者都不加载 pdf-lib。SDK 要真正 `save` 出以 `%PDF-` 开头的字节，business 读回 2 页，advanced 拒绝坏头，连点只有一个 URL。浏览器下载打开后才能谈版式。没有收据就保持 NOT_RUN。

## 9. 故障对照

| 现象 | 先看 |
| --- | --- |
| 连点出两份下载 | `begin()` 没在 setState 之前返回 null |
| 换场景后仍显示上一份页数 | level effect 没有 invalidate，或迟到的 then 没看 `isCurrent` |
| 加密文件被改写 | `ignoreEncryption` 被改成 true |
| 极大页面把内存打满 | `validatePdfLayout` 没在 `drawText` 之前执行 |
| 下载链接越积越多 | `ownedUrls` 没有在卸载时 revoke |
| 中文标题缺字 | 只用了 Helvetica。标题还被截到 60 字符 |
| 合并不是 2 页 | `copyPages` 的下标或 `getPageCount` 断言被删了 |

文件头五个字节只说明像 PDF。压缩炸弹、大量间接对象和脚本动作不在这道检查里。产品若接收用户文件，要有单独的隔离和解密策略。Lab 不接收上传。

页尺寸是 point。A4 在代码里是 `[595, 842]`。不要把 CSS 像素原样传给 `addPage`。边长允许 36 到 2000，超出在盖章前失败。

## 10. 资料

- https://pdf-lib.js.org/
- https://github.com/Hopding/pdf-lib
