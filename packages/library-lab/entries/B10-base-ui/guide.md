# Base UI 1.9 — 复选框、混合态与原生 FormData

## 库是什么

Base UI 是开源、无预制视觉皮肤、注重交互语义的 React 组件原语。它不是 `@mui/material` 的主题系统，不能把它与原本旧版 MUI Base v5 的 API 混用。本示例聚焦 `@base-ui/react/checkbox`，结合权限管理演示 Root、Indicator、混合态、disabled 和真实表单序列化。与 B11 Radix 都是 Headless，可从授权维护/样式所有权与交互模型选择，**不要两个体系混在同一个基础组件层**。

## 安装和源码

```bash
pnpm add @base-ui/react@1.9.0
```

```tsx
import {Checkbox} from '@base-ui/react/checkbox';
<label>
  <Checkbox.Root checked={checked} onCheckedChange={setChecked}>
    <Checkbox.Indicator>✓</Checkbox.Indicator>
  </Checkbox.Root>
  接收通知
</label>
```

完整的可运行版本 `examples/example.tsx`、`examples/checkbox.css`、`examples/demo.tsx`。目前只声明一个包，且支持按需动态加载，不把整个 Base UI 的全部组件当成本 Demo。

## 三层场景

**basic**：Root 默认渲染 span 与关联隐藏 input，外层 label 提供可访问名称。**business**：3 个独立权限点和一项父级全选；全选策略由 React 管理，实际勾选由 Base UI 控件表达。**advanced**：用 `indeterminate` 表示部分选中；管理权限可以被业务锁定；用真实浏览器 `new FormData(form)` 读出选中的权限值，所有提交只发生在本地。

## 机制

默认 Checkbox.Root 渲染 span 和一个隐藏 input，而不是依赖自写的 role=checkbox 事件处理。这样在 label 包裹模式下能得到正确的可访问关系，也可复用 FormData 提交。若使用兄弟 label 的 `htmlFor` 模式，官方推荐 `nativeButton` + `render={<button />}`，不要在 label 中误嵌套其他交互节点。`onCheckedChange(checked)` 返回布尔值，本示例保持受控状态，父项的 indeterminate 与 checked 独立计算。

## 生产反模式

1. **父项一半选中却只显示 false**：必须显式 indeterminate，并提供 `n/m` 文本。
2. **把 disabled 视为授权**：UI 只是用户体验，后端必须再次核验权限。
3. **在 label 内嵌套另一个 button**：造成交互冒泡与不合法 DOM，改用官方 render 模式。
4. **把受控与非受控模式混用**：明确 checked/onCheckedChange 或 defaultChecked，不要来回切换。
5. **凭视觉打勾写同步业务状态**：数据模型须是单一事实源，父选择必须映射到实际子权限数组。
6. **组级权限错误越权**：高级模式锁定 manage 后，即使点击父级全选也只能选择未锁的权限；被禁用项应退出表单提交。
7. **直接将表单结果作为完整权限来源**：没有提交的权限值不等于应授予权限，后端需要有权角色和审计日志。
8. **把 Web 交互测试替换成快照**：必须真正用键盘 Space、Tab、label click 和原生 FormData 验证。

## 验证矩阵

逐项开关、全选/取消、部分选中、disabled、label点击、键盘Space、真实FormData、卸载后无残留、React StrictMode、移动端触摸。确保录入时不会因输入法合成事件修改权限。浏览器读屏可用，不能只看自绘方框。

本轮**真实SDK、TypeScript、构建和浏览器均 NOT_RUN**；依赖由 PLATFORM 在集成分支安装并完成校验。不能将本文的 API 描述或源码结构检查当 SDK PASS。

## 官方资源/许可

- [Base UI Checkbox](https://base-ui.com/react/components/checkbox)
- [Base UI Menu](https://base-ui.com/react/components/menu)
- [npm @base-ui/react](https://www.npmjs.com/package/@base-ui/react)

MIT，无付费资源与远程接口。
