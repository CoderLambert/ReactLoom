# Shiki 4：真实 token 着色与安全源码展示

## 任务定位

Shiki 将代码通过 TextMate grammar + 主题转为 tokens、HAST 或 HTML。适合文档站代码块、RSS 技术文章和 AI 输出片段。它不是 IDE、编辑器或 TypeScript 编译器；需要输入和选区时选 CodeMirror（E04）或 Monaco（E05）。

版本基线：`shiki@4.5.0`，与 Library Lab 集成分支当前声明一致；来源代码重新编写，不继承历史演示测试通过结论。核心源码 MIT；内置主题/语法资产许可应随安装包检查。

## 安装和接口

```bash
pnpm add shiki@4.5.0
```

最小 Node/SSR 写法：

```ts
import {codeToTokens} from 'shiki'
const {tokens} = await codeToTokens('const x = 1', {
  lang:'typescript',theme:'github-light'
})
// tokens 是每行若干 token；内容始终作为文本处理
```

**当前浏览器 Demo** 使用 `shiki/bundle/web` 导出 `codeToTokens`，按需启动后才下载这个模块及对应语法/主题。为了简化可运行示例，使用 Web bundle；大规模产品应评估 `shiki/core` + 显式 grammar/theme 与 JavaScript Regex engine，避免大目录和不必要 WASM 下载。

## 三层场景

- basic：TypeScript 字符串高亮，并展示真实返回的行/token 数。
- business：用户在有限长度代码片段间切换语言，控制异步分析状态，避免 UI 渲染阻塞。
- advanced：输入 `<script>`、危险属性或其他不可信源代码，仅按 React 文本节点渲染 token，不使用 `dangerouslySetInnerHTML`。源代码依然可安全复制，不执行脚本。

执行实现位于 `examples/example.tsx`；`examples/demo.tsx` 为唯一入口，源码查看由生成器读取前者，防止演示代码与真实行为偏离。

## 最佳实践

1. **隔离职责**：仅做词法高亮；类型/语义错误由 TS/LSP/编译器/Schema 检查负责。
2. **异步竞态**：对输入使用大小限制、轻防抖，切换或卸载时忽略已过期结果。不要将一次旧代码的 token 回写到下一条内容。
3. **主题/语言加载**：长期高亮服务可缓存 Highlighter Promise、精确加载使用的语言与主题。不能为每个代码块新建 WASM 实例。
4. **安全输出**：推荐 HAST/token 节点安全渲染；若选择 HTML 字符串路径，必须在可信边界检视自定义 transformers、主题和注入策略，不直接接收任意 HTML 拼接。
5. **性能**：长文本、每字符刷新和大量并发代码块应使用 Worker 或分片/缓存；不要凭研究稿凭空报告体积、FPS 或耗时。

## 典型错误

错误一：把 Shiki 结果当可编辑 textarea；修复是采用 EditorView/Monaco。
错误二：每个 React render 都 `createHighlighter`；修复是缓存实例或用 shorthand。
错误三：未选中的 Tab 仍解析所有代码；修复是仅激活时加载并限制大小。
错误四：从远端 HTML 与代码字符串拼接出未经审查的 DOM；修复是 token 文本渲染或安全 HAST 流水线。

## 验收

`pnpm --filter @reactloom/library-lab typecheck`、`build` 与真实 Chrome smoke，检查英文/中文/恶意 HTML 原样文本、切换语言后无过期结果、首页无 Shiki 大 chunk 请求；运行前状态不记 PASS。

参考：[官方 API](https://shiki.style/guide/install)、[性能](https://shiki.style/guide/best-performance)、[Bundle](https://shiki.style/guide/bundles)。
