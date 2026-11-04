# Pagefind 1.5.2｜先有公开 HTML，再在临时目录建索引

Lab 锁定 `pagefind@1.5.2`。它索引静态 HTML。它不提供访问控制。私密正文只要进了公开站，加 ignore 属性也拦不住读者。

页面不启动这个工具。真正的运行是 Node 脚本 [`examples/workshop.mjs`](examples/workshop.mjs)，在操作系统临时目录里建索引并删除。返回值里 `visitorSearchExecuted` 固定是 `false`：没有在浏览器里打开搜索 UI。

没有收据时 sdk / build / browser 是 NOT_RUN。Actions 41779873259 不是本条目 PASS。

## Lab 当前示例

`runWorkshop(level)`：

- `pagefind.createIndex({ forceLanguage: 'en', excludeSelectors: ['[data-sensitive]'] })`。
- basic 只加入两篇公开 HTML。business 再加一篇和一条 `addCustomRecord`。advanced 再 `addDirectory` 一个只含可信静态页的目录。
- HTML 用 `escapeHtmlText`。fixture 是写死的英文，不是用户粘贴的 Markdown。
- `assertPublicDocument` 拒绝非 public 记录。
- `getFiles` 必须有非空字节。`writeFiles` 写到临时目录。`finally` 里 `deleteIndex`，并且默认删掉临时目录。
- 语言是 `en`。不要把这次结果说成中文分词已经验收。

没有挂载：浏览器里的 `/pagefind/pagefind.js`、`PagefindUI`、`data()` 分页、中文拼音搜索。

## 1. 所有权

```text
公开 HTML（构建产物） → createIndex / addHTMLFile → 临时 bundle → 发布时和 HTML 同一版本
```

CLI 读的是已经生成的 HTML，不是 Markdown 源文件，也不是 RSS URL。

## 2. 反例

### 反例 1：对 Markdown 目录跑 pagefind

未渲染的正文不会进索引。先生成 HTML，再索引。

### 反例 2：私密页靠 data-pagefind-ignore

原文仍在 HTML 里。敏感内容不要输出到公开站，也不要进索引。

### 反例 3：把 npm 包的 import 当成站点搜索运行时

`import * as pagefind from 'pagefind'` 是 Node API。浏览器要加载这次构建生成的 `pagefind.js`，不是手写一个占位文件。

### 反例 4：只改了链接没改 basePath

索引脚本会 404。`baseUrl` 和 JS 的 `basePath` 一起改，并在子路径上试一次。

### 反例 5：meta.title 用 innerHTML

用 `textContent`。链接只允许站内白名单。

### 反例 6：对每条结果立刻 data()

只对当前页取摘要。搜索和 `data()` 都要检查代数，慢的上一轮不能覆盖新查询。

### 反例 7：每次按键 destroy 再 init

会话内复用实例，离开页面再释放。Lab 的脚本在 `finally` 删除索引，那是 Node 工作坊，不是浏览器组件的生命周期。

### 反例 8：页面和索引不同版本

CDN 留着旧 chunk 时，词会指向不存在的 HTML。一起发布，缓存键一起变。

## 3. 练习

1. 传入 `visibility` 不是 public 的记录，脚本应在写入前失败。
2. 跑完 basic，确认临时目录被删，并且返回值没有执行访客搜索。
3. 若要把索引接到网站，用生成出的 JS，而不是这个 npm 包的浏览器入口。

## 4. 证据

`publication-policy` 不调用 Pagefind。Node 工作坊跑过并留下收据之后，sdk 才可以不是 NOT_RUN。浏览器搜索仍是另一项。

## 5. 资料

- https://pagefind.app/
- https://www.npmjs.com/package/pagefind
