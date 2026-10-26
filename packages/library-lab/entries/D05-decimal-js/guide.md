# decimal.js：前端金额、税率与十进制精度

> D05 · decimal.js@10.6.0 · MIT。官方包版本与源码已核查；新示例 SDK/构建/浏览器在当前环境未执行，状态必须保持 NOT_RUN。

## 解决什么，不解决什么

JS Number 采用二进制浮点，对十进制表示存在不可避免的舍入误差（例如 `0.1+0.2`）。decimal.js 提供可配置的高精度十进制运算。它不自动定义“货币怎样舍入”“税应在哪一步舍入”“哪种汇率可信”这些业务规则，也不是财务认证系统。

计费、采购、佣金、税率、折扣、价格校验可以考虑 decimal.js。纯计数且在安全整数范围内不必引入；结算边界也可用整数最小货币单位，但涉及复杂税/汇率和比例时应重新审查规则。

## 安装和真实导入

```bash
pnpm add decimal.js@10.6.0
```

```ts
import Decimal from 'decimal.js';
const Money = Decimal.clone({precision: 28, rounding: Decimal.ROUND_HALF_UP});
const result = new Money('0.1').plus('0.2').toString(); // '0.3'
```

全量实际示例在 `examples/example.tsx`，演示包装仅 `examples/demo.tsx`。注意输入 **字符串** 而不是先 `Number(text)` 再构造 Decimal；在转换前损失的精度不会被库恢复。

## 三层 Demo

### 入门：Native Number 和 Decimal 对照

页面真实执行 `String(0.1 + 0.2)` 与 `new Decimal('0.1').plus('0.2')`，突出浮点误差来源。不要由此得出 Number 一律不可用；坐标、动画和一般统计完全可以继续用 Number。

### 业务：订阅采购发票

价格、数量和税率使用受控文本输入。校验只允许有限长度的十进制，不允许 Infinity、科学计数法、负数或无穷小数位。乘法后 `toDecimalPlaces(2)` 计算行小计；税率在小计之后计算。返回的三个金额全部 `toFixed(2)` 输出字符串，不用 `toNumber()` 持久化。

### 进阶：舍入规则差异

`ROUND_HALF_UP` 和 `ROUND_HALF_EVEN` 在恰好半分时可能得到不同结果：样例字符串 `1.005` 保留两位时分别得到 `1.01` 和 `1.00`。不同合同或司法辖区对发票、税额、折扣的舍入规定可能不同，必须先确定业务规则，再选择 mode 和舍入位置。

## 关键 API 与所有权

- `Decimal.clone(config)`：创建独立配置域，避免对全局 `Decimal.set` 造成跨模块副作用。
- `new Money(str)`：从原始十进制字符串构造，无丢失前置 Number 精度。
- `.plus/.minus/.times/.dividedBy`：返回新的 Decimal，不直接修改已有实例。
- `.toDecimalPlaces(2)`：显式定义舍入步骤。
- `.toFixed(2)`：控制展示精度并输出字符串；不要将展示字符串直接视为货币区域格式。
- `.isFinite()/.isNaN()`：库允许非有限数作为对象；业务输入仍必须拒绝。

Decimal 的 `precision` 是**有效数字位数**，不等同于“保留几位小数”。因此业务最终舍入应明确执行 `toDecimalPlaces`。

## 专项反模式

1. **`new Decimal(0.1+0.2)`**：误差已产生。正确：`new Decimal('0.1').plus('0.2')`。
2. **全局 `Decimal.set`**：同页另一模块舍入变了。正确：`Decimal.clone` 明确隔离业务配置。
3. **混合多个舍入点**：单项先舍入和汇总后舍入结果可不同。正确：合同/测试指定顺序。
4. **用 JS Number 序列化金额**：小数或大整数精度可再次丢失。正确：以字符串、明确货币代码与单位存储和传递。
5. **无校验直接解析任意精度字符串**：可能造成无界输入和资源开销。正确：约束长度、小数位、范围与正负号。

## 相关组合

C02 Zod 可作为格式、精度和业务范围边界；后端也须验证相同规则，不能信任客户端。与 Redux/Query 等数据状态工具组合时，应在 DTO 中约定金额字符串，避免序列化 Decimal 实例造成契约歧义。

## 可迁移练习

把单价×数量×税率做成框架无关函数，写对账黄金样本（0.1+0.2、1.005、零税率、超长输入、小数位过多、金额溢出）。必要时和后端 Decimal/SQL numeric 的舍入规则逐个核对；不要拿 JS `toFixed` 当黄金标准。

## 运行与验证

新示例执行需要平台集中安装 `decimal.js@10.6.0`。等待真实 SDK 单测、TypeScript、Vite build 和浏览器运行后更新 verification.json；旧研究结果不迁移为新源码的 PASS。

## 官方资料

- [GitHub 仓库](https://github.com/MikeMcl/decimal.js/)
- [package.json (v10.6.0)](https://github.com/MikeMcl/decimal.js/blob/master/package.json)
- [API 参考](https://mikemcl.github.io/decimal.js/)
