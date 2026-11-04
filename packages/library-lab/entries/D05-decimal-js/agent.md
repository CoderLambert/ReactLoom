# D05 decimal.js — 工程手册

## 适用

需要十进制有效数字和明确舍入的金额预览、比例和单位换算。输入必须是校验过的字符串。

不要用它代替税额法规、支付幂等或服务端定价。图表坐标不必引入。固定整数分且没有十进制除法时，优先评估 `BigInt`。

## 版本

`decimal.js@10.6.0`，MIT，类型随包发布。Lab 用 `Decimal.clone({ precision: 28 })`，不用库默认的 20 位有效数字充当发票合同。

10.6.0 的类型说明包含 BigInt。不要据此发明新的运行时 API。

## 迁移

从 [`examples/invoice.mjs`](examples/invoice.mjs) 和 [`examples/amount-policy.mjs`](examples/amount-policy.mjs) 带走计算与校验。React 文件只负责字符串 state 和展示。

合同：单价乘数量后把行小计舍入到分，再对小计算税并舍入到分，输出 `toFixed(2)`。HALF_EVEN 只出现在对照函数里，不写进发票。

改字段时丢掉上一次的 `InvoiceResult`。

## 不可删的清理

`Money` 与 `Bankers` 必须来自 `Decimal.clone`。不要改成 `Decimal.set`。

`normalizeAmount` / `normalizeQuantity` 在 `new Money(...)` 之前执行。拒绝科学计数、前导零、逗号、负数和超限小数。

序列化只输出字符串。不要把 Decimal 实例放进 React state 或 `JSON.stringify` 后指望保留 `1.20`。

## 反例

- `new Decimal(0.1 + 0.2)` 或 `parseFloat` 后再构造。
- 把 `precision: 2` 当成两位小数。
- 每步 `toFixed`，分差被提前吃掉。
- 全局 `Decimal.set`。
- `toNumber()` 交给支付接口。
- 输入框在组合过程中格式化成 `0.00`。
- 信任客户端传来的 `total`。
- 用 `<` 比较 Decimal 实例。

## 测试断言

- 字符串 `'0.1'.plus('0.2')` 得到十进制 `0.3`。
- 发票先舍入行小计，再舍入税额。
- HALF_UP 与 HALF_EVEN 对 `1.005` 的差异可见。
- 行舍入和单价舍入对 `0.335 × 3` 的差异可见。
- 非法金额和数量在构造前抛错。
- `amount-policy` 测试不导入 decimal.js 时，不能充当 sdk。`tests/sdk.test.mjs` 必须真的导入库。无收据则 NOT_RUN。

## 真实限制

税率 7.5% 和“税在小计上舍入一次”是 fixture。没有多行折扣，没有汇率，没有 Worker。中间态字符串可以是用户正在输入的非法值，只有点击计算才校验。

`toString()` 不等于金额显示格式。

## 证据

sdk、build、browser 保持 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有匹配收据。Actions 41779873259 不是本条目 PASS。不要改 `verification.json`。
