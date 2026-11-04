# Uppy Core 6.1.0｜本地队列、限制和预览，不发送文件

Lab 锁定 `@uppy/core@6.1.0`（MIT）。这一页只挂 Core。没有 `@uppy/xhr-upload`、`@uppy/tus`、`@uppy/aws-s3` 或 Dashboard。选择文件成功只表示进入了本机队列。

包已经在锁文件里。没有 `docs/library-lab/evidence/runs/` 收据时，sdk、build、browser 保持 NOT_RUN。Actions 41779873259 覆盖仓库安装、类型检查、生产构建、52 个 SDK 文件共 153 项测试和 45 项 Playwright，不是本条目的 PASS。

## Lab 当前示例

执行种类是 `react`。用户在 Demo 页签显式启动后，主站挂载 [`examples/demo.tsx`](examples/demo.tsx)，它只再导出 [`examples/example.tsx`](examples/example.tsx)。离开页签会卸载，effect 里 `destroy()`。

| 文件 | 作用 |
| --- | --- |
| `examples/example.tsx` | `new Uppy`、限制、`addFiles` / `removeFile` / `clear`、`file-added` 等事件 |
| `examples/preview-policy.mjs` | 只解码不超过 12 000 字节的 UTF-8，显示最多 4 000 字符 |
| `tests/policy.test.mjs` | 纯策略：多语言、超限、控制字符、非法 UTF-8、截断 |

实例 id 是 `reactloom-library-lab-F01-${level}`。`autoProceed: false`。限制是最多 3 个文件、单文件 1 MiB、扩展名 `.txt` / `.csv` / `.md`。外层组件用 `key={level}`，换场景等于换一棵子树，旧队列不能留下来。

下面仍写 XHR、Tus、S3 和 Companion。那些是迁出 Lab 之后的生产教学，**当前页没有挂载**，也不要在这里接上传端点。

## 1. 什么时候用

批量附件、可观察的队列、以后可能换成 Tus 或对象存储，而 UI 还想留在同一套状态上。头像那种一次 `<input type="file">` 用 F02。只解析 CSV 用 F03。只在本地改图片用别的条目。

Uppy 不负责服务端身份、配额、病毒扫描、对象存储签名或入库。前端 `allowedFileTypes` 是体验约束，浏览器报的 MIME 可以伪造。

| 目标 | 组合 | Lab 现状 |
| --- | --- | --- |
| 选择、拖入、拒绝超限 | 只有 Core | 已挂载 |
| 进度和 HTTP POST | Core + XHRUpload | 未挂载 |
| 偏移续传 | Core + Tus，且服务器实现 HEAD/PATCH | 未挂载 |
| 直传对象存储 | AwsS3，服务端短期授权 | 未挂载 |
| 云盘导入 | 来源插件 + Companion | 未挂载 |

开源 Core 是 MIT。Transloadit 托管是另一项选择，不必付费才能用 Core。

## 2. 模型

Core 拥有 `files`、插件和事件。UI 不是 Uppy。示例在 effect 里创建实例，监听 `file-added`、`file-removed`、`restriction-failed`，清理时 `off` 再 `destroy()`。不要在每次渲染时 `new Uppy()`。

数据流停在本机：

```text
input / drop → addFiles({ name, type, data, source })
  → restrictions
  → getFiles()
  → 可选 readTextPreview(file.data)
```

`source` 固定为 `library-lab-local-picker`。没有传输插件，就没有 `upload()`，也没有 `complete`。生产里 `complete` 同时带成功和失败数组，不能把它当成「全部已入库」。

`cancelAll()` 清空待传队列，不是暂停。普通 XHR 没有字节级续传。`destroy()` 会取消该实例上的上传；本页没有上传，它的意义是放开 File 引用。

预览另有一代计数。换文件、删除、清空、卸载都会加 generation。慢的 `arrayBuffer()` 回来时对不上，就丢掉结果。

## 3. 三层

### 基本

选择或拖入 `.txt` / `.csv` / `.md`。类型、1 MiB 和「最多 3 份」由 Uppy 的 restrictions 执行。列表来自 `getFiles()` 和事件。状态文案写明没有安装上传插件。队列空时有空状态。

### 业务

标题是「新闻素材本地预览与队列管理」。非 basic 才出现「本地查看文本」。`readTextPreview` 拒绝大于 12 000 字节的 Blob，用 fatal UTF-8，拒绝 `\u0000`–`\u0008`、`\u000b`、`\u000e`–`\u001f`、`\u007f`，再切到 4 000 字符。这不是编码探测，也不是杀毒。

### 进阶

按钮构造 `1024 * 1024 + 1` 字节的 `too-large.txt`，交给真实 `addFiles`，由 `restriction-failed` 写拒绝原因。清空只 `clear()` 当前实例，不碰 `localStorage`。文案明确：进度、续传、重试要另接 XHR、Tus 或 S3，Core 的限制不能当文件安全。

## 4. 反例

### 反例 1：渲染里创建实例

```tsx
function UploadPage() {
  const uppy = new Uppy()
  return <Dashboard uppy={uppy} />
}
```

每次 state 更新都丢掉队列并再挂一套监听。用 effect 或 `useState(() => new Uppy({ id }))`，并在清理时 `destroy()`。本页用 effect，因为 Strict Mode 会多跑一次 setup，不能复用已经 destroy 的实例。

### 反例 2：扩展名当成内容审核

```ts
if (file.name.endsWith('.png')) save(file)
```

`.png` 和 `file.type` 都可以改。服务端要看大小、魔数、解码、配额和权限。Lab 的 `allowedFileTypes: ['.txt', '.csv', '.md']` 只决定队列收不收。

### 反例 3：把密钥放进前端

```ts
uppy.use(AwsS3, { accessKeyId: import.meta.env.VITE_AWS_KEY })
```

不要把长期密钥放进包或环境变量。签名留在服务端，用短期、最小权限。本页没有 S3 插件，也不要为了演示去配。

### 反例 4：`complete` 就跳成功页

```ts
uppy.on('complete', () => navigate('/success'))
```

`result.failed` 可能非空。部分成功要留重试，不要把已经成功的文件再传一遍。Lab 没有这个事件。

### 反例 5：普通 XHR 叫续传

断线后重试 POST 是整段重传。字节偏移要 Tus 客户端加上实现了该协议的服务器。示例服务器如果只收 POST，就不能叫续传。本页连 POST 都没有。

### 反例 6：服务端模块级单例

```ts
export const uppy = new Uppy({ meta: { userId } })
```

多租户会串文件。Uppy 放在浏览器里、按页面或会话创建。本 Demo 是纯浏览器。

### 反例 7：再抄一份进度

每个 `progress` 再写进另一套 store，两处会分叉。队列留在 Uppy。业务库只保存服务端返回的资产 id。本页连进度事件都没有，不要画假百分比。

### 反例 8：无界 `blob.text()`

Core 允许 1 MiB，预览只接受 12 KB。直接 `await file.data.text()` 会把大文本拉进主线程，也会在删除之后回写。走 `readTextPreview`，并用 generation 丢掉过期结果。

## 5. 组合

**React Hook Form**：表单管标题和分类。Uppy 管临时队列。只有服务端确认资产之后，表单里才放 `assetId`。重置表单不要顺手 `destroy` 一个还在传的实例。Lab 没有这条接线。

**TanStack Query**：上传成功后 invalidate 资产查询。不要用 `getFiles()` 推断转码是否完成。

**Papa Parse / PDF.js**：解析和预览是下一层。Uppy 不解析 CSV，也不画 PDF。

**react-dropzone（F02）**：只需要拖放时用它。需要队列、限制事件和以后的协议插件时再上 Core。

## 6. 清单

- 实例 id 稳定，卸载时 `off` + `destroy()`。
- `autoProceed` 在你接上传输插件之前保持 false。
- 预览走 12 KB / 4 000 字符，并核对 generation。
- 超限文件能再选合法文件；拒绝文案在 `role="status"` 里。
- 不把文件名当存储路径。中文文件名只用于显示。
- 生产另做：身份、魔数、配额、幂等、失败重试。不要在 Lab 里上传用户文件。
- 自定义进度用 `<progress>` 和可访问名称。Dashboard 未挂载，不能声称它的键盘行为已验收。

## 7. 升级

从 5.x 到 6.x 时核对 `@uppy/react`：旧的 `DragDrop`、`ProgressBar` 包装可能已不在。S3 签名改看当前文档的 `getCredentials` / `signRequest` / `companionEndpoint`，不要抄过期片段。

本条目只依赖 Core 6.1.0。升 Dashboard 或 Tus 时主版本要一起看，不要只升 Core。React 19 是 Lab 的运行时；接 `@uppy/react` 之前核对它的 peer。

Companion 的 `allowLocalUrls` 在生产有 SSRF 风险。Lab 不启用 Companion。

## 8. 验收

策略命令：

```bash
node --test packages/library-lab/entries/F01-uppy/tests/policy.test.mjs
```

它证明预览边界，不 import Uppy，不是 SDK PASS。

还缺的浏览器观察：拖入合法文件、第 4 个被拒绝、1 MiB+1 被拒绝、删除后预览不回写、换 level 后队列为空、卸载后不再收到事件。这些要有收据才能改 verification。网络上传在本条目是未设计，不要记成失败或成功。

## 9. 故障对照

| 现象 | 在本页的含义 |
| --- | --- |
| 拖进去没有反应 | 先看是否已点启动；根节点只是原生 drag 事件，不是 Dashboard |
| 状态写「Uppy 拒绝文件」 | restrictions 已执行。第 4 个或大于 1 MiB 属于这一种 |
| 预览仍是上一份 | generation 对不上就该丢弃。若仍显示，就是清理被删了 |
| 换场景后文件还在 | `key={level}` 被去掉了。effect 的 destroy 只清理当前树 |
| 看不到百分比 | 本页没有传输插件。不要补一个定时器 |
| 想证明续传 | 需要未挂载的 Tus 和真实服务器的 offset。Lab 不提供 |

生产里的 413 先对代理限额和 `maxFileSize`。401 先对会话，而不是对 Core。这些状态码在本页不会出现。

## 10. 资料

- https://uppy.io/docs/uppy/
- https://uppy.io/docs/react/
- https://uppy.io/docs/guides/choosing-uploader/
- https://uppy.io/docs/dashboard/
- https://uppy.io/docs/xhr-upload/
- https://uppy.io/docs/tus/
- https://uppy.io/docs/aws-s3/
- https://uppy.io/docs/companion/
- https://uppy.io/docs/golden-retriever/
- https://github.com/transloadit/uppy
