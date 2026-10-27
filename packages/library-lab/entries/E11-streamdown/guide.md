# E11 Streamdown — AI 流式 Markdown（独立重建）

## 解决的具体问题
聊天/研究型应用会不断追加不完整 Markdown：半个代码围栏、暂未写完的表格与加粗标记。普通一次性 Markdown 渲染容易在流中抖动。Streamdown 提供面向流式文本的解析、格式化、Markdown 扩展和渲染。**本页是依据官方资料重新实现，不是历史原件恢复；旧研究只有摘要。**

## 安装与运行
```bash
pnpm add streamdown@2.6.0
```
`examples/example.tsx` 直接 `import {Streamdown} from 'streamdown'`。Vite/React 宿主内只在打开 Demo 时加载包。UI 只追加本地消息文本，**没有 LLM 或网络调用**。CSS 的 Tailwind v4 内容扫描应按官方 monorepo 文档设置 `@source` 路径，不能将示例的样式误判为库原生输出。

## 三层实战与观察
入门：从空串追加 `# 标题` 和未闭合粗体，`isAnimating` 表明流式阶段。
业务：新闻研究摘要的表格和 checklist 渐进到达；每次收到的文本都是**累积全文**，不是只喂本次 delta。
进阶：追加代码围栏、原始 HTML 与 `javascript:` 链接。默认不执行 HTML，不能开启任意 `fallbackComponent`。输出必须在真浏览器验证恶意链接不可点击。

## 生产数据流与生命周期
网络 chunk → 以单个消息 ID 累积全文 → 增量 UI → 消息完成后停止动画 → 形成可稳定选择/复制的结果。**不要把 model delta 直接覆盖旧文本**。高频 token 建议做动画帧/批量渲染节流，避免每 token 一次整个线程重绘。离开 Tab 必须停止定时器与请求；演示中的计时器 cleanup 通过 React effect 完成。

## 反例
1. 每次网络 chunk 覆盖 `children`，旧正文消失。修复：按照消息 ID 追加并传累计全文。
2. 只对流式片段做 sanitize 后拼接 HTML。修复：保留纯 Markdown 源、使用成熟解析/安全边界，禁止拼 DOM HTML。
3. 对 untrusted Markdown 打开动态标签或任意自定义渲染器。修复：限制 schema/安全 URL，沙箱对待第三方 HTML。
4. 未限定图片和外链，打开页面触发不必要请求。修复：产品策略里禁用/代理未授权远程资源，防追踪像素。
5. 用无界消息数组重复处理超长全文。修复：消息列表虚拟化、逐条分批处理并给代码块大小预算。

## 可复用场景
E12 assistant-ui 提供消息/取消/编辑运行时，E11 负责每条消息正文展示；E06 react-markdown 适合静态文章；E07 remark/E08 rehype 作为解析管道工具。不要重复创建第二份聊天状态。

## 练习与验收
连续追加1000个小 chunk 后在中途取消、重进详情：不应有旧回调回写；对恶意 URL 测试点击/网络请求；校验代码块、中文 IME、键盘焦点以及 Tab 卸载。此批 SDK/浏览器/完整构建仍为 NOT_RUN/BLOCKED，不能继承 Slack 历史测试。

## 官方
- https://github.com/vercel/streamdown
- https://streamdown.ai
- Apache-2.0（使用前核对发行包 LICENSE）。
