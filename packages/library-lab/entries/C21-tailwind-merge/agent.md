# C21 tailwind-merge — 工程手册

## 适用

Tailwind 工具类的冲突覆盖。条件拼接用 clsx。不要用正则删类，不要把未知用户字符串拼进工具类。

## 版本

`tailwind-merge@3.7.0` 与 `clsx@2.1.1`，MIT。示例使用默认 `twMerge` / `twJoin`，没有 `extendTailwindMerge`。

## 迁移

带走 `examples/example.tsx` 的 `cn`。保持 `twMerge(clsx(...))` 这一顺序。调用方的 `className` 放在默认类后面。自定义 token 要先写分组和冲突样例，再扩展配置。

## 不可删的清理

没有订阅要卸载。模块级复用 `twMerge`，不要在渲染里反复创建扩展配置。覆盖接口不要在 merge 之后再拼接一条默认 `px-*`。

## 反例

```ts
classes.replace(/\bpx-\S+/g, '')
twJoin('px-2', 'px-6')
clsx(twMerge('px-2'), twMerge('px-6'))
twMerge('bg-white', `bg-${userColor}`)
```

- 认为 `md:p-6` 会删掉 `p-4`。
- 认为 `px-3` 然后 `pr-4` 等于把 `px-3` 整段删掉。
- 把合并结果当成 CSS 已经生成。

## 测试断言

- 同组 `px-*` 只留后面的一个。
- `pr-*` 与后面的 `px-*` 的方向覆盖和相反顺序不同。
- 相同修饰符才互相合并。
- `hover:bg-*` 只留后者。
- 这些断言要调用真实 `twMerge` 才算 sdk，目视卡片不够。

## 真实限制

没有项目自定义 token 配置。输入框接受任意类名，只用于对照字符串，不是安全的用户主题系统。浏览器里是否加载了对应 CSS，要单独看。

## 证据

没有收据不要写 PASS。Actions 41779873259 不是本条目。不要改 `verification.json`。
