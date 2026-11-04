# Material UI（MUI）— 工程主题、表格、弹窗与异常回填

## 核心定位

MUI（`@mui/material`）提供可组合 React Material Design 组件、设计 token、表单、表格、弹窗和反馈。本实验只使用免费开源的 Material UI 核心组件；Data Grid Pro 等收费模块不在范围内。若产品希望代码归自己维护可参考 B09 shadcn/ui；无样式原语优先 B11 Radix / B10 Base UI。

## 安装与版本

```bash
pnpm add @mui/material@9.5.0 @emotion/react@11.14.0 @emotion/styled@11.14.1
```

```tsx
import {createTheme, ThemeProvider, Button, TextField} from '@mui/material';
const theme = createTheme({palette: {primary: {main: '#2b674e'}}});
<ThemeProvider theme={theme}><Button variant="contained">保存</Button></ThemeProvider>;
```

完整示例位于 `examples/example.tsx`，Lab 通过 `examples/demo.tsx` 共享真实实现源码。用户仅进入此 Demo 时加载 MUI，避免把 Emotion 和组件树塞入首页首包。生产应用的 ThemeProvider 应位于真正的 UI 根，而非每个业务列表重复包一份。

## 分层场景

**basic**：Material ThemeProvider、带标签 TextField、Chip 和状态文本。**business**：真实 Table/TableContainer/TableRow，稳定 `row.id`、本地搜索、Switch 同步启用状态。**advanced**：Dialog 焦点管理、名称/HTTPS 校验、单次模拟 409 业务失败、局部撤销及 Snackbar；这是浏览器内的本地 fixture，未模拟真实后端网络成功。

## 实现解析

React 管业务数组和历史状态；MUI 管视觉组件、焦点/Portal/Dialog 与 Snackbar 展示。表格每项以业务 ID 为 key，不用数组 index。客户端校验只是第一道提示，生产服务端错误必须映射到字段并可供读屏访问。输入时只更新 React state，不因按下 IME Enter 自动提交。Dialog 打开时 MUI 按 WAI-ARIA 处理焦点，关闭后应返回触发器；不同的 Dialog 与 Snackbar Escape 优先级需真实浏览器验收。

## 反模式与改进

1. **仅通过视觉禁用状态**：disabled prop 必须真实传递给原生交互元素。
2. **把所有数据表塞入内存**：大表先考虑服务端分页/虚拟化 C09/C10，Material Table 不自动代替大数据网格。
3. **每项 render 中 createTheme**：重复创建主题对象导致不必要的 Context 更新；示例主题定义在模块层。
4. **把 Snackbar 成功提示当事务成功**：只有业务操作真实成功才发成功提示；本地 fixture 必须明确说明。
5. **把任意字符串交给 `sx` 并允许不可信动态 CSS**：维护设计 token 与固定 variants，避免来自外部的任意样式。
6. **使用收费 Data Grid 的功能却声称 core 免费**：高级网格独立评估许可、体积、API和采购范围。
7. **把 Modal 和 Popover 全部渲染在错误的容器中**：设计正确的 portal/focus/scroll owner，不要在 Tab 卸载后遗留弹窗状态。

## 生产与测试

React19 peer、Emotion CSS 注入顺序、Tailwind 全局层叠需要真实构建验证；重型组件按路由/Tab 懒加载，未进入 Demo 时不应请求 MUI chunk。检查键盘 Tab/Escape、中文输入法、字段错误的 aria-describedby、表格标题、对比度、移动端窄列滚动、ThemeProvider 生命周期以及 React StrictMode。

**当前 SDK / TypeScript / 构建 / 浏览器：NOT_RUN。** 本页仅提交真实 `@mui/material` API 调用和原创 fixture；依赖由 PLATFORM 安装并校验，不继承历史验收结论。

## 官方来源与许可

- [MUI 安装](https://mui.com/material-ui/getting-started/installation/)
- [MUI Snackbar](https://mui.com/material-ui/react-snackbar/)
- [MUI npm](https://www.npmjs.com/package/@mui/material)

MUI Material 核心 MIT；Emotion MIT。此示例不使用 Pro/商业控件。

## 第11轮：函数式历史状态与稳定ID

原来 `setBefore(rows)` 加 `setRows(old => ...)` 产生两个彼此独立的 React 更新源：连续 Switch 点击可能把过期 `rows` 捕获为撤销快照，使用 `old.length + 1` 作为新增 ID 又会在撤销后复用。现在 `examples/feed-history.ts` 把业务数组、单步撤销快照和单调 ID 分配合并为一个 `FeedHistory`，所有修改使用 `setFeedHistory(previous => ...)`；重复地址/无效 ID/无变化操作不覆盖撤销点。Dialog 与 Snackbar 继续调用真实 MUI 组件，业务失败仍仅为本地模拟。

回归：先连续开关两条，撤销只能回退最近一次；新增→撤销→新增不会复用 ID；重复地址不产生记录。`tests/feed-history.test.mts` 是纯业务规则，不代表 MUI Portal/焦点/IME 已通过浏览器验收。
