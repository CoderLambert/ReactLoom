# B10 Base UI：无样式 Checkbox 与真实 FormData

`@base-ui/react` 提供无样式交互原语：键盘、状态和隐藏的表单控件由库负责，颜色和间距由项目 CSS 负责。它不是开箱即用的后台皮肤。Library Lab 固定 `@base-ui/react@1.9.0`，宿主 React 19.3.0。许可证 MIT。运行库 MIT 不等于图标、字体和模板可商用。不要把它和已退役的 `@mui/base`、Uber 的 `baseui`、或 Radix 的 `asChild` 混成一个 API。

官方按路径导入，便于摇树。本示例只导入 Checkbox：

```tsx
import {Checkbox} from '@base-ui/react/checkbox';
```

React 17+ 在官方支持说明里出现过；Lab 跑在 19.3.0。浏览器基线以发布时的 Baseline 为准，没有 IE11。包内带类型，但本条目的 sdk 检查仍是 NOT_RUN，静态阅读不能代替类型检查。

## Lab 当前示例

`examples/demo.tsx` 再导出 `examples/example.tsx`。样式是 `examples/checkbox.css`，类名 `rl-base-*` 归项目，不归库。策略在 `examples/permission-policy.ts`。没有原研究稿的 Dialog、Popover、Field、`server/mock-api.mjs` 或 `127.0.0.1:4174`。

已挂载：

- `basic`：一个受控 `Checkbox.Root`，`checked={single}`，`onCheckedChange={setSingle}`，`Checkbox.Indicator` 在选中时显示 ✓。外层是原生 `<label>`，点击文字也能切换。旁边的 `<strong>` 写出已选/未选，不单靠颜色。
- `business` / `advanced`：三项权限 `read` / `comment` / `manage`。父级 `checked` 与 `indeterminate` 来自 `permissionSummary`。子项把 `name="permissions"` 和 `value={option.id}` 交给 Root，因此隐藏 input 会进入浏览器 `FormData`。
- 提交 `preventDefault` 后 `new FormData(event.currentTarget).getAll('permissions')`，status 打印实际选中的 id。这不是网络 POST。
- `advanced`：原生复选框「锁定管理订阅」。锁定后 `manage` 的 Root `disabled`，`normalizePermissions` 会从已选集合里拿掉它。父级全选只作用于 `eligiblePermissions`，不能越过锁定。`changePermission` 对不在可选集合里的 id 直接返回当前合法集合。

未挂载：Dialog 焦点陷阱、Popover、Field 错误关联、Switch、revision/409、IME 文本字段。那些原语仍是 Base UI 的生产能力，当前 demo 的验收面只有 Checkbox、混合态和 FormData。

## 什么时候使用

适合已有设计系统、要用自己的 CSS 或 Tailwind，并需要可组合的 Dialog、Popover、Select、Checkbox。不适合：想靠少量主题交付完整后台（B06/B07/B08）、没有人力维护焦点回归和样式、或只是一个原生 checkbox 且没有混合态/禁用规则。非 React 项目不要引入。

三种责任：服务端是权限事实；React state 是正在编辑的集合；Base UI 拥有复选框的按下、键盘和隐藏 input。不要把勾选状态当成授权结果。正式权限必须再由后端验证。Lab 的文案写了这一点。

## 模型

```text
label
  └── Checkbox.Root（checked / indeterminate / disabled / name / value）
        └── Checkbox.Indicator（仅视觉）
隐藏 input → 浏览器 FormData
permission-policy → 谁可选、父级是全选还是混合、锁定时能否写入
```

父级三态：一项都没选是未选；选了部分是 `indeterminate`；可选集合全部选中才是 `checked`。锁定 `manage` 之后，分母是 2 不是 3。已锁权限即使之前被选中，规范化也会去掉。

`onCheckedChange` 给出布尔（以及库可能给出的混合态回调）。业务函数再决定下一个数组。不要在 Indicator 的 onClick 里改状态，那会和 Root 的指针模型抢。

## 三层渐进

### Demo ① 单个复选框（已挂载）

Tab 到控件，Space 切换。status 与粗体同步。没有表单，因此没有 FormData。这是为了看标签和受控值，不是权限模型。

### Demo ② 批量权限（已挂载）

全选写入全部三项，再点一次清空。子项单独切换时，父级在 0、混合、全选之间变化。提交按钮是原生 `type="submit"`。FormData 的值应是 `read` / `comment` / `manage`，而不是可见的中文标签。

### Demo ③ 锁定与混合态（已挂载）

打开锁定：若 `manage` 已选，规范化会移除它，父级不再把它算进分母。全选不会把管理权限勾回来。禁用的 Root 不应再通过点击或父级被打开。提交结果里不应出现 `manage`。

未挂载的生产教学：Field 把错误连到输入；Dialog 在异步保存完成前不要关；Popover 的定位和碰撞归库，样式归 CSS。当前文件没有这些零件，不要在复选框示例上叠一套未测试的弹层。

## 反例

```tsx
// 错：用 div 画勾，没有隐藏 input，表单提交是空的
<div aria-checked={on} onClick={toggle} />

// 对：Root 带 name 和 value，外层 label
<label>
  <Checkbox.Root name="permissions" value="read" checked={on} onCheckedChange={setOn}>
    <Checkbox.Indicator>✓</Checkbox.Indicator>
  </Checkbox.Root>
  阅读文章
</label>
```

```tsx
// 错：父级只是「长度 === 3」，锁定后永远到不了全选，或把禁用项也写进数组
const checked = enabled.length === 3;
if (checked) setEnabled(['read', 'comment', 'manage']);

// 对：分母用 eligiblePermissions(manageLocked)
```

```tsx
// 错：disabled 只写 CSS，点击处理函数仍 setState
<Checkbox.Root className="looks-disabled" onCheckedChange={() => enableManage()} />

// 对：disabled={manageLocked && id === 'manage'}，并且 changePermission 再拒绝一次
```

```tsx
// 错：提交时读 React state，和浏览器表单不一致
const ids = enabled; // 可能含已锁定但仍留在 state 里的 manage

// 对：提交读 FormData；state 更新走 normalizePermissions
const selected = new FormData(form).getAll('permissions').map(String);
```

```tsx
// 错：从 '@mui/base' 或 'baseui' 导入，或给 Root 写 asChild
import {Checkbox} from '@mui/base';

// 对：'@base-ui/react/checkbox'
```

```tsx
// 错：指示器使用 display:none 的「可访问文本」，读屏和可视状态不一致
// 对：状态文字在 label 旁的 strong / status。Indicator 只是勾或减号
```

混合态要用库的 `indeterminate`，不要只换一个减号字符却让隐藏 input 仍是未选或已选。Lab 把减号放在 Indicator 里，同时把 `indeterminate` 传给 Root。

## 组合

**Base UI + 自有 CSS**：本条目的 `checkbox.css` 就是边界。焦点环用 `:focus-visible`，不要全局 `outline: none`。减少动画只影响装饰，不影响勾选结果。

**Base UI + TanStack Query**：保存时把 FormData 或规范化后的 id 发给 mutation。服务端可以拒绝 `manage`。409 时用响应纠正本地集合，不要只相信勾选动画。Lab 没有 mutation。

**Base UI Dialog（未挂载）**：打开、焦点陷阱、Escape 归 Dialog 原语。Checkbox 放进 Dialog 时，卸载 Dialog 要丢掉未提交草稿或显式询问。不要用复选框的 state 当弹层的 open。

与 Radix 的差别：组合方式和样式钩子不同。不要把 Radix `asChild` 示例改个导入就当 Base UI。与 React Aria 的差别：Aria 组件自带更多国际化和行为默认值；Base UI 把样式所有权留得更裸。B12 的 ComboBox 不是用 Checkbox 拼出来的。

## 生产清单

- 每个控件有可见标签，命中区域包含文字。
- 禁用理由用文字说明（Lab 的锁定复选框），不只靠灰。
- 父级混合态在读屏下要有名字。不要只留一个减号。
- 提交以 FormData 或与隐藏 input 一致的数据为准，并在服务端重算授权。
- 不要在 `onCheckedChange` 里请求网络而不处理过期响应。
- 分组超过一屏时考虑字段集和键盘顺序，而不是再造一套 roving tabindex。Base UI 的 Checkbox 使用原生复选框语义。
- 触摸目标不要只剩 12px 的方块。

## 升级

1.9.0 的路径导入是本条目的契约。升级小版本时回归 `checked`、`indeterminate`、`disabled`、`name`、`value` 是否仍渲染到可提交控件。不要为了「和文档首页一致」改去导入一个不存在于 1.9.0 的聚合入口，除非锁文件和类型一起改。

从 `@mui/base` 迁出时，逐个替换包名和零件名（Root / Indicator），并重写 CSS。行为测试要包含混合态和禁用，不能只截图勾选颜色。

## 验收

basic：标签点击和按钮点击结果一致，status 同步。business：部分选择时父级为混合；全选再提交，FormData 含三个 id；清空再提交，文案是「无勾选」。advanced：锁定后提交不含 `manage`；全选不能绕过锁定；解锁后管理项恢复可点。

sdk、build、browser 为 NOT_RUN。没有匹配 receipt 就不能写成 Base UI PASS。Actions run `41779873259` 是仓库级 install、typecheck、build、52 个 SDK 文件 / 153 项测试、45 个 Playwright，不是 B10 的 PASS。

```bash
node --experimental-strip-types --test packages/library-lab/entries/B10-base-ui/tests/permission-policy.test.mts
```

断言可选集合、混合态、锁定时拒绝写入 manage、全选不包含被锁权限。不证明隐藏 input 的 DOM 或键盘。

## 官方资料

- https://base-ui.com/react/overview/quick-start
- https://base-ui.com/react/components/checkbox
- https://base-ui.com/react/components/dialog
- https://base-ui.com/react/components/preview-card
- https://www.npmjs.com/package/@base-ui/react
- https://github.com/mui/base-ui
