# IMask 7.6.1｜掩码管外观，不管日期和金额语义

Lab 锁定 `imask@7.6.1` 和 `react-imask@7.6.1`（MIT）。IMask 在输入过程中维护格式和光标。它不证明手机号真实、不证明公历存在、也不做十进制金额运算。

没有收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 不是本条目 PASS。

## Lab 当前示例

[`examples/example.tsx`](examples/example.tsx) 使用真实 `<IMaskInput>`。业务值只从 `onAccept` 进入 React state。`demo.tsx` 只做再导出。没有双终端 mock API，也没有 `localhost:5173` 的 workshop。

- **basic**：`mask="0000-0000"`，`unmask={true}`。界面可以显示连字符，`onAccept` 交给 state 的是数字串。`key={generation}` 只在点击「重置」时增加，避免每次按键拆掉输入法。
- **business**：`mask={Number}`，`radix="."`，`scale={2}`，`thousandsSeparator=","`，`unmask={true}`。state 里应是不带千分位的数字文本。注释写明后续计算要用 decimal.js，不能用 JS 浮点做财务结算。
- **advanced**：`mask="0000-00-00"`，`unmask={false}`，所以 state 保留分隔符。[`calendar-policy.mjs`](examples/calendar-policy.mjs) 的 `validCalendarDay` 用 UTC 日历回读拒绝 `2026-02-30`。实现用 `setUTCFullYear`，避开 `Date.UTC` 把 0–99 年折到 1900–1999。旁边的中文备注是普通 `<input>`，只用 `onCompositionStart/End` 显示是否在组合，不套数字掩码。

研究笔记里的 `setUnmaskedValue`、动态 `dispatch`、RHF `Controller` 和 Query 回填都没有挂载。

## 什么时候用

固定位数的编号、需要千分位和小数位的金额外观、以及「先看起来像日期」的输入。自由文本、中文姓名、搜索框不要套 mask。一个字段的合法中间态（用户刚输入 `1`）必须允许，完整业务校验放在提交。

## 数据与模型

Mask 同时有视图字符串和 unmasked 值。React 只能认一份。Lab 在编号和金额上选 unmasked，在日期上选带分隔符的视图，因为公历函数要看到 `YYYY-MM-DD`。

`onChange` 不是业务入口。掩码在内部改值，React 的合成事件可能看到中间形态。`onAccept` 在库接受这次输入之后触发。`onComplete` 只表示格子填满，例如 `2026-02-30` 也能填满。

不要在每次 `onAccept` 时改组件 `key`。key 变化会卸载 DOM，光标和组合态一起丢。Lab 把 key 留在显式重置。

Pattern mask 和 Number mask 不能靠 `updateOptions` 在原地互换类型。要换模型就换 key，而且只在规则真的变了的时候换。

直接写 `input.value = saved` 会绕过 MaskedModel。恢复草稿用库提供的 setter，或让 React 以正确的 unmasked 值重新挂载。本 Demo 的重置是后者：清空 state 并增加 generation。

## 三层示例

### 基本

输入 `12345678`。输出区应接近 `12345678` 而不是 `1234-5678`，因为 `unmask` 为真。`onAccept` 计数增加。粘贴带连字符的文本，计数和值仍来自 accept，而不是你在 `onChange` 里自己 slice。

### 业务

输入 `1234.5`。unmasked 值不应带逗号。`scale: 2` 限制小数外观，不表示二进制浮点已经精确。把这个字符串交给 `Number` 再累加，仍然会遇到 `0.1 + 0.2`。提交前交给 decimal.js 或整数分。

`1.20` 是否被收成 `1.2` 取决于 `padFractionalZeros` / `normalizeZeros`。Lab 没有改这两项。金额存储不要依赖「看起来有两位」。

### 进阶

`2026-02-30` 掩码接受字符，状态行必须写「格式化不等于有效日期」。`2026-02-29` 不是闰年，同样失败。`2024-02-29` 通过。空值显示「尚未填写」，不要把它说成无效日期。

中文备注框在组合时状态变为「正在组合字词」。不要把 `0000-0000` 套到这个框上，否则候选字会被过滤。

## 反例

### 1. 用 onChange 当值

```tsx
<IMaskInput mask="0000-0000" onChange={event => setRaw(event.target.value)} />
```

可能存到带连字符的中间态，和 `unmask` 的约定不一致。改为 `onAccept={update}`。

### 2. 受控 value 和回调各存一种形态

`value={masked}` 但 state 存 unmasked，光标会跳到末尾。选定一种，React state 和 `unmask` 一致。

### 3. 每次按键换 key

```tsx
<IMaskInput key={raw} mask="0000-0000" />
```

焦点丢失，IME 被截断。key 只留给重置和 mask 类型切换。

### 4. type="number"

`selectionStart` 在很多浏览器里不可用，前导 0 会丢。用 `type="text"` 加 `inputMode="numeric"`。Lab 的控件没有改 type，迁移时补上。

### 5. 中文姓名套数字 mask

组合输入被丢掉。姓名用普通 input。掩码留给编号。

### 6. onComplete 就下单

填满不等于合法。日期还要 `validCalendarDay`，编号还要服务端校验。

### 7. typedValue 直接相加

Number mask 的数值是 JS number。财务用十进制字符串或整数分。

### 8. validate 拒绝中间态

用户输入 `1` 就被判非法，后面的数字进不去。完整校验放在提交。

### 9. 每次 render 调用 IMask(el)

重复监听。React 用 `IMaskInput`。若自己写 effect，cleanup 必须 `destroy()`。

### 10. 把电话写进 innerHTML 或分析日志

掩码不防 XSS，也不该把 PII 放进 URL。React 文本节点即可。

## 组合

**React Hook Form。** 用 `Controller`，不要对同一 input 再 `register`。下面是形状，本 Demo 没有装 RHF。

```tsx
<IMaskInput
  inputRef={field.ref}
  value={field.value ?? ''}
  unmask
  mask="0000-0000"
  onAccept={value => field.onChange(String(value ?? ''))}
  onBlur={field.onBlur}
/>
```

`inputRef` 指向真实 input。组件 `ref` 可能是 mask 实例。`field.value` 必须和 `unmask` 同一形态。服务端 422 用 `setError`，不要改 mask 来假装通过。

**decimal.js 与 Query。** IMask 管外观，decimal 管运算，Query 管服务端副本。服务器回填不要在用户正在输入时覆盖 DOM。只在切换记录或明确重置时写回。

**date-fns。** `validCalendarDay` 只回答公历这一天是否存在。时区和时刻用 C14，不要让日期掩码输出一个无偏移的 `Date`。

## 生产清单

- 业务值只来自 `onAccept`。
- 重置才换 key。
- 金额不进 JS 浮点账本。
- 日期掩码之后做公历检查。
- label 关联 input。错误用 `aria-invalid` 和 `aria-describedby`。状态用 `role="status"`。Lab 的日期语义行已经用了 status。
- 不要在 render 里读 `window` 创建 mask。SSR 只输出 HTML，客户端再挂上。本 Demo 没有水合证据。
- 粘贴、中间插入、撤销、自动填充要在目标浏览器里看。v7.3 的 IME 说明不能代替 iOS 中文输入验收。

## 升级

7.6.1 与研究笔记一致。跨 mask 类型仍不要 `updateOptions` 硬切。升级后回归：unmask 形态、小数位、`2026-02-30`、重置是否丢焦点、中文备注是否仍是普通 input。

## 练习

1. 在编号中间插入一位，光标留在插入点附近，而不是跳到末尾。
2. `2026-02-30` 与 `2024-02-29` 的语义行相反。
3. 金额 `1.20` 与 `1.2` 的存储字符串写进测试，不依赖视觉上的补零。
4. 把中文备注错套成数字 mask，确认候选被破坏；然后改回普通 input。

## 官方链接

- https://imask.js.org/guide.html
- https://imask.js.org/api/modules/react_imask.html
- https://github.com/uNmAnNeR/imaskjs

## 证据

`calendar-policy` 单测不创建 IMask。sdk 要真实 import `react-imask@7.6.1` 并在 `docs/library-lab/evidence/runs/` 留下收据。光标和 IME 属于 browser，没有收据就保持 NOT_RUN。

GitHub Actions 41779873259 是仓库级安装、typecheck、build、52 个 SDK 文件（153 项测试）和 45 项 Playwright 的结果，不是 C06 的条目 PASS。不要改 `verification.json`。
