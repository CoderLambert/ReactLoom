# Mermaid 12.2.0 工程复用

适用：可版本控制的流程、时序和状态说明；DSL是维护源，SVG是生成结果。交互节点编辑用React Flow，大关系探索用G6。

## 接入路径

先读 `examples/diagram-source.ts` 的受控业务投影，再读 `example.tsx` 和 `render-queue.ts`。复制上述三文件及 `workshop.css`；`demo.tsx`只作Lab适配。真实依赖为 `mermaid@12.2.0`、React浏览器环境，render依赖DOM，不在SSR直接调用。

本查看器一次initialize：关闭扫描、strict、neutral、suppressErrorRendering；之后parse检查语法，唯一id的render返回SVG。模块配置由应用统一拥有，多个集成要协调，不能合并远程配置。当前12.2.0实际默认layout为elk，Node引擎>=22.12。

## 三个目标

- basic：去重开关生成分支DSL，真实流程图与文本替代同步。固定节点id和fixture标签来自程序。
- business：缓存开关改变sequence消息，Worker保留参与者身份但缓存路径不发送消息。没有真实API/缓存。
- advanced：真实非法DSL清空旧iframe，恢复重新绘制。状态图是描述，不是可执行状态机。

## 生命周期与边界

队列串行parse+render；调用前和提交前检查当前effect。卸载使任务过期，但不取消正在运行的布局；后续任务仍可执行。每次render递增id，不复用marker/clipPath标识。iframe空sandbox、no-referrer，保留父页文本替代与DSL中的accTitle/accDescr。不调用bindFunctions。

父页不能通过常规DOM访问opaque iframe；Playwright等浏览器工具仍能观察其内容。strict和iframe不是任意DSL/远程配置的通行证，迁入Markdown需另加图类型/长度/规模预算。

## 验证重点

实际SVG必须有节点/消息文字和有效尺寸；去重和缓存开关同时改变源文与SVG；非法后旧图消失、恢复成功；快速切换/离开Demo不得回写过期状态或遗留SDK临时节点。`render-queue.test.mts`只证明自建队列，不证明SDK绘图。正式sdk/build/browser状态以匹配recorder收据为准，本地运行记录独立见local-validation.md。
