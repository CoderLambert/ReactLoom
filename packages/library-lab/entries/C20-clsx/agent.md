# C20 clsx — 工程手册

## 适用

把布尔和白名单类名拼成一条字符串。不合并 Tailwind，不去重，不表达禁用或权限。

## 版本

`clsx@2.1.1`，MIT。完整导入和 `clsx/lite` 行为不同。不要传 `bigint`。不要把接口对象直接交给它。

## 迁移

带走 `examples/example.tsx` 和 `examples/class-policy.mjs`。状态类继续走 `cardClassInputs`。按钮保留 `disabled` 和 `aria-pressed`。需要覆盖 `px-*` 时改用 C21 的 `twMerge`，不要在这里手写正则删类。

## 不可删的清理

没有实例要销毁。不要在渲染外缓存一份 className 当永久状态。语气枚举以外的值必须变成 `null`。不要为了「像 clsx」而改用字符串拼接。

## 反例

```ts
clsx({ active: 'false' })
clsx(0)
lite({ active: true })
clsx('badge-' + status)
clsx('px-2', 'px-4')
```

- 用 `className.includes` 决定是否提交。
- 把 JSON 响应当对象参数。
- 用 lite 替换所有对象调用。
- 把 `classnames/bind` 全局替换成 clsx 却不映射 CSS Modules。

## 测试断言

- `selected` / `disabled` 只有严格 `true` 才产生对应键。
- `tone` 只有 `success` 和 `warning` 映射到固定类名。
- `0` 不产生类，真值数字会变成数字字符串。
- lite 忽略对象。
- `px-2` 与 `px-4` 同时保留。
- 策略单测没有执行 clsx。

## 真实限制

示例不加载 Tailwind 编译器。advanced 的预览只证明字符串，不证明最终像素。没有 CSS Modules。原型链投毒需要调用方不要传入外来对象，库本身不隔离。

## 证据

没有收据不要写 PASS。Actions 41779873259 不是本条目。不要改 `verification.json`。
