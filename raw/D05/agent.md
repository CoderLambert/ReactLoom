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

## 完整落地文件与配置

目标项目执行 `pnpm add decimal.js@10.6.0`，无需 `@types/decimal.js`、Provider、环境变量或额外 bundler 配置。纯计算复制 `invoice.mjs` / `invoice.d.mts` / `amount-policy.mjs` / `amount-policy.d.mts`；React UI 再复制 `example.tsx`。Lab 的 `demo.tsx` 仅是入口适配。宿主 demo CSS 类可替换，未依赖 Lab 内部模块。

三个场景现在各自展示字符串加法（可编辑）、采购重算（校验/失效/恢复）、固定半分与舍入点对照（隔离构造器）。不要在进阶重复挂载采购表单来充层级。SDK 金额运算与自建输入策略、教学税规则分别归属 `decimal.js` / `amount-policy.mjs` / `invoice.mjs`。

没有 timers、监听、存储、Worker 或网络资源需要卸载清理；React state 随组件释放。错误不要吞掉，也不要在字段改变后保留旧合计。迁入真实项目后服务端必须重算权威金额，fixture 税率不构成税务建议。

## 固定来源

官方 `v10.6.0` 指向提交 `1a6e845004b29a3b7dcef78fe92b8d786634f4e2`；原始 `README.md` 在 `official/readme.md`，摘要及语言见 metadata。固定根目录没有官方中文 README。原始响应头与目录证据见 `official/source-evidence.json`。官网 preview 为 unknown，HTTP200不是嵌入通过。
