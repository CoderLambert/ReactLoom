# decimal.js 10.6.0｜字符串金额、舍入点和隔离构造器

Lab 锁定 `decimal.js@10.6.0`（MIT，自带类型，不要再装 `@types/decimal.js`）。它用十进制有效数字做运算，消除的是 `0.1 + 0.2` 这类二进制浮点误差。它不决定币种小数位、税法、幂等扣款或“前端合计可以被支付”。

示例里的税率和舍入顺序是写明的教学合同，不是某个国家的发票规范。

没有匹配收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 是仓库级结果，不是本条目 PASS。

## Lab 当前示例

[`examples/demo.tsx`](examples/demo.tsx) 重导出 [`examples/example.tsx`](examples/example.tsx)。计算在 [`examples/invoice.mjs`](examples/invoice.mjs)，入参形状在 [`examples/amount-policy.mjs`](examples/amount-policy.mjs)。

三层都展示 `new Decimal('0.1').plus('0.2').toString()` 与 `String(0.1 + 0.2)`。前者按十进制得到 `0.3`，后者是二进制浮点的字符串。

business 和 advanced 共用同一张发票：单价、数量、税率都是字符串。`normalizeAmount` 只接受非负十进制，最多 10 位整数和 4 位小数，拒绝科学计数、前导零和逗号。数量是 `1`–`9999` 的整数字符串。税率数值不超过 100。

`Money = Decimal.clone({ precision: 28, rounding: Decimal.ROUND_HALF_UP })`。合同是：行小计 `unit.times(quantity).toDecimalPlaces(2)`，再对这个小计算税并舍入到分，最后 `toFixed(2)` 输出字符串。改任一输入会清掉上次结果，避免旧合计还挂在新字段旁边。

advanced 另有 `Bankers = Decimal.clone({ precision: 28, rounding: Decimal.ROUND_HALF_EVEN })`。`roundingContrast` 展示 `1.005` 在两种舍入下的 `toFixed(2)`，以及 `0.335 × 3`：先按行金额舍入，和先把单价舍入再乘数量，结果不同。

没有挂载：多行 SKU、折扣、RHF、Excel 导出、Worker。那些是生产组合，不是当前按钮。

## 什么时候用

需要可控有效数字、非整数幂或银行家舍入对照时用 decimal.js。只有加减、且包体积敏感时，比较同作者的 `big.js` 或 `decimal.js-light`。金额全程是整数最小单位、除法规则自己写时，用 `BigInt`。图表坐标继续用 `Number`。

任何库都不替代服务端按权威价格重算。客户端结果是预览。

| 维度 | Lab 的钉 |
| --- | --- |
| 包 | `decimal.js@10.6.0` |
| 许可 | MIT |
| 导入 | `import Decimal from 'decimal.js'` |
| 类型 | 包内 `decimal.d.ts`；10.6.0 的类型更新包含 BigInt 声明 |
| 运行时 | 纯计算，不依赖 DOM |

## 模型

`Decimal` 用符号、十进制指数和系数数组表示值。`.d`、`.e`、`.s` 不是数据库协议，也不要改它们。

`precision` 是有效数字个数，不是小数位数。`precision: 28` 不会自动把输入截成两位小数。`toDecimalPlaces(2)` 返回 Decimal。`toFixed(2)` 返回固定刻度字符串。`toString()` 和 `toJSON()` 可能丢掉末尾零，`1.20` 可以变成 `1.2`。持久化用 `toFixed`。

```js
new Decimal('0.1').plus('0.2').toString() // '0.3'
new Decimal(0.1 + 0.2).toString()          // 误差已经在构造前发生
```

`Decimal.set` 改的是该构造器上的共享配置。业务模块用 `Decimal.clone`。Lab 的发票和银行家舍入是两个 clone，互不影响。

比较用 `.greaterThan()`、`.equals()`。不要用 `<` 或 `==` 触发隐式转换。`NaN` 和 `Infinity` 能被 Decimal 表示，接口层仍要拒绝。

默认源码里的 `precision: 20`、`rounding: 4` 是库默认值。Lab 覆盖为 28 位有效数字和明确的舍入常量，不要假设全局默认就是发票合同。

## 三层示例

### 基本

只看两个 `<output>`：原生 Number 与 decimal.js。输入是字符串 `'0.1'` 和 `'0.2'`，不是先加再包进去。

### 业务

默认 `19.99 × 3`，税率 `7.5`。行小计先到分，再算税。点计算后 JSON 里是 `subtotal`、`tax`、`total` 三个字符串。这是 fixture 合同：税额只在小计上舍入一次。真实税务可能按行、按品类或多币种，不能照搬 7.5%。

非法单价或数量时，`role="alert"` 显示 `normalizeAmount` / `normalizeQuantity` 的错误，结果区清空。

### 进阶

同一屏展示 HALF_UP 与 HALF_EVEN，以及两种舍入点。文案要求以合同指定的舍入点为准。全局 `Decimal.set` 不在这条路径上。

## 反例

### 反例 1：用 Number 做完再构造

```js
new Decimal(0.1 + 0.2)
```

```js
new Decimal('0.1').plus('0.2')
```

接口金额保持字符串。`parseFloat` 同样会先毁掉十进制。

### 反例 2：把 precision 当成两位小数

```js
Decimal.clone({ precision: 2 })
```

运算有效数字和展示小数位是两件事。业务边界调用 `toDecimalPlaces(2, mode)` 或 `toFixed(2, mode)`。

### 反例 3：每一步都 toFixed

过早舍入会累积分差。Lab 只在行小计和税额两处舍入。`0.335 × 3` 的两个结果就是证据。

### 反例 4：全局 Decimal.set

```js
Decimal.set({ rounding: Decimal.ROUND_HALF_EVEN })
```

其他模块的异步计算会被改掉。

```js
const Money = Decimal.clone({ precision: 28, rounding: Decimal.ROUND_HALF_UP })
```

### 反例 5：指望 JSON 保留 1.20

```js
JSON.stringify({ amount: new Decimal('1.20') })
```

```js
JSON.stringify({ amount: money.toFixed(2) })
```

支付请求传字符串或整数最小单位，不传 `toNumber()`。

### 反例 6：科学计数和超长字符串直接构造

`1e1000000`、`Infinity`、`001.00`、`1,234.50` 在 `normalizeAmount` 被拒绝。库能解析某些数学写法，不代表业务接口接受它们。

### 反例 7：输入过程中格式化

用户还在输入 `0.` 或组合中文时，不要 `toFixed(2)` 写回输入框。Lab 把原始字符串留在 state，提交时再校验。失焦规范化是产品决定，不是库的默认行为。

### 反例 8：相信浏览器传来的 total

服务端用权威单价重算。前端字符串再精确也不是结算权。

## 组合

**React Hook Form + Zod**：RHF 保存中间态字符串。Zod 校验语法和区间。通过后再交给 `calculateInvoice`。`Intl.NumberFormat` 只负责展示，本地化后的字符串不能直接喂给 Decimal。Lab 没有装这两样。

**Query + 表格导出**：缓存 `{ unitPrice: '19.99' }` 这种字符串。导出写 `toFixed` 的结果，并注明单元格里的 Number 仍是二进制浮点。

**Worker**：大量计算时把字符串传进 Worker，在 Worker 内 `clone`。少量发票不必为了隔离再加一层 Comlink。

## 生产核对清单

1. 金额字段的传输类型是字符串或整数最小单位，测试里没有 `number`。
2. 舍入模式、舍入点（单价、行、税、合计）写在合同里，并有黄金用例。
3. 每个业务域自己的 `Decimal.clone`，模块顶层没有 `Decimal.set`。
4. 入参有长度、小数位和范围。科学计数进不了价格字段。
5. 持久化与 HTTP body 使用 `toFixed`，不用 `toJSON()` 的默认字符串。
6. 服务器忽略客户端 `total`，按商品版本重算。
7. 输入框在提交前保留 `0.` 这类中间态。
8. 不可信批量计算有条数上限；高 `precision` 和 `pow` 不直接对着开放接口。

## 升级

钉 `10.6.0`。这一版的公开变更重点是 TypeScript 对 BigInt 的声明，不要把它说成新增了 React hook。升级时用同一组发票快照对比 HALF_UP、HALF_EVEN、负数和尾零。

从 `big.js` 或 `bignumber.js` 迁入时，列出“有效数字”和“小数位”各自对应哪个选项。`1/7`、`19.985`、超大整数和 `NaN` 都要有契约测试。不要一次改掉全局精度。

从 `Math.round(x * 100) / 100` 迁出时，先把行级和税级舍入写进测试，再换实现。

## 验收

- `'0.1' + '0.2'` 的 Decimal 字符串是 `0.3`。
- `19.99 × 3` 后的小计、税额、合计是两位小数字符串，且税额发生在已舍入的小计上。
- `1.005` 的 HALF_UP 与 HALF_EVEN 都能在 advanced 读到，且彼此的差异被保留。
- `0.335 × 3` 的行舍入和单价舍入不相等。
- 科学计数、负数、空字符串、超量小数、数量 `0` 或 `10000` 在构造 Decimal 之前失败。
- 编辑字段后旧发票从界面消失。
- `tests/sdk.test.mjs` 导入真实 `decimal.js`。`amount-policy` 单测不代替 SDK。没有收据则 NOT_RUN。

## 资料

- https://mikemcl.github.io/decimal.js/
- https://github.com/MikeMcl/decimal.js
- https://github.com/MikeMcl/decimal.js/blob/master/CHANGELOG.md
- https://github.com/MikeMcl/decimal.js/blob/master/decimal.mjs
- https://github.com/MikeMcl/decimal.js/blob/master/LICENCE.md
- https://www.npmjs.com/package/decimal.js
