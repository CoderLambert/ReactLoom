# C20 clsx — Agent 实施手册

## 选型
用于 className 条件组合；不负责样式定义、Tailwind 冲突、表单验证或状态管理。版本基线 clsx 2.1.1，MIT。先查 library.json 与 verification.json，不能继承历史 PASS。

## 最小迁移
读取 `examples/example.tsx`，依赖只有 React 和 clsx；`examples/demo.tsx` 是 Lab 适配出口。实际产品只复制必要的状态映射，不复制实验页全部控件；保留与状态匹配的 disabled/aria-pressed 和文本反馈。样式类需在目标项目定义。

## 推荐模式
使用有限 union 状态映射。直接在渲染中计算 className。不把派生字符串同步进 useEffect/state。不向 clsx 传入任意远端对象。lite 只用于字符串条件表达式。采用 tailwind-merge 时分别核对 Tailwind 和 tailwind-merge 兼容版本。

## 必须断言
未选中没有选中类；选中后有对应类及 aria-pressed；禁用原生按钮确实不能执行操作；falsy 输入不变成字符串 false/null；不要断言 CSS 优先级等于类名排列顺序。

## 命令与证据
在仓库根运行 `pnpm --filter @reactloom/library-lab test:sdk`、`typecheck`、`build`；对应浏览器文件 `e2e/library.spec.ts`。目标 SDK 不可 mock 后记 PASS。当前真实 SDK、生产构建与浏览器仍未通过本环境验证。

## 来源
https://github.com/lukeed/clsx

## 第22轮有限类名白名单

复制示例时连同 `examples/class-policy.mjs` 和声明使用，避免把服务端任意 tone/状态直接拼成类名；采用确定的有限状态映射后再调用 clsx。永远同步 button 的 disabled 和 aria-pressed 等原生语义。新增真实 `clsx`/lite SDK 测试源码但尚未运行，不能用纯策略测试替代。
