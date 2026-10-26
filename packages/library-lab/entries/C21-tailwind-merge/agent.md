# C21 tailwind-merge — Agent 工程手册

## 什么时候选

Tailwind 组件有明确 `className` 覆盖 API 时使用；无冲突的类名拼接用 C20 clsx 即可。研究版本 tailwind-merge 3.7.0 / Tailwind v4.3 / MIT。真实构建状态详见 verification.json，未执行前不可当生产验证完成。

## 迁移

从 `examples/example.tsx` 只拷贝 `cn` 与目标组件的 className 合成模式。需要的直接依赖：`tailwind-merge@3.7.0` 与 `clsx@2.1.1`。`examples/demo.tsx` 不是生产依赖。

不要复制实验室全局 CSS 到目标应用；保留目标项目自己的 Tailwind 生成规则，并针对自定义 token 写合并测试。仅将可信的、经白名单限定的状态用于变体拼接。

## 易错边界

- `pr-4 px-3` -> `px-3`，但 `px-3 pr-4` 两者保留；保留方向性。
- `hover:bg-red-500 hover:bg-green-500` 按同 modifier 合并；普通 bg 不能混同 hover。
- `twJoin` 不会去冲突，不能当作 `twMerge`。
- `clsx` 的对象支持不同于 `twJoin`；只用 `twJoin` 处理对象是错误的。
- 自定义 Tailwind 令牌若不在默认分组中，审查 `extendTailwindMerge`，不要暗中删合法类。
- 不把用户/服务端任意字符串视为可信 CSS 类名，合并器不是 sanitizer。

## 验证合同

真实 SDK 断言 px/pr 双向非对称、同组冲突、响应式 modifier、状态条件；真实生产构建检查 Tailwind 生成的 CSS 及 React/键盘状态。运行 `pnpm --filter @reactloom/library-lab typecheck`、`build`、对应 Playwright。所有新示例验证仍 NOT_RUN。

## 一手参考

https://github.com/dcastil/tailwind-merge/blob/main/docs/api-reference.md
