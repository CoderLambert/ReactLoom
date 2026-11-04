# B09 shadcn/ui — 工程手册

## 适用

你愿意把组件源码放进仓库并自己做回归。要开箱中后台用 Ant Design 或 Mantine。大表和拖拽另选专用库，只用这套做皮肤。

## 版本

`class-variance-authority@0.7.1`、`@radix-ui/react-slot@1.5.0`、`clsx@2.1.1`、`tailwind-merge@3.7.0`。按钮是手写教学文件，不是 Registry 原文，也不是 Base UI 默认输出。`cn` 是本地 `twMerge(clsx())`。

## 迁移

带走 `examples/ui/button.tsx` 和 `examples/archive-policy.ts`。业务页参考 `examples/example.tsx` 的 epoch，不要复制样例文章。不要从 `shadcn-ui` 这个包名导入 Button。

## 不可删的清理

归档 timer 在卸载和 level 变化时增加 epoch 并 `clearTimeout`。`busy` 期间不要改选中集合。`asChild` 只接收一个子元素。disabled 保持不能点击。

## 反例

- 把 shadcn 当成运行时依赖。
- 字符串拼接 class，不用 tailwind-merge。
- Radix 组件配 Base UI 的 data 属性。
- 过期 `setTimeout` 仍 `setState`。
- 用按钮 hover 冒充拖拽或表格行模型。
- 覆盖变体后不看对比度和焦点环。

## 测试断言

- 变体闭集；传入 class 能覆盖冲突的间距类，而不是两套都留下。
- 已归档 id 不会再次进入待归档列表。
- epoch 变化后旧回调不写状态。
- disabled 按钮不能触发归档。
- 键盘能看见焦点环。

## 真实限制

没有 Dialog、没有 CLI 安装记录、没有服务端。官方默认基座可能已是 Base UI，和本文件不一致。MIT 不覆盖你另加的图标和字体。

## 证据

没有收据不要写 PASS。策略测试不是浏览器或 Registry 一致性证明。
