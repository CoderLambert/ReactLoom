# Mermaid 12.2.0：代码化流程图和安全边界

## 适用场景
Mermaid 将可审查的 DSL 文本转换为 SVG，适合架构说明、API 时序、状态机、文档里的系统流程。它不是业务数据的高频实时图表，也不适合复杂矢量编辑器。不要把 Mermaid 源当作可执行 JavaScript。

## 安装与最小实例
```bash
pnpm add mermaid@12.2.0
```
```ts
import mermaid from 'mermaid';
mermaid.initialize({startOnLoad:false,securityLevel:'strict'});
const parsed=await mermaid.parse('flowchart LR\n A-->B',{suppressErrors:true});
if(parsed){const {svg}=await mermaid.render('unique-diagram-id','flowchart LR\n A-->B');}
```
示例真实源码：`examples/example.tsx`，`examples/demo.tsx` 只用于注册。Mermaid 为重包，仅进入当前 Demo 时下载，首页不应静态导入。

## 三层教学
基础预置 flowchart；业务使用 sequenceDiagram 展示浏览器、API、Worker 的调用；高级状态图包含加载成功/失败/重试，能切换无效 DSL，主动触发 `parse` 返回失败，界面显示错误而不是错误地保留旧 SVG。

## 图形安全与不信任边界
`mermaid.initialize()` 只能接收开发者定义的配置，不可透传 HTTP body 或用户 JSON。Mermaid 11.16.0 及之前存在配置原型污染漏洞；12.2.0 是核查的新版基线。此示例没有用户自由编辑器，SVG 被放在**无脚本、opaque-origin sandbox iframe**中。动态解析任意上传的图必须进一步设计输入大小限制、图类型白名单、CSP 和隔离子域，不能认为 `securityLevel:'strict'` 已覆盖所有宿主风险。

## 全局状态与 ID 唯一性
Mermaid 初始化是模块全局设置，因此在受控模块中只初始化一次；连续渲染生成全局唯一 `render` ID，避免 StrictMode 或快速切换导致 SVG ID 冲突。React effect 使用 active 标记防止切换页面后异步渲染回写。SDK 在后台仍可能完成计算，因此大规模图还需要独立 Worker 或用户显式取消设计。

## 三类常见反例
1. 使用 `init()` / `mermaidAPI` 旧接口；新版按 `initialize` + `parse` + `render`。
2. 不同页面使用同一 render ID；SVG 的 clipPath/marker 会发生跨图冲突，必须唯一。
3. 将任意用户 JSON 合并到 `initialize`：旧漏洞和安全配置覆盖风险。只允许开发者维护的固定对象。
4. 直接将生成的 SVG 塞进普通 div 并运行插件脚本；此 Demo 使用无脚本沙箱且不依赖 click events。
5. 只提供图片，不提供 DSL/文本说明；必须保留可复制的源和无障碍图描述。

## 生产组合和迁移
可在 Markdown 阅读器遇到 `mermaid` code fence 后才 import Mermaid，注意 DOM 净化组件和独立 iframe；多图时不要对整个页面重复调用 `run()`。若用于 AI 生成图表，先做 DSL 类型和大小限制，绝不能把模型生成的 `%%{init}%%` 视为站点受信任配置。

## 验证说明
真实 SDK/构建/浏览器均 NOT_RUN。后续至少测试：3个图类型成功、非法DSL恢复、快速Tab切换无旧图、iframe无脚本权限、依赖在默认bundle中缺席。以上尚未形成实测 PASS。

## 官方资料
- [Mermaid 配置、parse/render API](https://mermaid.ai/open-source/config/setup/mermaid/interfaces/Mermaid.html)
- [2026-08-04 原型污染安全通告](https://github.com/mermaid-js/mermaid/security/advisories/GHSA-c4c3-pg64-4m4v)
- [官方仓库](https://github.com/mermaid-js/mermaid)

MIT 许可；不包含远程图片和第三方素材。
