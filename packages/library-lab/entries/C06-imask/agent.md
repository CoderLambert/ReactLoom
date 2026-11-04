# C06 IMask — 工程手册

## 适用

编号、金额外观和「像日期」的逐键格式。中文自由文本不要套掩码。掩码不证明业务合法。

## 版本

`imask@7.6.1` 与 `react-imask@7.6.1`，MIT。业务值走 `onAccept`。`unmask` 决定 state 里是数字串还是带分隔符的视图。

## 迁移

带走 `examples/example.tsx` 和 `examples/calendar-policy.mjs`。金额离开 UI 之前改为十进制库或整数分。日期继续用 `validCalendarDay`，不要用掩码填满代替公历。RHF 只用 `Controller` + `inputRef` + `onAccept`。

## 不可删的清理

`key` 只在重置或更换 mask 类型时变化。不要在 `onAccept` 里改 key。若手写 `IMask(element)`，effect 清理必须 `destroy()`。不要在组合中的中文框上套数字 mask。

## 反例

```tsx
<IMaskInput mask="0000-0000" onChange={e => setRaw(e.target.value)} key={raw} />
```

- `type="number"` 加前导零。
- `onComplete` 直接提交。
- `typedValue` 用 `+` 做金额。
- `validate` 拒绝尚未填完的前缀。
- `input.value = next` 绕过模型。
- 把电话号码写进 HTML 或日志。

## 测试断言

- `0000-0000` 且 `unmask` 时，state 不含连字符。
- Number mask 的 state 不含千分位逗号。
- `2026-02-30` 为假，`2024-02-29` 为真，空串不是「无效日期」的同一种结果。
- 公历实现不把年份 0–99 折进 1900 年代。
- 策略单测没有挂载 `IMaskInput`。

## 真实限制

没有服务端，没有 RHF，没有动态 mask dispatch。光标、粘贴、自动填充和中文 IME 需要浏览器收据。`scale: 2` 不是财务精度。

## 证据

没有收据不要写 PASS。Actions 41779873259 不是本条目。不要改 `verification.json`。
