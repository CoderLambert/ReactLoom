# clsx：把组件状态组合成 className

卡片同时有“选中”“禁用”“提示语气”时，手写模板字符串容易留下多余空格，也容易把分支散落在 JSX 中。`clsx@2.1.1`（MIT）把字符串、条件对象和数组组合为一个字符串，适合已有 CSS 类、需要按状态选择类名的 React 组件。它是纯函数，不管理 React 状态，也不生成样式。

只有一个固定类名时直接写 `className` 即可。需要一套可复用的尺寸、语气和组合变体接口时，可以在 clsx 之上封装变体函数；需要消解 Tailwind 工具类冲突时，再组合 tailwind-merge（C21）（C21）。

## 最小接入

```tsx
import clsx from 'clsx';

const selected = true;
const disabled = false;
const className = clsx('card', {
  'is-selected': selected,
  'is-disabled': disabled,
});
// 'card is-selected'

<button className={className} disabled={disabled} aria-pressed={selected}>
  收藏文章
</button>;
```

对象里值为真的**键名**进入结果。`is-selected` 的样式由 CSS 定义；原生 `disabled` 控制按钮能否操作，`aria-pressed` 表达开关状态。添加一个类不会替你设置这些属性。

## 互动实验：状态与输入边界

本条目只有一个完整实验，[运行源码](examples/example.tsx) 真实导入 `clsx` 与 `clsx/lite`，两部分始终可操作。所有数据来自本地状态或固定预设，没有后端请求。

### 1. 从状态到卡片样式

卡片调用 `clsx(...cardClassInputs({ selected, disabled, tone }))`。输入面板显示这一次调用的参数，输出面板显示返回字符串，卡片直接把同一字符串赋给 `className`。

| 操作 | 可观察结果 |
| --- | --- |
| 勾选“选中”，或点击“收藏文章” | 输入中的 `is-selected` 为 `true`；结果增加 `is-selected`；卡片出现蓝色边框，按钮的 `aria-pressed` 为 `true` |
| 勾选“禁用操作” | 结果增加 `is-disabled`；卡片边框变为虚线，按钮灰显且无法点击；其他状态控件仍可操作 |
| 语气选“已归档”或“待审核” | 结果增加 `tone-success` 或 `tone-warning`，卡片背景和状态文字随之变化 |
| 语气切回“普通” | 输入末项为 `null`；结果移除语气类，恢复普通背景 |

这些样式由随示例提供的 [class-names.css](examples/class-names.css) 定义，无需 Tailwind 或 Lab 的全局样式。语气文字由 React 状态渲染，clsx 只负责类名字符串。

### 2. full / lite 同输入对照

下拉框选择 [固定输入预设](examples/comparison-presets.mjs)。两个输出分别执行 `clsx(...preset.inputs)` 与 `lite(...preset.inputs)`；引号仅用于清楚显示字符串边界。

| 预设 | 完整版实际返回值 | lite 实际返回值 | 要观察的机制 |
| --- | --- | --- | --- |
| 字符串与条件结果 | `card is-selected` | `card is-selected` | 两者保留字符串，忽略 `false` 与空字符串 |
| 对象状态映射 | `card is-selected` | `card` | 完整版选择真值键名；lite 忽略整个对象 |
| 嵌套数组 | `card is-selected tone-success` | `card` | 完整版递归展开；lite 忽略整个数组 |
| 数字与空值 | `card 1` | `card` | 完整版接收真值数字；两者忽略 `0`、`null`、`undefined`、`false` |
| 重复与 Tailwind 冲突 | `px-2 px-4 px-4` | `px-2 px-4 px-4` | 两者都不去重、不解释 CSS 工具类 |

表格由真实 SDK 回归断言覆盖，浏览器面板会重新计算返回值。这个预设不加载 Tailwind，因此只能观察字符串保留规则，不能据此判断最终 CSS 覆盖效果。

## 机制：JavaScript 先求值，clsx 再组合

`selected && 'is-selected'` 先由 JavaScript 得到字符串或 `false`，再传入 clsx。clsx 按参数顺序处理输入，非空片段间加入一个空格：

- 字符串原样保留；真值数字转成字符串。数字 `0` 被忽略，字符串 `'0'` 会保留。
- 数组递归处理；对象中值为真的键名加入结果。因此 `{ active: 'false' }` 仍产生 `active`，非空字符串是真值。
- `false`、`null`、`undefined`、空字符串、`0` 和 `NaN` 不产生片段。单独的布尔值也不产生类名。
- `lite` 只处理字符串参数；对象、数组和数字被忽略。即使类型检查允许同一种参数，也不代表运行结果相同。

本例卡片传入对象，所以不能仅替换 import 为 `clsx/lite`。只有所有调用都使用字符串及条件结果时，才适合选择 lite。

2.1.1 的类型包含 `bigint`，安装包实现没有把它转成类名；避免依赖 `clsx(1n)`。对象实现使用 `for...in`，也会看到原型链上的可枚举键。将来自接口的对象先转为本地需要的字段，再交给 clsx。

## 业务状态先做有限映射

[cardClassInputs](examples/class-policy.mjs) 是本示例自建的业务策略：只有严格的布尔 `true` 开启状态类，只有 `success` 和 `warning` 映射为固定语气类，其余语气产生 `null`。clsx 随后负责组合这些已选定的片段。

```ts
clsx(...cardClassInputs({ selected: true, disabled: false, tone: 'success' }));
// 'demo-card is-selected tone-success'

clsx(...cardClassInputs({ tone: 'hidden fixed' }));
// 'demo-card'
```

有限映射让组件只暴露约定的视觉状态，避免接口字段意外改变布局。clsx 自身不会校验类名，也不会清洗输入。React 的 `className` 将结果写入类属性；这里的风险是接受了不受控的样式 token，不能把它描述成类名会自动注入其他 HTML 属性。

## 与现有样式体系组合

**普通 CSS / CSS Modules。** 普通 CSS 直接传类名。CSS Modules 先取构建工具生成的字符串，再传入 `clsx(styles.card, selected && styles.selected)`；clsx 不负责将逻辑键映射成哈希类名。

**Tailwind。** `clsx('px-2', 'px-4')` 返回两个类。需要提供调用方覆盖默认类的接口时，使用 `twMerge(clsx(...inputs))`，并单独验证 tailwind-merge 版本与项目 Tailwind 配置。类在字符串中的先后并不能单独决定 CSS 层叠结果。

**变体 API。** 少量条件可以保持本例的有限映射；当尺寸、语气、组合条件需要跨组件复用时，将映射提升为独立变体 API。clsx 仍只完成最终的条件组合。

## 迁入业务项目

已有 React 应用安装 `clsx@2.1.1`。直接复用此实验时，复制 `example.tsx`、`class-policy.mjs`、`class-policy.d.mts`、`comparison-presets.mjs`、`comparison-presets.d.mts` 和 `class-names.css`，保持相对路径后挂载默认组件。`demo.tsx` 只是 Lab 的再导出适配。

业务组件通常只需要 clsx 调用、有限状态映射和自己的 CSS；比较预设与输入输出面板是教学界面，可按需去掉。样式全部以 `.clsx-lab` 为作用域，迁移时保留包装类或同步修改选择器。这里没有实例、监听、定时器或持久化资源需要清理，卸载后本地 React 状态随组件释放。

## 核对与来源

- [clsx 官方使用说明](https://github.com/lukeed/clsx#readme)：完整输入与 `clsx/lite` 用法。
- 本例核对安装包 `clsx@2.1.1` 的 `dist/clsx.mjs`、`dist/lite.mjs` 和 `clsx.d.mts`；类型与运行时不一致之处以上面的实际实现规则为准。
- [SDK 回归](tests/sdk.test.mjs) 真实导入两个入口，验证卡片策略与页面使用的预设；[策略回归](tests/class-policy.test.mjs) 只验证有限映射。

浏览器验收需要按上面的操作逐项确认样式和原生按钮行为。正式验收状态以本条目的 `verification.json` 和匹配收据为准，Node 断言不能代替浏览器结果。
