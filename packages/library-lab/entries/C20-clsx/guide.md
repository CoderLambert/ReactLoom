# clsx 2.1.1｜条件类名，不负责冲突和权限

Lab 锁定 `clsx@2.1.1`（MIT）。它把真值拼成一条 `className` 字符串。它不去重，不看 CSS 优先级，不合并 Tailwind，也不知道 `disabled` 这个类是否应该让按钮真的禁用。

没有收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 不是本条目 PASS。

## Lab 当前示例

[`examples/example.tsx`](examples/example.tsx) 同时导入完整的 `clsx` 和 `clsx/lite`。业务类先经过 [`class-policy.mjs`](examples/class-policy.mjs) 的 `cardClassInputs`，再展开给 `clsx`。`demo.tsx` 只做再导出。没有独立的 `npm run dev` 站点。

- **basic**：选中和禁用两个复选框。输出展示 `clsx` 的实际字符串。卡片上的按钮另有原生 `disabled` 和 `aria-pressed`。类名不是这两件事的替身。
- **business**：增加 `tone` 下拉框，只允许 `neutral`、`success`、`warning`。策略函数把后两者映射成 `tone-success` 或 `tone-warning`。其它值变成 `null`，clsx 会丢掉它。
- **advanced**：额外展示一组边界：`clsx('px-2', false, null, undefined, 0, 1, ['px-4', { active: true, inactive: false }])`，以及 `lite` 只保留真值字符串。数字 `1` 会变成 `"1"`，`0` 被丢掉。`px-2` 和 `px-4` 同时保留。说明文字写明 lite 不是完整 clsx 的透明替换，Tailwind 冲突要交给 C21。

`cardClassInputs` 返回 `['demo-card', { 'is-selected': ..., 'is-disabled': ... }, tone]`。对象的键在值为真时进入结果，值本身不会进入结果。

## 什么时候用

组件有若干布尔状态，要拼到已有的类名上。只有一个字符串时直接写 `className`。Tailwind 工具互相覆盖时用 `twMerge(clsx(...))`，见 C21。CSS Modules 的 `classnames/bind` 不会因为换成 clsx 就自动映射哈希类名。

clsx 没有订阅，没有定时器，没有需要在卸载时销毁的实例。成本大约是输入节点数加上结果字符串的长度。它不保护循环引用和特别深的数组。

## 数据与模型

对 2.1.1 的运行时，可以按下面的规则读结果。类型声明和运行时不完全一样：`ClassValue` 允许 `bigint`，但实现不会把 `bigint` 收成类名。不要传 `1n`。

1. 多个参数按顺序检查。`false`、`0`、`NaN`、`''`、`null`、`undefined` 不产生输出。
2. 字符串原样写入。真值数字变成十进制字符串。`2` 得到 `"2"`。`0` 在真值判断时已经被丢掉，所以不能靠 `clsx(0)` 得到 `"0"`。
3. 数组递归展开，片段之间加空格。
4. 普通对象用可枚举的键。值为真时追加**键名**。`'false'` 这种非空字符串是真，所以 `{ active: 'false' }` 会得到 `active`。
5. 对象枚举包括原型链上可枚举的键。不要把接口 JSON 直接传进去。
6. 单独的布尔、函数不产生类名。
7. 不去重。`clsx(['a', 'a'])` 是 `"a a"`。
8. `clsx/lite` 只保留真值字符串。对象、数组和数字被静默忽略，不抛错。

顺序不是 CSS 优先级。`clsx('px-2', 'px-4')` 得到 `"px-2 px-4"`。哪一条生效取决于样式表、层和特异性。Tailwind 的冲突分组要另做。

类名也不是业务状态。按钮能不能点，看 `disabled` 属性。是否按下，看 `aria-pressed` 或数据。不要 `className.includes('is-disabled')` 再决定要不要提交。

## 三层示例

### 基本

勾选「选中」。输出里出现 `is-selected`，按钮 `aria-pressed` 为真。勾选「禁用操作」。输出里出现 `is-disabled`，并且按钮的 `disabled` 属性为真。只改类、不改属性，键盘仍能点到按钮。

### 业务

切到「已归档」和「待审核」，输出分别带 `tone-success` 和 `tone-warning`。切回「普通」，没有 `tone-neutral`。策略函数不给未知语气造类名。不要把下拉框改成自由文本后再拼 `` `tone-${server}` ``。

### 进阶

看 `<pre>` 里的 `full`、`lite`、`truthy-number`、`zero-ignored` 和 `tailwind-not-merged`。`lite('base', selected && 'selected')` 在选中时是字符串条件，这是 lite 能做的形状。`lite({ active: selected })` 不会得到 `active`。`px-2` 与 `px-4` 两个都在。若视觉上必须只留后者，这里还没有调用 `twMerge`。

## 反例

### 1. 字符串 'false' 当布尔

```ts
clsx({ active: 'false' }) // "active"
```

用 `clsx({ active: isActive === true })`。策略函数已经用 `=== true`。

### 2. 想输出数字 0

```ts
clsx(0) // ""
```

需要字符时用 `clsx(String(0))`。一般的类名里不应该出现这个需求。

### 3. 用 lite 传对象

```ts
import { clsx as lite } from 'clsx/lite'
lite({ active: true }) // ""
```

完整版用默认导入。lite 只写 `lite(active && 'active')`。

### 4. 以为后者覆盖 Tailwind

```ts
clsx('px-2', 'px-4') // "px-2 px-4"
```

冲突交给 `twMerge`。自定义 token 还要配置 tailwind-merge，见 C21。

### 5. 以为会去重

```ts
clsx('card', 'card') // "card card"
```

若设计系统要求唯一，在自己的 token 列表里处理。clsx 不改语义。

### 6. 把响应对象直接传入

```ts
clsx(await response.json())
```

可枚举的键，包括继承来的，都可能变成类。先映射到自己的普通对象。`cardClassInputs` 就是这道门。

### 7. 拼接后端状态

```ts
clsx('badge-' + backendStatus)
```

未知状态会变成任意类，甚至打断属性。用有限枚举，缺省回退到空。

### 8. 深递归不可信数组

实现是递归。循环引用会撑栈。业务输入先限制深度，再交给 clsx。

### 9. 用类名判断能不能操作

```ts
if (className.includes('is-disabled')) return
```

类可以被改掉。看数据里的 `disabled` 和原生属性。

### 10. 全局把 classnames/bind 换成 clsx

CSS Modules 需要 `styles[key]`。`bind` 的键映射不会自动出现。先列调用点，再换。

### 11. bigint

类型上能过，运行时没有类名。不要用 `1n` 当开关。

### 12. 服务端字段当 tone

即使过了 TypeScript 的字符串索引，仍要走 `cardClassInputs` 那种白名单。`success` 以外的值不是 `tone-success`。

## 组合

**tailwind-merge。** `twMerge(clsx(...))` 先拼条件，再按 Tailwind 分组丢掉冲突。顺序因此才变得有意义。单独的 clsx 没有这一步。本 Demo 的 advanced 故意把未合并的结果印出来。

**CSS Modules。**

```ts
clsx(styles.card, selected && styles.selected)
```

传入的是已经映射好的类字符串。不要 `clsx({ selected })` 再指望构建工具把键改成哈希。

**设计系统。** `demo-card`、`is-selected`、`is-disabled`、`tone-*` 是本示例允许的集合。调用方可以加自己的布局类，但语气和状态仍走策略函数。C21 讨论覆盖接口时，默认类和外部类要分清谁在后面。

## 生产清单

- 状态类来自白名单对象，不来自字符串拼接。
- 交互状态同时写在 DOM 属性上。
- 不把 JSON 响应传给 clsx。
- lite 和完整版不要混用同一种调用形状。
- Tailwind 冲突不要停在 clsx。
- 不靠类名做安全判断。
- 不把 clsx 的结果写进 `innerHTML`。

## 升级

2.1.1 的对象枚举和数字规则如上。升级小版本后用 advanced 那组输入做回归：`0`、`1`、`null`、嵌套数组、lite 忽略对象、两条 `px-*` 同时存在。不要换成一个「功能类似」的自写函数还继续叫 clsx。

`cardClassInputs` 返回数组，里面的对象只含两个布尔键。clsx 展开后，真键变成类名，假键消失，`null` 语气消失。不要再在 JSX 里写第二套 `` tone-${tone} ``。两套同时存在时，白名单就失效了。

advanced 的 `edge` 把假值、数字和嵌套数组放进同一次调用，用来对照文档，不是卡片的业务类。业务卡片只应出现 `demo-card`、两个 `is-*` 和可选的 `tone-*`。

## 练习

1. 选中且禁用时，输出同时包含两个状态类，按钮同时有 `aria-pressed` 和 `disabled`。
2. 传入 `tone: 'danger'` 给 `cardClassInputs`，结果里没有 `tone-danger`。
3. `clsx(0)` 为空，`clsx(1)` 为 `"1"`，`lite({ a: true })` 为空。
4. `clsx('px-2', 'px-4')` 含有两段。若要只留 `px-4`，改到 C21 再测。

## 故障排查

| 现象 | 先看 |
| --- | --- |
| 明明传了 false 字符串，类还在 | 值是 `'false'`，不是布尔 false |
| 想要的 `"0"` 没出现 | 数字 0 被当成假。用字符串 |
| lite 什么都没输出 | 传了对象或数组。lite 只留真值字符串 |
| `px-4` 没有盖住 `px-2` | clsx 两段都留着。这不是 bug，合并在 C21 |
| 类名里出现奇怪的键 | 对象来自 JSON 或原型链。改走白名单 |
| 按钮看起来灰了但仍能提交 | 只加了 `is-disabled` 类，没有 `disabled` 属性 |
| CSS Modules 类名是原文 | 把逻辑键交给了 clsx，没有先取 `styles[key]` |
| 栈溢出 | 循环引用或过深数组。先限制输入 |

对象枚举用的是 `for...in`。键为真时写入的是键，不是值。数组会递归。函数和单独的布尔没有类名。`ClassValue` 类型包含 `bigint`，`toVal` 不处理它，所以 `clsx(1n)` 不是 `"1"`。

不要根据结果字符串里有没有某个 token 来做权限判断。服务端状态和 DOM 属性才是事实。把 clsx 的输出写进 `innerHTML` 同样多余，React 的 `className` 已经是属性。

升级或替换实现时，用 advanced 那组输入当回归：假值、数字 1、数字 0、嵌套数组、对象里的假值、lite、两条 padding。少任何一条都可能把「功能类似」的函数误当成 2.1.1。

## 官方链接

- https://github.com/lukeed/clsx

以标签 `2.1.1` 的 `src/index.js` 和 `clsx/lite` 为准。类型里有、运行时没有的 `bigint` 不要当成已支持。

卡片的 `<article className={result}>` 使用的就是这次 `clsx` 的返回值。改策略函数而不改输出区，或改输出区而不改 className，两边会不一致。advanced 的 `<pre>` 是另一组调用，不要把它的 `px-2` 当成卡片的类。`tone` 为 `neutral` 时策略返回 `null`，输出里不应出现 `tone-neutral` 或字符串 `"null"`。`clsx` 不会把 `null` 收成类名。若有人改成 `tone || 'tone-neutral'`，普通状态会一直带着语气类。

`lite` 的示例是 `lite('base', selected && 'selected')`。选中时结果含 `selected`，未选中时条件是 `false`，lite 把它丢掉。不要用这个输出驱动按钮的 `disabled`。

## 证据

`class-policy` 单测只检查白名单数组，不调用 `clsx`。sdk 要真实 import `clsx@2.1.1` 和 `clsx/lite`，并在 `docs/library-lab/evidence/runs/` 留下收据。

GitHub Actions 41779873259 是仓库级安装、typecheck、build、52 个 SDK 文件（153 项测试）和 45 项 Playwright 的结果，不是 C20 的条目 PASS。不要改 `verification.json`。
