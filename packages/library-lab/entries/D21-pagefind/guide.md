# Pagefind：把公开静态页面编译成可部署的全文索引

## 何时使用

Pagefind 适合技术文档、静态文章、公开 RSS 聚合内容的构建时全文索引：生成文件后浏览器可以按需加载，不需要搜索后端。它不适合每秒变化的私有动态数据索引，也**不具备租户授权或访问控制**。本例针对 pagefind 1.5.2（MIT）的真实 Node API 和本地原创 fixture，不在网页伪造 shell 或搜索结果。

## 安装与运行

PLATFORM 负责统一安装、锁文件与 CLI 注册：

~~~sh
pnpm --filter @reactloom/library-lab add -D pagefind@1.5.2
pnpm --filter @reactloom/library-lab exec node entries/D21-pagefind/examples/basic.mjs
pnpm --filter @reactloom/library-lab exec node entries/D21-pagefind/examples/business.mjs
pnpm --filter @reactloom/library-lab exec node entries/D21-pagefind/examples/advanced.mjs
pnpm --filter @reactloom/library-lab exec node --test entries/D21-pagefind/tests/sdk.test.mjs
~~~

实际逻辑在 examples/workshop.mjs；页面源码标签展示真实入口与 SDK 测试文件。Node 使用 pagefind.createIndex/addHTMLFile/addCustomRecord/addDirectory/getFiles/writeFiles/deleteIndex，CLI 成功后会报告输出文件名和实际字节数，生成目录位于唯一随机临时目录；没有凭据、远程 HTTP 调用或匿名遥测的业务代码。

## 三层真实实验

### basic：静态文章索引

两篇可信 HTML 使用 addHTMLFile({url,content}) 加入索引，再 getFiles/writeFiles 输出原生 Pagefind Bundle。每篇文档有完整 html 标签、lang、title 和 data-pagefind-body。检查 files 非空、所有文件 content 字节大于零，不能用自行编造的 JSON 文件冒充 Pagefind 索引。

### business：RSS 领域笔记

在三篇 HTML 之外通过 addCustomRecord 注入 RSS 笔记。url、content、language 必需，meta 的 title/category 应是扁平字符串，filters.category/tags 为字符串数组。索引是在本地离线生成，实际的分类过滤和中文分词效果还需要浏览器/目标语言对应实测。

### advanced：静态目录扫描与产物生命周期

添加临时站点 HTML，再用 addDirectory 扫描生成目录，与内存页面/自定义记录合并；getFiles 记录输出，writeFiles 写到隔离 out/pagefind；finally 中 deleteIndex 释放 native index。各 CLI 入口关闭 Pagefind 子进程。输出目录不指向正在运行的 Library Lab 生产根目录。

## 运行时与构建时的区别

Node 构建 API 负责生成静态资源；浏览器检索须部署生成的 pagefind.js、索引分片和关联资源，按实际 public basePath 初始化：

~~~js
const engine = await import('/pagefind/pagefind.js');
const result = await engine.search('React');
const details = await Promise.all(result.results.map(item => item.data()));
~~~

上面是**生产集成示意**，本例未在浏览器执行，不能用本文示意结果宣称搜索成功。部署在子路径下，要核实 bundlePath、静态路由、Content-Type、缓存和错误回退。

## 五种失败模式

1. **把 SSR 或运行中的 SPA 内存数据直接交给静态索引**：构建时页面没有实际渲染成 HTML 就搜不到。应在静态导出之后运行，或用 Node addHTMLFile 传入完整 HTML。
2. **秘密资料进入索引**：隐藏 CSS 并不安全；索引和摘要仍是公开资源。生成前按授权过滤，永远不索引私有 token/租户数据。
3. **错把 DOM 文本转为可执行 HTML**：本例只构建可信固定字符串；真实用户内容应进行安全转义，不将不可信 HTML 直接拼进模板。
4. **只上传 pagefind.js 不上传分片**：浏览器会找不到索引数据。发布整个 outputPath 目录，核查 URL 与缓存策略。
5. **多语言分词和过滤未经检验**：英文字词索引不是中文搜索通过的证据。添加真实中文内容、CJK 切词与组合输入 E2E；区分纯 Node 构建与浏览器全文召回。
6. **忘记 native 进程/索引清理**：在长时间运行的构建服务中及时 deleteIndex，结束独立 CLI 时 close。

## 与 MiniSearch 和 Fuse.js 对比

MiniSearch 适合在客户端把应用中的文档数组构造成倒排索引，并且能够实时更新；Fuse.js 适合对较小集合做加权模糊匹配。Pagefind 则适合已经编译成可公开下载的文档：构建时间换取运行时更小的下载量。Workbox 可为公开资源增加离线缓存，但要控制 Worker 作用域及索引版本。

## 验证清单

SDK：真实 native indexer 返回文件、写盘的目录存在、HTML/CustomRecord/Directory 成功。构建：把生成的所有文件部署到测试子路径。浏览器：加载搜索引擎、输入法 composition、不同查询结果、筛选、无结果、缺失分片/网络离线与索引版本更新。当前 SDK/build/browser = NOT_RUN；不能把存在源码和日志模板当执行证据。

## 官方来源

- https://pagefind.app/docs/node-api/
- https://pagefind.app/docs/api/
- https://pagefind.app/docs/running-pagefind/
- https://github.com/Pagefind/pagefind
