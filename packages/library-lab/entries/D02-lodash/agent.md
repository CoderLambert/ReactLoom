# D02 Lodash/lodash-es — Agent 最小迁移策略

用于高可靠集合处理（`uniqBy/groupBy/orderBy/chunk`）和 UI 输入 `debounce`。不是状态容器、网络取消机制或安全校验库。

## 迁移代码
看 `examples/example.tsx` 的 `buildDigest`：仅移植独立数据函数、字段类型与真实业务主键。UI `debounce` 必须保留 `useMemo` 的稳定生命周期和卸载 `cancel()`；发起了 fetch 仍需 AbortSignal。不得将 Lab 的静态 RSS fixture 与演示标签复制进生产。

## 库选型
目标使用 ESM bundler：`lodash-es@4.18.1` + `@types/lodash-es@4.17.12`，建议按命名成员导入。CommonJS 后端若已有 `lodash`，不要无评估跨模块迁移。与 D01 es-toolkit 对比功能覆盖与真实输出，不空喊零成本。

## 禁止反模式
不得用 title 代替唯一 ID；不得把 uniqBy 的第一个结果称为“最新”；不得把 debounce 当请求取消；不得将服务端 ACL/租户过滤交给前端 groupBy。

## 必测
重复主键保留策略、同 score 的 tie-break、flush/cancel、中文 IME 与卸载不回写、构建体积（有真实证据再评价）。Node `node --test entries/D02-lodash/tests/sdk.test.mjs`，类型/构建/浏览器分别验证；当前均 NOT_RUN。

资料：https://lodash.com/，https://www.npmjs.com/package/lodash-es 。
