# D02 lodash-es — 工程手册

## 适用

已有 Lodash 语义的列表去重、分组、稳定排序，以及输入框防抖。ESM 前端用 `lodash-es` 的具名导入。

一次性 `map` / `filter`、Query 缓存、金额、HTML 净化、请求并发池不要放进这个包。`memoize` 不是服务端缓存。

## 版本

`lodash-es@4.18.1`，MIT。Lab 不安装并行的 `lodash` CJS 包。

4.18.0 覆盖已披露的 `unset` / `omit` 原型链路径和 `template` 注入；4.18.1 修模块化构建回归。低于这条线的教程不要照搬。锁文件里的 `lodash.*` 单函数包同样要核对。

## 迁移

从 [`examples/example.tsx`](examples/example.tsx) 带走 `buildDigest` 和 advanced 的 `debounce` 清理。`demo.tsx` 留在 Lab。

看清当前摘要：`uniqBy` 在 `orderBy` 之前，保留种子里的第一条。RSS 若要留最新，先规范化时间再降序，然后去重。不要把本示例的顺序原样说成“留高分”。

IME：`compositionstart` 时 `cancel()`，`compositionend` 直接提交当前字符串。卸载 effect 调用 `cancel()`。

## 不可删的清理

`useMemo` 创建的 debounced 函数必须在 effect 清理里 `cancel()`。清空按钮同时 `cancel()` 并清掉已应用查询，避免计时器稍后写回旧词。

`flush()` 只是立刻执行待触发调用。它不创建 `AbortSignal`。一旦回调里有请求，取消要另做。

分组键保持种子里的联合类型。不要把用户字符串拼进 `groupBy` / `keyBy` 的对象键。

## 反例

- 先 `uniqBy` 再排序，却在文案里写“保留最新”。
- 用标题去重。
- `merge` 覆盖配置，数组被按下标混合。
- `get(...) || fallback` 把 `0` 当成缺失。
- 只 `debounce`，回写不看代际。
- 用 `throttle` 当并发上限。
- 用户模板进 `_.template`。
- 同一应用同时打包 `lodash` 和 `lodash-es`。

## 测试断言

- 相同 id 保留第一条，不保留后面的更高分或更低分。
- 分组后组内按分数降序、id 升序。
- `chunk(..., 3)` 的批长度符合余数。
- `debounce` 的 `flush` 立即调用，`cancel` 后不再调用。
- 组合态期间不调度；组合结束后的值进入已应用查询。
- `tests/sdk.test.mjs` 导入真实 `lodash-es`。没有收据就保持 NOT_RUN。

## 真实限制

示例不发 HTTP，不做 URL 规范化，不调用 `cloneDeep`、`merge`、`template` 或 `keyBy`。中文 IME 需要在浏览器里用真实输入法再看一次。

`toLocaleLowerCase` 只用于本地标题过滤，不是搜索引擎分词。

## 证据

sdk、build、browser 保持 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 出现匹配收据。Actions 41779873259 不能抄成这条目的 PASS。不要改 `verification.json`。
