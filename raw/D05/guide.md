# decimal.js：把金额字符串变成可解释的合计

采购页拿到单价 `19.99`、数量 `3` 和税率 `7.5%`，要显示小计、税额和总价。decimal.js 负责十进制运算；业务仍须决定在哪里舍入、采用什么舍入模式、允许什么输入。本例的税率与计算顺序是教学 fixture，不代表任何司法辖区的税务规则，前端结果也只是预览，结算应由服务端按权威价格重算。

## 何时选它

需要十进制有效数字、明确舍入、除法甚至幂运算时，可选 `decimal.js@10.6.0`（MIT，自带类型）。只是图表坐标用 Number 就足够；全程整数最小单位且没有十进制除法时，可评估 BigInt。只需要较小的十进制运算集合、又对体积敏感时比较同作者的 big.js 或 decimal.js-light；不要假设它们的精度选项语义相同。

成本是每次运算创建数值对象、维护字符串边界和业务舍入契约。它不会替你定义币种小数位、合法税率或支付流程。

## 从输入到结果的模型

原生 Number 的二进制浮点不能精确表示 `0.1` 和 `0.2`；先在 Number 里相加再交给 Decimal，已经来不及恢复原始十进制意图。接口和输入框都保留字符串：

```js
import Decimal from 'decimal.js';
const Money = Decimal.clone({ precision: 28, rounding: Decimal.ROUND_HALF_UP });
const sum = new Money('0.1').plus('0.2');
console.log(sum.toString()); // '0.3'
console.log(sum.toFixed(2)); // '0.30'
```

`precision` 是运算的有效数字数，**不是小数位数**。构造输入不会自动变成两位小数。算术方法返回新的 Decimal；`toDecimalPlaces(2)` 返回舍入后的 Decimal，`toFixed(2)` 返回保留两位的字符串。`toString()` 与 JSON 默认序列化不承诺保留尾零。金额 DTO 应显式输出 `toFixed(2)`，不要 `toNumber()` 后传输。

`Decimal.set` 会改变同一构造器的共享配置。这里 `Money` 与 `Bankers` 来自独立 `Decimal.clone`；其他模块修改默认 Decimal 的配置不会改变本例发票规则。实例比较用 `greaterThan` 等方法，避免隐式数值转换。

## 最小接入与迁入业务

在目标项目根运行 `pnpm add decimal.js@10.6.0`；若需要当前 React 界面，项目还须已有 React/React DOM 与 TSX 编译能力。库无需 Provider、CSS、网络或环境变量。

复制 [`invoice.mjs`](examples/invoice.mjs)、[`amount-policy.mjs`](examples/amount-policy.mjs) 及对应 `.d.mts` 类型声明到同一目录，业务调用：

```js
import { calculateInvoice } from './invoice.mjs';
const invoice = calculateInvoice({
  unitPrice: '19.99', quantity: '3', taxPercent: '7.5',
});
// { subtotal: '59.97', tax: '4.50', total: '64.47' }
```

如需完整交互再复制 [`example.tsx`](examples/example.tsx)；`demo.tsx` 是 Lab 的重导出适配，可以省略。`demo-controls` / `demo-output` 类只提供宿主外观，没有业务依赖，可改成自己的样式。

`amount-policy.mjs` 是本例自建输入约束，**不是 Decimal 的解析能力限制**：非负、最多10位整数与4位小数，数量为1–9999，税率不超过100%。科学计数、Infinity、NaN、逗号、前导零均拒绝。SDK 本身可处理更广泛的数值写法，本例主动收窄金额接口。输入 state 保留编辑中的原始字符串，点击计算时才校验，错误显示在 alert；不要在每次输入时写回 `toFixed`。

发票唯一算法在 `invoice.mjs`：单价乘数量 → 行小计舍入到分 → 在此小计上计算税并舍入到分 → 相加并输出字符串。修改规则应先修改黄金用例，不能在 React 组件里另写一套计算。

## 三个独立实验

### 基础：两种数值模型

默认左操作数 `0.1`、右操作数 `0.2`，观察原生 Number 的 `0.30000000000000004` 和 Decimal 的 `0.3`。把右侧改成 `0.7`，观察同一字符串输入对应的真实返回值。输入 `1e3` 会显示校验错误而非旧输出。只有标注为原生对照的路径使用 Number，发票路径始终使用字符串。

### 业务：一次可重算的采购预览

默认单价 `19.99`、数量 `3`、税率 `7.5`，点击“按业务规则计算”得到小计 `59.97`、税额 `4.50`、总价 `64.47`。编辑任何字段，旧结果立即消失，必须重新计算。将数量改成 `0` 再计算会报错，改回 `3` 可以恢复。

这一步新增的是应用的输入边界和结果有效期。税率和舍入顺序属于 fixture；没有真实报价 API、扣款、多行 SKU、折扣或汇率能力。

### 进阶：为什么差一分钱

这个独立对照只展示舍入，不重复采购表单：`1.005` 在 HALF_UP 下是 `1.01`，HALF_EVEN 下是 `1.00`，因为最接近的偶数百分位是0。`0.335 × 3` 整行舍入得到 `1.01`，先将单价舍入成 `0.34` 再乘得到 `1.02`。两种都可以是明确的合同，但不能在同一系统里无意混用。

真实调用集中在 `roundingContrast()`，它使用两个隔离构造器。需要修改对照输入时改该函数和黄金用例；页面当前提供的是固定边界实验，没有可配置税务引擎。

## 迁移边界与验证

客户端精确不等于客户端可信；服务端应独立校验字段、权威单价与舍入规则。不将本地化展示（如 `1,234.50`）直接喂给计算模块。批量计算还需业务条数上限；本例无 Worker、定时器、订阅、存储或临时 URL，离开页面仅释放 React state，没有额外清理资源。

在仓库根执行 `node --test packages/library-lab/entries/D05-decimal-js/tests/sdk.test.mjs` 可验证真实 SDK 的加法、默认采购、半分边界与配置隔离；`amount-policy.test.mjs` 只验证自建策略，不能代替 SDK。浏览器需另验编辑失效、错误恢复与页签切换。当前本地证据见 `local-validation.md`；正式收据仍单独管理。

## 官方原文与参考

[官方 v10.6.0 README](https://github.com/MikeMcl/decimal.js/blob/1a6e845004b29a3b7dcef78fe92b8d786634f4e2/README.md) 已逐字保存至官方 README 页签。固定提交根目录没有官方中文 README，因此采用英文原文，本页是独立中文讲解。[官方 API 站点](https://mikemcl.github.io/decimal.js/)提供完整方法与配置参考。官网本次 GET 返回200且未见明确嵌入限制头，但未从 Lab origin 确认可嵌入，状态保持 unknown；官网页签保留预览尝试及直达入口。
