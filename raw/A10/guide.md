# tldraw：编辑画布，再保存和恢复文档

一张 RSS 处理白板需要同时保留形状的身份、文字和位置。截图只能保留外观，直接序列化 Editor 则会混入运行时对象。这里用 `tldraw@5.5.2` 的真实工具栏与 Editor 创建形状，再用 SDK 文档快照完成“保存 → 修改 → 恢复”。四个流程节点是可编辑的白板内容，没有接入 RSS 抓取、模型服务或流程执行引擎。

本条目保留历史研究来源，当前实现为重新适配的 Library Lab 示例（`contentState: recreated`），不继承历史验收状态。自由画布适合注释、草图和业务形状；需要端口约束的流程编排可对照 A06 React Flow。

## 先运行三个独立实验

### 1. 从指针输入到真实形状

打开“画布嵌入与绘制工具”。初始当前页形状为 0。选择 SDK 工具栏的画笔，在画布中按住、移动、松开；数量增加，展开“查看当前页与保存时的形状身份”能看到 `shape:` ID。选择工具可移动形状，清空按钮只删除当前页内容。

画布是 `<Tldraw autoFocus={false}>`，不是图片或自绘占位。官方 CSS 和有明确高度的父容器共同决定可用区域。没有 `persistenceKey`，刷新、重置示例或停止后重进会回到新实例。`autoFocus={false}` 防止挂载时自动抢焦点，不等于关闭 SDK 的键盘工具。

### 2. 保存的是独立 document 副本

打开“RSS流程节点：保存、修改与恢复”。初始 4 个原生 `geo` 矩形，文字依次为 RSS 获取、正文清洗、分类摘要、人工审核。

1. 点“保存文档到内存”：显示保存时的数量、UTF-8 字节数和形状 ID。
2. 点“追加4个流程节点”：当前页变为 8，保存时仍为 4。也可拖动旧节点、修改文字或清空当前形状。
3. 点“恢复已保存文档”：保存后的新增节点消失，旧节点的 ID、文字、位置来自保存时的文档；清空后也能恢复。恢复不会生成另一组随机 ID。
4. 点“下载文档 JSON”：下载的是**此刻的当前文档**，并非专门下载那份内存副本。文件包裹 `{ kind, version, source, document }`，没有保存时的 session。

```ts
const document = getSnapshot(editor.store).document
serializeSnapshot(document) // 先检查 JSON 与 3 MB UTF-8 上限
const saved = structuredClone(document)
// 用户继续编辑……
loadSnapshot(editor.store, { document: structuredClone(saved) })
```

保存失败保留上次副本；恢复失败保留副本并显示错误。本例只恢复当前组件自己捕获的同版本对象，没有外部 JSON 上传路径。迁移成外部导入时需要另做来源、资源 URL、大小和 schema 校验及失败恢复，不能把本例按钮当通用导入器。

### 3. 只读约束与实例结束

打开“只读、有限批量与实例清理”。初始 4 个节点；“有界批量创建形状”每次最多增加 36 个，当前页不足容量时只补到 80。这个**应用按钮上限**不限制 SDK 原生手绘，也不是性能基准。

先保存，再点“切换只读”。创建、批量、清空和恢复按钮禁用；保存、下载和缩放仍可用。SDK 的 `updateInstanceState({ isReadonly: true })` 同时限制画布编辑，退出只读后恢复。只读是客户端实例状态；接入远端写接口仍要由服务端核验权限。

点宿主“停止并卸载”或离开 Demo 页签，再运行：内存副本消失，实例重建，业务骨架重新为 4。应用退订自己的 Store listener、清除自己的下载计时器并撤销 Blob URL；Editor、画布和 SDK 内部监听由 Tldraw 生命周期释放，不遍历清理全站存储或他人的监听。

## 数据和职责怎样分开

| 对象 | 作用 | 本例行为 |
| --- | --- | --- |
| `Editor` | 创建、删除、缩放和实例命令 | `onMount` 注入；过期引用禁止再调用 |
| `Store` document | 页面、形状、绑定、资源记录等文档内容 | 完整保存和恢复，包含所有页面 |
| session | 当前页、相机、选择等会话状态 | 不存入内存文档或下载文件 |
| React 状态 | 当前页 ID 派生值、按钮状态和保存副本 | 不镜像每个形状的位置或完整运行时 |
| SDK / 应用许可门 | SDK 校验 key；应用避免未配置的远端挂载 | 两层职责不能互相替代 |

`getSnapshot` 返回 `{ document, session }`。仅传 document 给 `loadSnapshot` 时，5.5.2 会单独协调当前 session；没有加载保存时的相机或选择，也不保证恢复后仍能选择已经不存在的记录。文档恢复不是“撤销上一步”。`editor.run` 批处理创建命令，本例没有显式划分历史停止点，不承诺每次按钮恰好一个独立撤销步。

Store listener 使用 `scope: 'all'`，因为 SDK 页签切换属于会话变化，也需要刷新“当前页”的观察。回调只比较排序后的形状 ID，身份集合不变的拖动、文字和相机操作不会触发宿主 React 更新；观察输出没有复制完整形状数组。画布中的实际内容仍由 SDK Store 渲染。

文档包含资源记录及其 URL，原生工具也可能加入图片。JSON **不是保证离线可用的媒体包**，远端资源、字体、内联资源的体积及访问权限需要单独处理。3 MB 检查只控制本例序列化输出，不限制绘制成本、图片解码内存或服务端存储。

## 迁移必要文件

复制 `examples/example.tsx`、`snapshot-policy.ts`、`styles.css`，按宿主需要接入 `demo.tsx` 导出。安装匹配的 `tldraw@5.5.2` 和 React；保留 `tldraw/tldraw.css` 导入。这里使用 `createShapeId`、`toRichText` 和原生 `geo` 形状，不使用旧的 `@tldraw/tldraw` 默认入口或已过时的 `props.text` 写法。

业务初始化放在 `onMount`，批量形状调用放进 `editor.run`；组件内的 WeakSet 防止同一个 Editor 回调重复时再种一遍骨架。按文档重建实例时，存储和文档 ID 策略由产品定义。Lab 没有 IndexedDB、协作同步或服务端保存；内存副本不跨刷新，也不是 CRDT。

`onMount` 返回函数只释放本例 listener 和实例引用。按钮检查当前 active Editor，避免 SDK 因许可或宿主卸载后继续操作旧实例。下载先通过 `serializeSnapshot`，再创建 Object URL；约 1.5 秒后撤销，提前卸载则取消剩余定时器并立即撤销。

| 容易出错的做法 | 本例对应做法 |
| --- | --- |
| render 阶段调用 `createShape` | 只在挂载和事件中写入 |
| `JSON.stringify(editor)` | `getSnapshot(store).document` |
| 保存当前对象引用后继续编辑 | `structuredClone` 独立保存与恢复输入 |
| 把前端只读当服务器授权 | SDK 实例约束与服务器鉴权分别实施 |
| 共用持久化 key 或清全站存储 | Lab 不设 key，仅释放当前实例自有资源 |

## 许可前提必须先成立

5.5.2 使用自定义 tldraw License，不是 MIT。固定版本许可证默认覆盖内部开发、测试、预发等 Development Environment，排除供终端用户正常使用的生产部署；正式用途需要满足适用的试用、商业或其他官方许可条件。[固定版本原文](https://github.com/tldraw/tldraw/blob/be4d5b30cbf896c92436d634e59843a920705cef/LICENSE.md)、[官方许可说明](https://tldraw.dev/community/license)、[License Key](https://tldraw.dev/sdk-features/license-key)。

本机 `localhost`、`127.0.0.1`、IPv6 回环可进入正常开发预览；这只是应用准入条件，不证明生产获准。其它主机没有配置 key 时只显示提示。`VITE_TLDRAW_LICENSE_KEY` 是可选的宿主配置输入，原样传给 SDK；“存在字符串”不等于 key 有效。这里没有读取或借用用户凭据、填假 key、改运行环境、移除水印或修改 SDK 许可判定。

真实浏览器必须观察 SDK 是否持续可用；如果 SDK 显示许可错误或关闭画布，应记录具体错误与合法解除条件，不能忽略错误宣布通过。生产 key、分发范围与授权审批由部署方处理。

## 官方材料与验收边界

官方 README 保存为 `official/readme.md` 原始字节，来自 `tldraw/tldraw` 的 `v5.5.2` 对应提交 `be4d5b30cbf896c92436d634e59843a920705cef`、`packages/tldraw/README.md`，英文、3729 字节，SHA-256 为 `6689bd272a4c368415b8ba88fcbf47b5dfab09f9e88f5a3fed98bacb32478c84`。固定完整树共列出 271 个 README 候选，没有上游中文 README；选择目标包而非贡献者仓库首页。同步时间与版本记录在 `official/source-audit.json` 和 `library.json`；许可证另存原文供核对。

官网完整 GET 响应头在 `official/homepage-response.json`：200，XFO/CSP 字段均为 null；尚无从 Lab origin 的真实 iframe 验证，因此预览状态为 unknown，保留[官网直达](https://tldraw.dev)。没有限制头也不能据此推定 allowed。

本地两项真实 SDK 检查覆盖 Store 文档恢复与 document/session 分离；三项纯策略覆盖序列化失败及 UTF-8 上限，均不证明工具栏、焦点、许可或卸载。实际 Chromium 覆盖见 `local-validation.md`；中文输入法、屏幕阅读器和生产授权未测。正式 `verification.json` 不借用历史仓库级收据，仍为 NOT_RUN。实际命令、退出码和六项结论见 `local-validation.md`。
