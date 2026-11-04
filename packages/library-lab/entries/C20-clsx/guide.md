# clsx：条件类名与组件状态

## 用在哪里

clsx 把字符串、数组和条件对象合成为 className。适合按钮、卡片、列表项等具有多种状态的组件。它不加载 CSS，不验证类是否存在，也不解决 Tailwind 的冲突。研究包原件存在；本页与 Demo 为此次应用重新编写，不继承旧报告的运行通过结论。

## 安装和引入

```bash
pnpm add clsx@2.1.1
```

```tsx
import clsx from 'clsx';
const className = clsx('card', { 'is-selected': selected, 'is-disabled': disabled });
```

具体运行代码见本条目 `examples/example.tsx`，演示入口为 `examples/demo.tsx`。Demo 源码面板由同一源文件生成，含 SHA-256。

## 三层实验

入门切换“选中/禁用”，观察实际 className。业务层增加已归档、待审核状态，理解样式状态与业务语义的映射。边界层直接执行 clsx，显示数字、空值、嵌套数组和重复 Tailwind 工具类的真实返回值。

预期：选中时加入 is-selected，取消时移除；按钮 disabled 必须同步原生属性，而不是仅变灰。高级层 `clsx('px-2','px-4')` 同时保留两者。

## 数据流

React 状态 -> 有限状态映射 -> clsx 输出字符串 -> className -> 浏览器 CSS。函数本身无资源生命周期；状态监听和异步操作仍归宿主组件所有。不要用 useEffect 存储可直接计算的 className，也不需要为这类微小纯计算默认加入 useMemo。

## 专属反例与修复

### 1. 只写禁用样式

错误：`className={clsx({disabled})}` 却仍可点击。正确：同时设置 `<button disabled={disabled}>`，保留焦点与键盘语义。

### 2. 把 Tailwind 冲突交给 clsx

错误：认为最后一个 class 一定决定 CSS 优先级。正确：不要制造冲突，或用经过版本兼容核对的 tailwind-merge 包裹 clsx；CSS 生成顺序不是字符串顺序。

### 3. lite 与完整版混用

错误：向 `clsx/lite` 传入条件对象，期待和完整版一样。正确：lite 只传字符串表达式，复杂对象使用完整版；不要仅为了体积盲目切换。

### 4. 将任意响应对象展开为样式

错误：`clsx(serverPayload)`。正确：先映射为有限、审查过的类名，业务数据不能决定任意隐藏/定位/覆盖类。

## 两种组合

CSS Modules：把 `styles.card`、`styles.selected` 等实际导出值交给 clsx，模块类名不硬编码。设计系统：clsx 负责状态组合，CVA 负责 variants，tailwind-merge 负责工具类冲突；按项目实际需要选取，不把三者全部强制安装。

## 性能、安全与可访问性

不要凭包宣传数字报告页面性能。成本通常来自组件树和样式计算，不是几次类名拼接。clsx 不是输入净化库；React 文本转义不代表任意类名都是安全产品行为。状态必须由 aria-pressed、disabled、错误描述和文本共同表达，不能只靠颜色。界面样式由项目维护，不由 clsx 提供。

## 迁移练习

练习一：将字符串三元拼接改为状态映射，保持 disabled/aria-pressed 的行为测试。练习二：从 classnames 迁移一个组件，列出 falsy、数字、嵌套数组和现有组件 API 的回归样例，而不是全仓机械替换。

## 当前验证

示例真实 import `clsx` 和 `clsx/lite`；本次环境尚不能下载 npm 依赖，SDK/浏览器验证为 NOT_RUN，正式构建 BLOCKED。平台的目录单测不代表本库运行通过。安装后执行 `pnpm --filter @reactloom/library-lab test:sdk` 与对应 E2E。

## 官方来源

- [官方源码与文档](https://github.com/lukeed/clsx)
- [v2.1.1 源码](https://github.com/lukeed/clsx/tree/v2.1.1)

MIT 许可；本示例不包含第三方媒体资产。

## 第22轮：有限样式语义与 SDK 用例

示例改为先由 `examples/class-policy.mjs` 映射有限业务状态，再交给**真实 clsx** 合成类名。布尔状态仅接受 `true`，tone 只允许 success/warning，未知服务端文案不会被拼接成 `hidden/fixed` 等任意样式。CSS 并不由策略提供，按钮的原生 `disabled` 和 `aria-pressed` 仍是操作语义来源。新增 `tests/class-policy.test.mjs` 已有纯 Node 检查；`tests/sdk.test.mjs` 直接 import `clsx`/`clsx/lite` 检查合并、falsy 与 Tailwind 类保留，**需要实际安装运行**，不从策略测试推断 SDK PASS。
