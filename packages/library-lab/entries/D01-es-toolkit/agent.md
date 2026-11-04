# D01 es-toolkit — 工程手册

## 适用

RSS、搜索文档和列表预处理里的纯函数：排序、按键去重、受控分组、分页切块。新 TypeScript 代码优先子路径导入。一个 `filter` 能写清的转换不必引入库。

不要把它当成 Zod、HTTP 客户端、金额库或任务队列。`chunk` 不限制并发。`debounce` 不取消已经发出的请求。

## 版本

`es-toolkit@1.52.0`，MIT。Lab 示例只从 `es-toolkit/array` 导入 `chunk`、`groupBy`、`orderBy`、`uniqBy`。

`es-toolkit/compat` 是另一套 Lodash 语义，和主入口的 `edges` 选项不能混用。升级小版本后仍要回归去重顺序和空值。

## 迁移

从 [`examples/example.tsx`](examples/example.tsx) 带走 `canonicalUrl`、`normalizeArticle`、`makeDigest`。`demo.tsx` 只是重导出，不要复制 UI。

保持未知入参逐条隔离、协议白名单、追踪参数白名单、先排序再 `uniqBy`、`pageSize` 1–100。来源只用 `official | community | other`。

生产若要防抖或 `limitAsync`，单独加模块。当前示例没有这些调用，不要假装按钮已经覆盖它们。

## 不可删的清理

`makeDigest` 必须先按发布时间降序、URL 升序，再按规范化 URL 去重。颠倒这两步会留下旧稿。

`canonicalUrl` 只删除 `utm_*`、`fbclid`、`gclid`，并丢掉 hash。业务查询参数保持原样，参数排序只为了得到稳定字符串。

坏行写入 `rejected` 的 index 和短原因，不把原始 payload 拼进错误文本。分组结果显式落到三个受控键，避免缺键变成 `undefined`。

若以后接上防抖搜索：卸载时 `cancel()`，进行中的 fetch 使用 `AbortSignal`，回写前比对代际。只做其中一件不够。

## 反例

- `uniqBy` 之后再排序，指望留下最新一篇。
- 用标题或整段小写 URL 当去重键。
- `url.search = ''` 清掉 `id`。
- 任意 `source` 字符串直接当对象键或配置名。
- `chunk` 当成 p-limit。
- `debounce` 当成请求取消。
- `pick` 或 `cloneDeep` 当成授权和校验。
- 把 `es-toolkit/compat` 的选项写进主入口 `debounce`。

## 测试断言

- 同一 URL 在降序之后，`uniqBy` 留下日期较新的那条。
- `groupBy` 的 `official` 计数与输入一致；`chunk(..., 2)` 得到预期批次，最后一批可以短。
- `javascript:`、缺标题、坏日期、非对象进入 `rejected`，其他行仍在。
- `?id=42` 与只差 utm 的 URL 合并；`?id=43` 保留。
- 非 1–100 的 `pageSize` 抛 `RangeError`。
- `tests/sdk.test.mjs` 导入的是真实 `es-toolkit/array`。文件在仓库里不等于这次运行已经 PASS。

## 真实限制

示例数据是本地种子。没有网络、没有 Zod、没有 Worker、没有并发池。页大小选择框只是 UI，真正的范围检查在 `makeDigest`。

官网给出的体积和速度比较不能抄成这个页面的预算。目标浏览器要按官方矩阵再测。

## 证据

sdk、build、browser 保持 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有匹配收据。仓库级 Actions 41779873259 不能抄到本条目。不要改 `verification.json` 来填 PASS。
