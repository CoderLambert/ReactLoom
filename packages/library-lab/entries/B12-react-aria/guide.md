# React Aria Components — 真正的 ComboBox、键盘与异步列表

## 适合什么任务

React Aria 提供高质量可访问交互；本条目采用 **react-aria-components** 的声明式 ComboBox/Popover/ListBox，一次性处理输入焦点、ARIA 角色、方向键、选项选择和中文输入法处理等细节，不重复实现键盘状态机。B11 Radix Primitives / B10 Base UI 是替代 Headless 基础 UI；按设计体系选择，不在一个组件混用多套 Focus Manager。

## 安装

```bash
pnpm add react-aria-components@1.21.0
```

```tsx
import {ComboBox, Label, Input, Button, Popover, ListBox, ListBoxItem} from 'react-aria-components';
<ComboBox>
  <Label>选择频道</Label>
  <Input/>
  <Button>▾</Button>
  <Popover><ListBox><ListBoxItem id="frontend">前端工程</ListBoxItem></ListBox></Popover>
</ComboBox>;
```

完整真实实现：`examples/example.tsx`、样式 `examples/combobox.css`，Lab入口 `examples/demo.tsx`。生产中可以从设计系统扩展 ComboBox，但不能复制演示的业务 fixture 假装线上数据。

## 分层示例

**basic**：固定频道，ComboBox 提供方向键/Escape/Enter，并通过可访问 label 和描述呈现结果。**business**：RSS 频道全量搜索、按名称过滤、禁用频道与稳定 ID。**advanced**：本地延迟建议列表、generation+AbortController 避免旧查询回写最新结果、异步查询文字状态、FormData 精确提交。

这是异步网络形状的**本地定时器模拟**，没有 HTTP 流量或真实 RSS 搜索服务；SDK 是真实 React Aria Components。没有为了演示而在主站注册全局 keydown。

## 契约和状态

`selectedKey` 是实际选中的频道 ID，`inputValue` 是当前输入文本，不能混成一个状态。清空时需同时归零。React Aria 使用 `textValue` 做筛选与读屏语义；列表选项 ID 保持稳定，不因过滤更改。异步数据要考虑取消与序列号；在生产中改为带 signal 的网络请求，旧响应不能回写新状态。

`name="channel"` 将选中 ID 放入表单，和用户看到的 label 字符串不同。真正服务端仍需校验频道 ID 是否存在且允许用户订阅。

## 反例与修复

1. **手写 keydown Enter**：IME 合成期意外选中；让 React Aria 管选择和导航，业务仅监听 `onSelectionChange`。
2. **inputValue 与 selectedKey混用**：用户正在输入却被当已确认值；保持状态语义分离。
3. **selectedKey = index**：过滤/重排后选择漂移；使用固定 ID。
4. **disabled 项只改透明度**：必须传 `isDisabled`，测试键盘也不可选。
5. **异步请求不取消**：旧建议覆盖新输入；AbortController + generation 双保护。
6. **只有视觉结果而无查询状态**：使用 role=status 描述加载与结果，屏幕阅读器可知变化。
7. **盲目重写 Popover 定位与焦点**：组件有自己的 Portal/Focus 体系，不混入额外 Floating UI 机制。
8. **把 UI 过滤当授权**：服务端仍需校验订阅合法性、搜索权限及用户归属。

## 验收要求

用真实 SDK 与 React19 检查中文IME、键盘Up/Down/Enter/Escape、禁用选项无法选择、列表更新选择状态不漂移、FormData返回频道ID、快速输入不显示过期建议、切换Tab卸载没有遗留延时回写、移动端触屏、窄屏与读屏。不要 Mock React Aria 后报运行通过。

当前 `sdk/build/browser: NOT_RUN`，需 PLATFORM统一安装真实依赖并执行。GitHub文件结构检查不等于SDK验证。

## 官方参考与授权

- [React Aria ComboBox](https://react-aria.adobe.com/ComboBox)
- [React Aria 官方仓库](https://github.com/adobe/react-spectrum)
- [npm react-aria-components](https://www.npmjs.com/package/react-aria-components)

Apache-2.0；本地频道数据为原创演示 fixture。


## 本轮修复：输入与已确认 ID 的双状态契约

旧受控 ComboBox 在筛选后可能提交旧 `selectedKey`；按分类“技术”检索与组件只按名称的二次默认筛选也可能不一致。现在 `examples/channel-policy.ts` 显式按名称/分类过滤，ComboBox 的默认过滤返回 true 避免双重筛除；异步结果仅在查询与当前文本一致、加载结束后可见。 `onSelectionChange` 同步 ID 与显示名称，用户编辑文本会使不再匹配的 ID 失效，提交时再次确认 enabled 项 ID、文本与真实 FormData 一致；组合输入期拒绝提交。240ms 延迟仅为**本地模拟查询**，非服务端 API。`tests/channel-policy.test.mts` 是纯规则测试；IME/键盘/Portal/表单提交仍需真实 React Aria 浏览器验证。
