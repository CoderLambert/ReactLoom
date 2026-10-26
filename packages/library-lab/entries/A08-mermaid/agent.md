# A08 Mermaid — Agent 实施手册

选型：可版本化文本流程、时序、状态图；标准数据图表选择 A01/A02，富编辑白板选择 A09/A10。

基线 `mermaid@12.2.0` / MIT。读 `library.json` → `examples/example.tsx` → `guide.md` → `verification.json`。只有固定 presets 的 Mermaid DSL 在本演示里可渲染；不把任意用户输入升级成可信 HTML。

## 必须保留
- 动态 import，避免首页装入 Mermaid 全量解析器。
- 可信配置 `initialize({startOnLoad:false,securityLevel:'strict'})`，绝不能传入远程 JSON。
- `parse(...,{suppressErrors:true})` 先验证、每次 `render()` 使用独立 ID；异步结果要被 mounted flag 拦截。
- 将 SVG 放入不带 allow-scripts/allow-same-origin 的 sandbox iframe，保留 DSL 原文和语义说明。若业务要点选交互，应另设计受信任隔离及消息协议。

## 反例和安全
不要调用旧 `mermaid.init`；不要把 `render` SVG 直接当可信 HTML 注入宿主；不要接受未受限的图节点数/递归复杂度；特别核对 GitHub advisory GHSA-c4c3-pg64-4m4v 的受影响范围。用户自定义配置必须拒绝，不能只靠字符串替换净化。

## 测试断言
有效 flowchart / sequence / state 均显示；无效 DSL 显示失败，修复后恢复；切页后旧 promise 不回写；iframe 不可运行脚本；本 SDK 构建实际 PASS 前所有文档保持 NOT_RUN。官网 https://mermaid.ai/open-source/config/setup/mermaid/interfaces/Mermaid.html
