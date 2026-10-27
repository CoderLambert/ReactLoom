# CodeMirror 6：编辑器状态、视图与生命周期

## 适用与边界

推荐用于配置、SQL、代码、Markdown 原文等可编辑文本；需要完整 VS Code 语言服务或大型多文件 IDE 时优先比较 Monaco（E05）。只读语法着色使用 Shiki（E09），不要无故挂载可编辑 DOM。CodeMirror 6 的核心是不可变 **EditorState**、可更新 **Transaction**、负责 DOM 的 **EditorView** 和可组合的 Extension。

当前示例以 React 19 + Vite 为运行宿主；CodeMirror 不要求使用 React。此实现来源于本仓重新编写（originalRecovery 原件存在，但不是直接运行旧归档代码），运行通过状态以 verification.json 为准。

## 安装

```bash
pnpm add codemirror@6.0.2 @codemirror/state@6.7.6 @codemirror/lang-javascript@6.2.5
```

版本为研究时官方 API 基线，PLATFORM 合并前负责在 root lockfile 中真正解析可兼容组合；`codemirror` 汇总包的版本号并不代表所有 `@codemirror/*` 都应停留 6.0.2。

## 基础机制

```tsx
import {basicSetup, EditorView} from 'codemirror'
import {EditorState, Compartment} from '@codemirror/state'
import {javascript} from '@codemirror/lang-javascript'
const editable = new Compartment()
const view = new EditorView({
  parent: hostElement,
  state: EditorState.create({
    doc: 'const x = 1',
    extensions: [basicSetup, javascript({typescript:true}), editable.of(EditorState.readOnly.of(false))]
  })
})
view.dispatch({effects: editable.reconfigure(EditorState.readOnly.of(true))})
view.destroy()
```

**以实际源码为准**：`examples/example.tsx` 展示挂载、更新、销毁；`examples/demo.tsx` 是 Lab 出口。EditorState 的位置以 UTF-16 代码单元计，不是字符视觉宽度，emoji 和中文组合输入需要专门检查。

## 三层真实实验

- **basic**：用真实 EditorView 输入 TypeScript，观察文档长度与事务更新；不要直接改 `.cm-content.textContent`。
- **business**：有界草稿仅在用户点击按钮时写 `reactloom:library-lab:E04:config-draft:v1` 这一个 sessionStorage 键，恢复时通过 dispatch 事务更新，异常或禁用存储不会阻塞编辑。
- **advanced**：通过 Compartment 重配置 readOnly，避免重建视图丢失选区；卸载时执行 view.destroy，不依赖 React 帮你自动销毁外部编辑器。

## 生产最佳实践和反例

1. **避免重建**：不要在输入变化后把 React `value` 反复传回新 EditorView。持有稳定实例，必要时比较外部文档版本并 dispatch 最小差量。
2. **资源所有权**：在 Effect 中创建实例，返回函数调用 view.destroy；单个 DOM 宿主不能同时维护多个 View。监听器、计时器、Web Worker 还需各自清理。
3. **只读不是禁用**：只读用户仍可选中文本和复制；禁用整个区域的交互需另作 UX/无障碍决策。
4. **草稿非数据库**：sessionStorage 可能抛异常、随标签关闭消失；产品级持久化需限额、版本和迁移，不保存凭据。
5. **语法服务分层**：语言高亮不等于类型检查；生产 JSON schema 验证、Lint/补全应明确设置对应扩展与取消策略。
6. **输入法**：不可在 composition 过程中同步格式化全量文本；IME、撤销栈、Ctrl+A、移动端键盘必须用真实浏览器验证。

## 组合建议

- 与 E06 react-markdown：前者编辑，后者执行安全预览；不要让用户输入的 Markdown 执行脚本。
- 与 E09 Shiki：Shiki 用于静态源码卡片，CodeMirror 用于用户编辑。
- 与 E05 Monaco：完整 IDE 交互时再承担 Worker 与大体积成本。

## 最小验证

安装依赖后执行 `pnpm --filter @reactloom/library-lab typecheck && pnpm --filter @reactloom/library-lab build`；浏览器检查输入、切换只读不丢内容、保存恢复、React StrictMode 双挂载无重复编辑器、离开 Tab 实例销毁、中文 IME。**当前未执行 SDK 构建或真实浏览器验收，不记 PASS。**

官方来源：[Guide](https://codemirror.net/docs/guide/) · [API](https://codemirror.net/docs/ref/) · [Changelog](https://codemirror.net/docs/changelog/)；核心 MIT，语言包与扩展分别审查许可。

## EF 第十五批：会话草稿恢复限额

原示例仅在首次挂载读取业务草稿时限制小于 50K 字符，手动“恢复草稿”按钮没有同样约束；同源污染过大的 sessionStorage 值可能被无限制插入 EditorView。现在 `assertDraftText` 由首次挂载、保存和手动恢复三条路径共用，允许最多 50,000 UTF-16 代码单元的原文，拒绝 NUL 和超长值；不合法内容只给状态提示，不覆盖用户当前代码。这个限制是 UI 资源保护，不是 TypeScript 静态分析或安全执行沙箱。

纯 Node 负例 `tests/policy.test.mjs` 不 import CodeMirror，不能代替真实 EditorView、IME、卸载或 Vite 构建。
