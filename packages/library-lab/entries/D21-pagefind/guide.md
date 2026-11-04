# Pagefind 1.5.2｜只在临时目录写出静态索引

Lab 锁定 `pagefind@1.5.2`（MIT）。三条示例是 Node 脚本：[`examples/basic.mjs`](examples/basic.mjs)、[`examples/business.mjs`](examples/business.mjs)、[`examples/advanced.mjs`](examples/advanced.mjs)。它们调用 [`examples/workshop.mjs`](examples/workshop.mjs)，用 Pagefind 的 Node API 建索引并 `writeFiles`。返回值里 `visitorSearchExecuted` 是 `false`。入口在 `finally` 里 `pagefind.close()`，并打印：包已经写到磁盘，没有启动浏览器搜索。

这不是把搜索框挂进 Library Lab 页面。没有 `localhost:5173`，也没有在主源上提供 `/pagefind/` 资源。

没有匹配收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 是仓库级结果，不是本条目 PASS。

## Lab 当前示例

`runWorkshop` 在 `mkdtemp` 的 `reactloom-pagefind-` 目录里工作。`createIndex({ forceLanguage: 'en', excludeSelectors: ['[data-sensitive]'] })`。语言被固定为英文，因为种子是英文句子。`excludeSelectors` 用来丢掉带敏感标记的节点；种子 HTML 本身不放秘密。

每条记录先过 [`examples/publication-policy.mjs`](examples/publication-policy.mjs)。`visibility` 必须是 `'public'`。URL 必须匹配 `/articles/` 或 `/files/` 下的安全路径，拒绝 `..` 和 `//`。标题和正文必须是非空字符串。`escapeHtmlText` 在拼 HTML 时转义 `& < > " '`。不要把未转义的用户 HTML 放进 `addHTMLFile`。

- basic：两篇 `addHTMLFile`（Suspense 与 cache）。记录数 2。没有自定义记录，也没有目录扫描。
- business：第三篇 HTML，再 `addCustomRecord` 一条 `/files/rss-playbook.txt`，带 `filters.category = guide` 和标签。记录数 4。没有 HTTP API。
- advanced：把一份静态 HTML 写进临时站点目录并 `addDirectory`。记录数 5。目录扫描只看见这个临时文件夹。

`getFiles` 必须返回非空且每个文件都有 path 和字节。`writeFiles` 写到临时 `out/pagefind`。`keepOutput: false` 时 `finally` 先 `deleteIndex` 再删掉整个 scratch。三个入口为了把 JSON 打出来传入 `keepOutput: true`，目录留在系统 tmp，搜索 UI 仍不运行。

错误数组非空会抛错，不返回半成品成功。

## 什么时候用

公开静态站点在构建期生成搜索文件，让浏览器以后只下载索引分片而不是整库 JSON。内容必须已经是可发布的。

浏览器里会增长的小集合用 MiniSearch 或 Fuse。Pagefind 不负责登录后的文档。把私密 HTML 放进 `addDirectory` 就会进可下载的包。`assertPublicDocument` 是构建期断言，不是上游 ACL。

Workbox 可以缓存公开的搜索静态资源，但不要为了这个在 Lab 主源注册 Service Worker。版本更新时旧的 pagefind 文件要能被清掉。

## 模型

Node API 的顺序是 `createIndex`、添加 HTML 或自定义记录或目录、`getFiles`、`writeFiles`、最后 `deleteIndex` 与 `close`。`addHTMLFile` 接收 URL 和 HTML 字符串，正文应放在 `data-pagefind-body` 里，示例的 `documentHTML` 就是这样拼的。

`addCustomRecord` 用于没有 HTML 文件的笔记，可带 `meta` 和 `filters`。过滤器是搜索 UI 的元数据，不是权限。

`addDirectory` 会扫描路径。advanced 只把临时目录交给它。不要把用户主目录或仓库根传进去。

`forceLanguage: 'en'` 避免对英文种子做错误的语言检测。换成中文文档时要改这个选项并重新准备语料，不能沿用现在的断言。

`visitorSearchExecuted: false` 表示没有加载 Pagefind 的浏览器运行时，也没有执行查询。生成文件存在不等于搜索质量已经在浏览器里看过。

## 三层示例

### 基本

运行 `basic.mjs`。JSON 里 `submittedRecords` 为 2，`wroteActualBundle` 为 true，`visitorSearchExecuted` 为 false。进程结束前 `pagefind.close()`。

### 业务

多一篇文章和一条 RSS 笔记。笔记的 filters 是 `guide` 与 `rss` / `offline`。这些词来自固定 fixture，不是用户输入。

### 进阶

临时 `static.html` 被转义后写入并被目录扫描。若策略拒绝某条未标记 `public` 的记录，`addHTMLFile` 不会被调用。

## 反例

### 反例 1：把未公开文档送进索引

```ts
await index.addHTMLFile({ url: '/drafts/secret/', content: secretHtml })
```

```ts
const doc = assertPublicDocument(record)
await index.addHTMLFile({ url: doc.url, content: documentHTML(doc.title, doc.content) })
```

### 反例 2：不转义就拼 HTML

```ts
'<title>' + title + '</title>'
```

标题里的 `<script>` 会变成标记。使用 `escapeHtmlText`。

### 反例 3：扫描仓库根目录

`addDirectory({ path: repoRoot })` 会把内部文档卷进可下载索引。只扫描专门的公开输出目录。

### 反例 4：把 filters 当成登录

`filters: { role: ['admin'] }` 仍会随索引下载。角色过滤必须在生成前丢掉文档。

### 反例 5：忘记 close / deleteIndex

二进制索引进程会留在后面的脚本里。入口的 `finally` 调用 `pagefind.close()`。`runWorkshop` 在 `finally` 里 `deleteIndex`。

### 反例 6：用生成结果宣称浏览器搜索通过

`wroteActualBundle` 只说明文件写过。`visitorSearchExecuted` 必须保持 false，直到有单独的浏览器收据。

## 组合

**MiniSearch / Fuse**：动态集合留在浏览器索引。已经冻结的公开 HTML 交给 Pagefind。不要把两种索引都当成权限层。

**Workbox**：只缓存公开且带版本的 pagefind 资源。注册范围不能是 Lab 主源。更新站点时让旧预缓存失效。

## 生产核对清单

1. 每条记录有显式 `public`，URL 在允许的前缀内。
2. HTML 文本节点经过转义；敏感选择器被排除。
3. `addDirectory` 的路径是临时或公开输出目录。
4. `getFiles` 拒绝空资源；Pagefind 报错数组非空则失败。
5. 脚本结束 `close()`，索引对象 `deleteIndex()`。
6. 不在指南或 UI 里声称访客搜索已经运行。
7. 语言选项和真实文档一致。
8. 私密文档不进入会被下载的包。

## 升级

钉 `pagefind@1.5.2`。升级后重跑三个入口，确认文件列表非空、错误会抛出，并且 `close()` 仍在 `finally`。Node API 的返回形状若增加字段，不要把新的错误通道忽略掉。

不要为了演示改 `forceLanguage` 而不更换种子。

## 验收

- basic 写出真实包，记录数为 2，没有浏览器查询。
- business 的自定义记录不经过 HTTP 服务器，filters 来自公开 fixture。
- advanced 扫描的是临时目录里的已转义 HTML，并清理原生索引。
- 未标记 public、带 `..` 的 URL、空标题在 `addHTMLFile` 之前失败。
- 标题中的 `<` 被转成实体。
- `tests/sdk.test.mjs` 调用真实 `pagefind`。无收据则 NOT_RUN。

## 资料

- https://pagefind.app/docs/node-api/
- https://pagefind.app/docs/api/
- https://pagefind.app/docs/running-pagefind/
- https://github.com/Pagefind/pagefind
