# Mantine 9 — 真实组件、主题和可编辑业务状态

## 为什么选 Mantine

Mantine 是具有完整主题、可访问性、输入和布局组件的 React UI 系统，特别适合快速搭建仪表盘、后台与交互工具。它不是 Headless；如果已有 Material UI 或 Ant Design，不建议因几个按钮引入第二套主题和 CSS。对照 B07 MUI、B06 Ant Design；只需要无样式原语时参考 B10 Base UI / B11 Radix。

## 版本、安装和样式入口

```bash
pnpm add @mantine/core@9.7.3 @mantine/hooks@9.7.3
```

```tsx
import '@mantine/core/styles.layer.css';
import {MantineProvider, createTheme, Button} from '@mantine/core';
const theme = createTheme({primaryColor: 'teal'});
<MantineProvider theme={theme}><Button>保存</Button></MantineProvider>;
```

Lab 用 `styles.layer.css` 避免无层 CSS 无意覆盖大部分主站主题；**CSS layer 不能替代 iframe 隔离**。官方还提供 `styles.css`，不能同时引入这两种版本。正式生产只在应用根挂载一次 MantineProvider，样式导入和同体系 package 的样式顺序由应用控制。

## 三层 Demo

**basic**：MantineProvider + Card + TextInput + Badge + Button，展示主题与真正的禁用属性。**business**：RSS 订阅表格、查询、Switch 控制、撤销本地状态；`@mantine/hooks` 的 `useDebouncedValue` 对输入查询做 150ms 视图层防抖，**不改变服务端查询预算**。**advanced**：Modal 交互与真实 `NumberInput` 的字符串中间态，错误信息在无效值时可见；没有发出真实服务器请求，状态重置受组件所有权管理。

## NumberInput 最容易被误用的地方

Mantine NumberInput 的 `onChange` 不是无条件 number：清空得到 `''`、只输入减号得到 `'-'`，输入大于安全整数可能返回 string。不能用 `Number(value || 0)` 默默将空输入转成 0，也不能直接拿 `NaN` 写进服务端数据。示例先检查 `typeof draft === 'number'`、`Number.isSafeInteger` 和限额区间，再同步业务数据，失败仍保留用户输入用于修正。

## 生产反例和修复

1. **Provider 放在每行列表里**：重复变量注入、主题冲突；放在应用根。
2. **同一应用导入 styles.css + styles.layer.css**：产生顺序与覆盖混乱，只选一种。
3. **NumberInput 直接 `parseInt`**：空值和部分输入被错误吞掉；把输入值作为 union 保存直到验证。
4. **频繁更新状态时用不稳定 key**：Modal 编辑对象指向错误行；使用业务稳定 ID。
5. **把 CSS layer 当沙箱**：某些组件 Modal 会 Portal 到 document.body；必须检查 z-index、CSS 变量及焦点边界。
6. **只依赖颜色告知启用状态**：Switch 提供可访问标签，状态同时以文本呈现。
7. **只在客户端校验限额**：正式接口仍需后端约束并处理 409/422、重试与并发；本例的 1–100 只是教学领域规则。

## 验收与迁移

验证样式顺序、ThemeProvider卸载、副作用清理、Modal键盘与焦点返回、React19 StrictMode、响应式表格和 NumberInput 中间态。改变筛选条件不改变基础数据；撤销时恢复最近一次快照；离开页面不写入 localStorage 或其他组件状态。

**实际 SDK / 类型 / 构建 / 浏览器为 NOT_RUN**。所有内容源自当前官方接口，但没有执行真实包，需由 PLATFORM 装入锁文件后复测。

## 参考

- [Mantine 开始](https://mantine.dev/getting-started/)
- [Mantine 样式导入](https://mantine.dev/styles/mantine-styles/)
- [NumberInput 类型](https://mantine.dev/core/number-input/)
- [Provider](https://mantine.dev/theming/mantine-provider/)

Mantine core / hooks MIT；本地 RSS 数据原创。
