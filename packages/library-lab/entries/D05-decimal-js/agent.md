# D05 decimal.js — Agent 工程知识

## 适用

需要准确的十进制金额/税率/汇率/佣金计算，而不是二进制浮点近似值。明确货币单位与业务舍入规则先于代码。版本 decimal.js@10.6.0，MIT；目标项目需单独验证包安装、运算与原后端合同一致。

## 可迁移源码

读取 `examples/example.tsx`，只复制纯 `calculateInvoice` 及必要的 Decimal.clone、输入校验策略；React UI 不是业务库依赖。所有金额值从字符串进入，从字符串离开，不依赖 `Number()` 反复往返。

保留 `Decimal.clone({precision:28,rounding:Decimal.ROUND_HALF_UP})` 的隔离意图。税率/小计/折扣的舍入阶段必须依据实际业务确认，示例只是明确的案例而非财务规则宣告。

## 危险反例

- `new Decimal(0.1+0.2)` 无法恢复先前丢失精度。
- 全局 `Decimal.set` 影响其他库和页面；使用 clone。
- 将 Decimal 实例作为 JSON DTO 隐式序列化；输出字符串并添加 currency/scale 约束。
- 接受 Infinity/NaN/科学计数法作为金额字段；先限制输入。
- 认为 rounding 模式一旦设定就覆盖所有税务法规；实际舍入阶段仍可能不同。

## 最低测试要求

0.1+0.2=0.3；金额 19.99×3 税率 7.5%；HALF_UP/HALF_EVEN 在 1.005 上的不同；不合法数量、负数、过多小数、超限税率应拒绝。目标项目实际 API 与数据库落库/读取需端到端校对。新源码 SDK/typecheck/build/browser 均 NOT_RUN；证据见 verification.json。

## 官方

https://github.com/MikeMcl/decimal.js/


## 防止算法与展示双份维护

移植 `examples/invoice.mjs` 和 `examples/amount-policy.mjs`；UI 不再独占 `calculateInvoice` 算法。金额入参与结果都保留十进制字符串，严禁先转换为 JS Number；明确发票税额舍入点与按行/按单价舍入的差异。字段变更必须使旧结果失效，不能让旧计算结果被当成新参数的账单。SDK 回归直接导入 invoice.mjs，纯策略通过不意味着 decimal.js 已运行。