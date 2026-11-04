# tailwind-merge 3.7.0｜按 Tailwind 分组留最后的冲突类

Lab 锁定 `tailwind-merge@3.7.0` 和 `clsx@2.1.1`（MIT）。`twMerge` 知道 Tailwind 的冲突组。`twJoin` 只拼接。`clsx` 负责条件。三者不要互相冒充。

没有收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 不是本条目 PASS。

## Lab 当前示例

[`examples/example.tsx`](examples/example.tsx) 调用真实的 `twJoin`、`twMerge` 和 `clsx`。`cn` 是 `twMerge(clsx(...))`，定义在模块顶层，避免每次渲染造一套配置。`demo.tsx` 只做再导出。没有第二台终端，也没有 `http://127.0.0.1:5173` 的独立站。

- **basic**：两个输入框。页面同时显示 `twJoin(base, override)` 和 `twMerge(base, override)`。默认 `px-3 pr-4` 再覆盖 `pr-8` 时，合并结果应留下后面的右边距，而不是两份 `pr-*`。
- **business**：卡片用 `clsx` 拼默认类、选中时的 `bg-green-100`、舒适尺寸的 `px-7 py-5`，再 `twMerge(composed, override)`。按钮有 `aria-pressed`。下面还演示 `cn('p-2', { 'p-4': selected, 'p-3': !selected })`。
- **advanced**：固定五组，都是当场执行的 `twMerge`：`px-2`/`px-6`，`pr-4`/`px-3` 两个方向，`md:p-2`/`md:p-6`/`p-4`，以及两个 `hover:bg-*`。说明写明它不是 CSS 编译器，也不认识未配置的自定义 token。

研究笔记里的 `extendTailwindMerge` 和项目主题扩展没有挂在这个文件里。默认类和外部类的先后顺序是当前要看的行为。

## 什么时候用

组件允许调用方用 Tailwind 类覆盖默认间距、颜色或排版，并且这些类属于库认识的分组。纯条件拼接用 clsx。没有 Tailwind 的类名用 clsx 即可，merge 不会按你的 CSS Modules 哈希去消冲突。

不要用正则删掉前面的 `px-`。`px-3` 和 `pr-4` 不是同一组里的完全替换，方向会留下另一边。

## 数据与模型

`twJoin` 把参数用空格接起来，真值过滤类似简单拼接。冲突类都还在。

`twMerge` 按分组决定谁留下来。后面的类赢，但是「赢」的范围是同一冲突组：

| 输入 | 应看到的关系 |
| --- | --- |
| `px-2` 然后 `px-6` | 只留 `px-6` |
| `pr-4` 然后 `px-3` | 后面的水平 padding 盖掉先前的右侧 |
| `px-3` 然后 `pr-4` | 左侧仍来自 `px-3`，右侧来自 `pr-4` |
| `md:p-2` 与 `md:p-6`，另有 `p-4` | 只合并同一修饰符下的冲突，无修饰的 `p-4` 还在 |
| 两个 `hover:bg-*` | 留下后面的 hover 背景 |

修饰符不会互相误删。`md:p-6` 不应吃掉无前缀的 `p-4`。`hover:` 也不和静止背景合成一组。

自定义 token、任意值以外的插件类，默认配置可能当成不相干的类同时保留。那不是合并器坏了，是分组里没有这条规则。要支持项目 token，用 `extendTailwindMerge` 声明分组，并用一组冲突样例测试。本 Demo 没有扩展配置。

`twMerge` 不生成 CSS，也不检查类名是否安全。把用户原文拼进 class 字符串，仍然是注入面。覆盖接口只接受你准备支持的工具类，或在设计系统边界说明「这是开发者写的 className」。

`cn` 的顺序是：先 clsx 处理布尔，再 merge。若写成 `clsx(twMerge(a), twMerge(b))`，两组结果又被当成普通字符串接上，冲突会复活。

## 三层示例

### 基本

改覆盖框为 `px-6`。join 的输出仍含默认里的 `px-3` 和 `pr-4`。merge 的输出不应同时保留两个 `px-*`。再改回 `pr-8`，确认 `px-3` 的左内边距还在。两个 `<output>` 的 test id 是 `tw-joined` 和 `tw-merged`。

### 业务

勾选已选中。背景类应从 `bg-slate-100` 变成只留 `bg-green-100`（若两者在同一背景色组）。切到舒适尺寸，`px-7 py-5` 替换默认的 `px-3 py-2`。覆盖框里的类最后参与 merge，所以它能压过卡片默认值。按钮的按下状态不靠类名判断。

`cn` 那一行在选中时是 `p-4`，未选中时是 `p-3`，不会两个 padding 都留下。

### 进阶

对照列表里的五句说明和 `<output>` 的实时结果。特别是两个方向的 `px`/`pr`：先全轴再单边，和先单边再全轴，结果不是简单地把前面的类全部删掉。响应式那一行应同时看到无修饰的 `p-4` 和 `md:p-6`。

## 反例

### 1. 用正则删前一个 px-

```ts
classes.replace(/\bpx-\S+/g, '')
```

会误伤 `md:px-2`、任意值和你不打算当成 padding 的名字。用 `twMerge`。

### 2. 只 twJoin 就当覆盖成功

```ts
twJoin('px-2', 'px-6') // 两份都在
```

视觉上谁生效交给 CSS 文件顺序，不稳定。覆盖接口用 `twMerge`。

### 3. 先 merge 再 clsx 拼接

```ts
clsx(twMerge('px-2'), twMerge('px-6'))
```

两段都是普通字符串，冲突不再被看。先条件，再一次 merge。

### 4. 认为任意类名都能互相覆盖

`foo-bar` 和自定义 `shadow-card` 若没有分组，会同时留下。要么扩展配置，要么不要承诺覆盖。

### 5. 修饰符被当成同一组

删掉 `p-4` 只因为后面有 `md:p-6`，断点以下的间距会丢。advanced 的样例就是为了挡住这件事。

### 6. 把用户搜索词拼进 class

```ts
twMerge('bg-white', `bg-${userColor}`)
```

这不是净化。颜色来自白名单映射后再 merge。

### 7. 每个组件 new 一份配置

默认 `twMerge` 可以复用。真要 `extendTailwindMerge`，把结果放在模块级常量，不要放进渲染。

## 组合

**clsx。** 条件布尔交给 clsx，冲突交给 twMerge。`cn` 已是这个顺序。C20 的 advanced 故意展示未合并的 `px-2 px-4`，用来对照。

**设计系统。** 组件文档写清哪些属性是类名逃生口。默认类放在前面，调用方的 `className` 放在最后。不要在内部再追加一条默认 `px-*`，否则调用方的覆盖会被自己人吃掉。

## 生产清单

- 覆盖路径使用一次 `twMerge`。
- 不手写删除类名的正则。
- 自定义 token 有分组测试后再扩展。
- 用户输入不直接变成工具类。
- `cn` 保持 clsx 在前、merge 在后。
- 不把合并结果当成已经生成的 CSS。

## 升级

3.7.0 面向当前 Tailwind v4 的分组。升级后重跑 advanced 的五组，尤其是 `px`/`pr` 的两个方向和 `md:` / `hover:`。不要用旧主版的分组假设解释 v4 的新工具。

## 练习

1. join 与 merge 对 `px-3 pr-4` + `pr-8` 的字符串不同。
2. `px-2` + `px-6` 只留后者。
3. `px-3` + `pr-4` 与 `pr-4` + `px-3` 的结果不同。
4. `md:p-2` + `md:p-6` + `p-4` 仍保留无修饰的 `p-4`。
5. 选中卡片时两个背景色类不要同时留在 `tw-business` 的输出里。

## 官方链接

- https://github.com/dcastil/tailwind-merge
- https://github.com/dcastil/tailwind-merge/blob/main/docs/api-reference.md

## 证据

本条目没有单独的策略单测文件。sdk 仍要真实 import `tailwind-merge@3.7.0` 并在 `docs/library-lab/evidence/runs/` 留下收据。屏幕上最终像素还要 browser，字符串合并本身不等于样式表已加载。

GitHub Actions 41779873259 是仓库级安装、typecheck、build、52 个 SDK 文件（153 项测试）和 45 项 Playwright 的结果，不是 C21 的条目 PASS。不要改 `verification.json`。
