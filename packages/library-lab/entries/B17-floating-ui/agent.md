# B17 Floating UI — 工程手册

## 适用

要自己组合定位和交互原语。现成菜单优先 Radix 或 Base UI。本库不提供业务「已读」模型。

## 版本

`@floating-ui/react@0.27.20`，MIT。

## 迁移

带走 `examples/example.tsx`、`examples/ime-guard.ts`、`examples/business-policy.ts`。保留 `useFloating`、middleware、`whileElementsMounted: autoUpdate`、interactions、Portal、非模态 FocusManager。`demo.tsx` 不迁移。

## 不可删的清理

浮层和参考节点条件卸载。关闭和卸载时同步递增 `clipboardRequest`，使旧的 `writeText` 不能再 `setState`。IME 守卫留在 ref 上。`returnFocus` 保持。卸载时不要留下 document 级监听；这些监听由 Floating UI 的 cleanup 负责，不要再包一层不对称的全局监听。

## 反例

- 不卸载却继续 autoUpdate，或卸载后仍更新。
- 把 Portal 当成焦点管理；或把非模态改成模态还不处理滚动。
- 在 effect 里才作废剪贴板。
- 只判断 `isComposing`。
- 复制失败仍显示成功。
- 过滤只改提示文字，不改列表。
- 和另一个弹层同时处理 Escape。

## 测试断言

- placement 在空间不足时改变，浮层留在视口内并有 12px padding。
- Escape 和外部点击关闭，焦点回到按钮。
- 稍后阅读切换的是布尔状态。
- 关闭后的剪贴板 Promise 不写 alert，也不写成功。
- 合成中、keyCode 229、刚结束的那次 Enter 不调用过滤。
- 已提交查询和输入框草稿可以不同。

## 真实限制

没有 VirtualElement，没有真实权限以外的剪贴板测试。`modal={false}` 不是对话框陷阱。单测不覆盖 Portal。

## 证据

没有 `docs/library-lab/evidence/runs/` 收据，sdk / build / browser 不是 PASS。
