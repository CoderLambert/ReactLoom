# axe-core 4.14.0｜三则规则，只扫当前容器

Lab 锁定 `axe-core@4.14.0`（MPL-2.0）。示例对一块自己的 DOM 调用 `axe.run`。它不证明整页 WCAG，也不代替读屏和键盘走查。

用户显式启动后挂载 [`examples/demo.tsx`](examples/demo.tsx) → [`examples/example.tsx`](examples/example.tsx)。换 level 会换 `key`，审计会话重新挂上。

没有 `docs/library-lab/evidence/runs/` 收据时 sdk、build、browser 保持 NOT_RUN。Actions 41779873259 是仓库级安装、类型检查、构建、52 个 SDK 文件 / 153 项测试和 45 项 Playwright，不是 F17 的 PASS。那 45 项里若有别的页面的 axe，也不能抄到这三则规则。

## Lab 当前示例

| 文件 | 作用 |
| --- | --- |
| `examples/example.tsx` | 缺陷 DOM 与修复 DOM，按钮触发 `axe.run` |
| `examples/audit-queue.mjs` | 串行化本模块的扫描；排队期间失效则跳过 |
| `examples/audit-queue.test.mjs` | 队列策略，不调用 axe |

只运行 `image-alt`、`label`、`button-name`。图片是 1×1 的透明 GIF data URL，没有第三方媒体。修复前：business 以外的图没有 `alt`；basic 以外的输入只有视觉上的 `<span>`，没有 `<label htmlFor>`；advanced 的按钮没有文字也没有 `aria-label`。

修复后：alt 为「示例内容封面」；label 关联 `useId()`；按钮 `aria-label` 为「添加当前RSS频道」并有可见文字「添加」。

勾选修复会增加 generation 并清掉旧结果。扫描进行中不能切换，避免 DOM 在 `axe.run` 中途被换掉后还写回。

`enqueueAxeAudit` 保证本模块不会重叠调用 `axe.run`（库会拒绝重叠）。失败不会把队列卡死。`isCurrent` 为假时返回 `{ skipped: true }`，不把过期结果写进状态。它协调不了页面上其它代码发起的 `axe.run`。

## 1. 什么时候用

组件刚写完，想看这几条能自动算出来的名字问题：图没有替代文本、输入没有标签、按钮没有可访问名称。流程是否做得成、焦点是否掉进端口、对比度是否在真实主题下合格，都要另测。

React Aria（B12）提供组件行为。挂上它之后仍要跑规则和键盘。不要互相代替。

## 2. 模型

```text
点击
  → running ref 挡住重入
  → generation++
  → enqueue → axe.run(container, { runOnly: { type: 'rule', values: [...] } })
  → 仍是当前代号且未 skipped
  → violations 映射 id / impact / description / target
  → incomplete 只计数
```

上下文是 `ref` 上的 div，不是 `document`。因此旁边的 Lab 导航不在这次结果里。换 level 卸载会话，旧扫描只能被丢弃，不能说成已经从引擎里物理取消。`axe.run` 一旦开始，就会跑完；代号不对就忽略结果。

`incomplete` 是规则无法确定的项，不是违反，也不是通过。文案要求人工判定。

修复勾选和「通过这 3 条」的空列表都写明：不等于 WCAG 全部合格。

## 3. 三层

### 基本

只有一张缺 alt 的图。标题是「图片缺少替代文本」。未修复时，`image-alt` 应出现在违反列表。修复后这三条里不应再有它。其它规则没有跑。

### 业务

没有那张图，只有未关联的「RSS 订阅地址」和输入框。未修复时应看到 `label`。修复后用真正的 `<label htmlFor>`。placeholder 不是标签。

### 进阶

图、输入和空按钮都在。未修复时三条都可以出现。修复版同时补 alt、label 和按钮名。空列表旁边的句子仍然限制范围。动态焦点和读屏不在这次调用里。

## 4. 反例

### 反例 1：扫整个 document

```ts
await axe.run(document)
```

会把 Lab 外壳算进来，也会让结果无法对应这块教材。传入容器 ref。

### 反例 2：不限制规则却宣称只修了 alt

默认规则集比这三条多。本页用 `runOnly`。若产品要全量，就不要复制这组 `values`，并且准备好 incomplete 和主题对比度。

### 反例 3：违反数为 0 就写 WCAG 通过

```tsx
if (report.violations.length === 0) markCompliant()
```

空列表只说明这三条没有违反。`incomplete` 还要人看。键盘顺序、放大、读屏没有测。

### 反例 4：重叠调用

连续点两次，或两个 demo 实例同时 `axe.run`，库会拒绝。`running` ref 加上队列。换 level 用 `key` 卸掉旧会话。

### 反例 5：中途改 DOM 仍采用结果

修复勾选若发生在扫描中，结果对的是旧树或一半新树。扫描时禁用勾选；若代号变了，直接 return。

### 反例 6：用 impact 颜色代替文本

列表写出 id、impact、description 和 target。不要只画红点。`impact` 可能为空，显示「未定级」。

### 反例 7：mock axe.run

```ts
vi.mock('axe-core', () => ({ default: { run: async () => ({ violations: [], incomplete: [] }) } }))
```

这不是 SDK。队列测试故意不 import axe。浏览器里必须看到真实违反和修复后的变化。

### 反例 8：把教学缺陷抄进产品

未勾选的 DOM 是故意坏的。复制组件时用修复版：有 alt、有 label、按钮有名称。不要把 data URL 图当成内容图。

## 5. 组合

**F13**：在每个状态下 `setContent` 或打开路由后再 `axe.run`。Playwright 的角色定位不是规则结果。本页没有 Playwright。

**F12**：Node 里没有这块 DOM。不要在 Vitest 的默认环境里期待 `image-alt`。

**F14**：addon 的 `a11y.test: 'error'` 不会自动覆盖这三则缺陷。状态卡故事是另一份 DOM。

**B12**：原语减少一些错误。集成后仍跑 `axe.run`，并手测键盘。

## 6. 清单

- 上下文是容器，规则只有三条。
- 手动触发，不在挂载时扫描。
- 换 level 重挂会话；过期结果丢弃。
- 队列失败不阻塞下一次。
- 修复路径使用 label、alt、按钮名，而不是 placeholder 或仅颜色。
- 展示 incomplete 的数量。
- 不上传页面 HTML，不包含用户数据。
- 零违反不写成合规认证。

## 7. 升级

4.14 的 `axe.run(context, { runOnly })` 是合同。升级后用未修复和修复各跑一次，确认规则 id 仍是 `image-alt`、`label`、`button-name`。id 若改名，示例和断言一起改。

MPL-2.0 的文件头不要删。不要把 axe 的源码副本另存进条目。

## 8. 验收

```bash
node --test packages/library-lab/entries/F17-axe-core/examples/audit-queue.test.mjs
```

它不加载 axe-core。浏览器要看到：未修复有对应 id，修复后这三条的违反下降，incomplete 被单独计数，快速换 level 不把旧结果写上来。这些需要收据。策略通过保持 sdk NOT_RUN。仓库其它页面的 axe 日志不是这一页的 browser 收据。

## 9. 资料

- https://github.com/dequelabs/axe-core
- https://github.com/dequelabs/axe-core/blob/develop/doc/API.md
- https://github.com/dequelabs/axe-core/blob/develop/doc/context.md
- https://www.npmjs.com/package/axe-core
