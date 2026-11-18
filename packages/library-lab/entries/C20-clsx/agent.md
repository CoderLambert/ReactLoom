# C20 clsx：工程接入要点

`clsx@2.1.1`，MIT。将组件的条件片段组合为 `className`，适合已有样式、需要根据布尔状态或有限变体选择类名的组件。只有固定字符串时直接赋值；需要 Tailwind 冲突消解时组合 C21 的 tailwind-merge。

## 机制与最小调用

```tsx
import clsx from 'clsx';

const className = clsx('card', {
  'is-selected': selected,
  'is-disabled': disabled,
});
```

字符串保留，数组递归展开，对象值为真时保留键名；假值被忽略，真值数字转为字符串。不会生成 CSS、去重、合并冲突或设置 DOM 属性。`clsx/lite` 只保留字符串参数；本例的对象映射不能仅替换为 lite。

## 本例与迁移

一个 basic 实验分两部分：卡片可切换选中/禁用/语气并显示实际输入和结果；固定预设向 full/lite 传入同一组参数，比较字符串、对象、数组、数字和重复类。

- `examples/example.tsx`：真实 clsx 调用与 React 状态。
- `examples/class-policy.mjs` 及 `.d.mts`：业务有限映射。严格 `true` 才开启状态，`success` / `warning` 映射到固定类，其余语气为 `null`。
- `examples/class-names.css`：完整演示样式，以 `.clsx-lab` 限定作用域。
- `examples/comparison-presets.mjs` 及 `.d.mts`：页面与 SDK 测试共用的固定输入数据。
- `examples/demo.tsx`：仅供 Lab 宿主使用的再导出。

完整复制实验时保留以上相对路径，在已有 React 应用安装 clsx 并挂载默认组件。业务接入可删去比较面板和教学预设，保留业务状态映射及对应样式。无需 Tailwind、后端或 Lab 全局 CSS。没有实例、监听或定时器需要清理。

## 必须保留的边界

- 状态以 React 数据为准。按钮保留原生 `disabled` 与 `aria-pressed`，不能从类名字符串反推是否允许操作。
- 外部语气值先走有限映射，不能拼接任意服务端 CSS 字段。clsx 不负责输入校验；不要将整个外部对象直接传入。
- CSS Modules 传 `styles.card` 等已映射的值。Tailwind 冲突另用 `twMerge(clsx(...inputs))`，不能按字符串顺序推断 CSS 优先级。
- 2.1.1 类型允许 bigint，但运行时不会把 bigint 转成类名；对象的 `for...in` 还会枚举原型链键，优先传本地构建的普通对象。
- 页面只展示有限预设，不执行文本输入代码。输入输出字符串通过 React 文本节点显示。

## 验证要点

窄检查从仓库根执行：

```sh
pnpm exec node --test packages/library-lab/entries/C20-clsx/tests/sdk.test.mjs packages/library-lab/entries/C20-clsx/tests/class-policy.test.mjs
```

SDK 套件真实导入 `clsx` / `clsx/lite`，覆盖页面预设的两组返回值及卡片白名单。策略测试只验证映射，不能代替 SDK 执行。

浏览器操作：选中后出现蓝边与 `is-selected`；禁用后显示虚线、按钮无法点击；切换语气后背景与类名一致。对象/数组预设应出现 full/lite 差异，重复工具类预设应全部保留。预设不加载 Tailwind，因此不证明工具类最终像素。

正式 sdk / build / browser 状态分别遵守收据与指纹协议；当前工作区里的窄检查不自动改写 `verification.json`。
