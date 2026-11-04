# Radix Primitives — DropdownMenu 分层菜单与可访问交互

## 为什么不是再造一套菜单

Radix Primitives 的目标是**无样式但具备真实交互语义**的 React 原语。它处理 WAI-ARIA、键盘、焦点、Portal、列表选择与禁用状态；产品自己维护品牌设计。这个样例只选择 `@radix-ui/react-dropdown-menu` 作为代表性原语，并不表示所有 Radix 组件都被加载或验证。跨库搭配时可参考 B09 shadcn/ui（组件源码所有权）和 B10 Base UI（另一套无样式原语）。

## 安装、依赖和入口

```bash
pnpm add @radix-ui/react-dropdown-menu@2.1.25
```

```tsx
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
<DropdownMenu.Root>
  <DropdownMenu.Trigger asChild><button type="button">更多</button></DropdownMenu.Trigger>
  <DropdownMenu.Portal>
    <DropdownMenu.Content sideOffset={8}>
      <DropdownMenu.Item onSelect={() => console.log('select')}>查看</DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>;
```

完整可执行实现位于 [examples/example.tsx](examples/example.tsx)，样式为 [examples/dropdown.css](examples/dropdown.css)，适配出口为 [examples/demo.tsx](examples/demo.tsx)。组件状态处理直接使用真实 Radix SDK，不手工重建菜单键盘/焦点管理。

## 三层实战

**basic**：真实 Root、Trigger、Portal、Content、Label 和两个 Item。**business**：RSS 订阅收藏状态、CheckboxItem 与 RadioGroup；CheckboxItem 用 `event.preventDefault()` 让多选操作保持菜单打开。**advanced**：Submenu、权限限制、禁用删除操作与 Escape/箭头导航。选择只修改本地状态，不会请求后端或删除正式数据。

## 生命周期、焦点与安全

`DropdownMenu.Root` 持有受控的 `open`，离开 Tab 卸载后 Portal 应消失。不要复制按钮后另外注册 document keydown 来处理 Escape/方向键，Radix 已处理对应原语。关闭后应还焦到触发器，菜单作为触发按钮的弹出层，不要把它作为通用表单 Dialog。手写 CSS 通过 `[data-highlighted]` 和 `[data-disabled]` 表示键盘当前项目和禁用状态，不能只用 hover 反馈。

## 反例与替代方案

1. **自制 document keydown**：造成双重 Escape、中文 IME 冲突和内存监听；交给 Radix。
2. **Trigger 内嵌 button**：不合法交互嵌套；使用 `asChild` 组合原生 button。
3. **CheckboxItem 勾选后意外关菜单**：需要连续切换时显式 `onSelect(event.preventDefault)`，但普通 Item 应按默认关闭。
4. **Menu.Item 同时塞多个按钮**：破坏 roving focus；每个操作一项，复杂编辑表单用 Dialog/Popover。
5. **Portal 样式完全无作用域**：内容在 document.body；使用专用类名和设计 token，不依赖父 div 后代选择器。
6. **禁用项只靠灰色 CSS**：必须传真实 `disabled`，核验指针/键盘均不能激活。
7. **用 Menu 掩盖后端权限**：前端 disabled 只说明 UI，不是服务端授权；删除和修改仍需服务端 RBAC。
8. **把文本传给 `dangerouslySetInnerHTML`**：菜单文字以 React text node 渲染，不信任外部 HTML。

## 测试与维护

重点测试 Tab 激活、Enter/Space 展开、ArrowUp/Down、typeahead、子菜单左右方向、Escape 和焦点返回、禁用项不触发、复选状态不意外关闭、移动端指针行为、屏幕阅读器角色以及窄屏碰撞。对应 DOM 样式不依赖全局 Tailwind 组件覆盖。

**本次仅提交真实SDK代码，真实 npm/TS/Vite/Chromium NOT_RUN。** 后续必须在实际 React19 / Radix 锁文件上验证，不能把静态结构核对当运行成功。

## 一手资料与许可

- [Radix DropdownMenu 官方文档](https://www.radix-ui.com/primitives/docs/components/dropdown-menu)
- [Radix Primitives GitHub](https://github.com/radix-ui/primitives)
- [npm 版本](https://www.npmjs.com/package/@radix-ui/react-dropdown-menu)

MIT；所有示例业务内容为原创。


## 本轮修复：菜单动作驱动真实本地列表

旧菜单的筛选、排序、删除大多只替换状态提示，不改变可见数据。现由 `examples/feed-policy.ts` 持有确定性可迁移规则：置顶优先、时间/热度排序、仅未读/有收藏筛选、锁定删除防越权。三层示例仍使用真实 Radix Root、Portal、CheckboxItem、RadioItem、Submenu；列表按钮可键盘选择，选择不同筛选时同步选中第一条可见订阅，删除会更新实际本地集合而不访问后端。 `tests/feed-policy.test.mts` 只证明纯数据规则，Portal/Escape/焦点返回需要浏览器验证。
