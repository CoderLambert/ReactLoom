# A09 · Excalidraw：将手绘白板变成可维护的业务资产

## 解决的问题与适用边界

Excalidraw 的价值是**让产品、研发与运营以手绘风格快速交换视觉流程**，不仅是渲染一个 Canvas。典型场景包括产品评审草图、系统边界讨论、工单流程和 RSS 内容处理流程。若主要诉求是可解析的有向图、强约束节点编辑或大规模关系图，应比较 A06 React Flow、A07 G6。需要 Git Diff 与自动生成的结构化流程图，应先考虑 A08 Mermaid。

此项目按 `@excalidraw/excalidraw@0.18.1` 编写，跟随 ReactLoom 的 React 19。此处是重新实现的教学示例；原研究文档已经恢复，但它的旧测试不是本次集成的 SDK 验证。

## 安装、引入与最小画布

~~~bash
pnpm add @excalidraw/excalidraw@0.18.1
~~~

~~~tsx
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';

// 必须有非零高度，避免画布布局为 0。
<div style={{ height: 420, position: 'relative' }}>
  <Excalidraw autoFocus={false} handleKeyboardGlobally={false} />
</div>
~~~

生产中切忌在应用入口直接同步加载。Library Lab 使用代码分割：只有用户进入 Demo Tab 并显式启动后，才导入示例模块。编辑器内部字体默认可能向 Excalidraw CDN 请求；需离线或严格 CSP 时按官方字体目录复制和设置 `window.EXCALIDRAW_ASSET_PATH`，且检查字体许可。

## 三层实战：源码与展示完全同源

**基础**：`examples/example.tsx` 实际挂载官方 Excalidraw，绘图工具、移动/缩放/撤销由 SDK 负责。包含不依赖绘图区域的文本说明，键盘快捷键不允许劫持 Lab 整个页面。

**业务**：通过 `convertToExcalidrawElements` 将 RSS 获取、清洗分类、人工审核转换为官方完整元素，再调用 `api.updateScene` 更新。初始值仅在挂载阶段解析一次；修改已挂载画布应走 API，而不是反复更改 `initialData`。

**进阶**：`api.getSceneElements / getAppState / getFiles` 提供真实场景，`exportToBlob` 导出 PNG。文件导入调用 `loadFromBlob`，但先校验大小（1.5 MB）、总元素（200）和 URL 协议；不接受内嵌二进制附件。导入/导出是异步 SDK 操作，必须通过操作代号防止旧文件在用户重置、替换场景或退出 Tab 后回写；“忽略结果”只防止旧结果使用，不代表能够中止 SDK 内部解析。`viewModeEnabled` 改为只读展示。导出 Object URL 在下载后/卸载时回收，场景初始化不会写入网站其它空间。

这里的“安全校验”只是 Demo 的一组防护，不代表已经为所有不可信 Excalidraw 文档提供充分的隔离与审计；真实业务还需授权、schema/资产策略和持久化校验。

## 数据所有权与工程机制

React 管理演示级只读/导入状态；画板自身的场景、撤销栈、缩放、焦点归 Excalidraw。组件销毁时清理本组件的 timer/URL，编辑器实例由 SDK 组件自身卸载。不要向全局增加并保持 document 事件监听；无服务端存储，不会跨 Tab/设备同步。

真正的协作要定义：文档 ID、操作版本或 CRDT 同步协议、权限、离线回补、冲突处理、图片上传和安全 URL 白名单。仅用 LocalStorage 或模拟 revision 对话不能替代协作系统。

## 必须避免的错误

1. **忘记 CSS 或容器高度**：显示空白、坐标不准或控件错位；先检查 CSS import 与父容器大小。
2. **修改 initialData 后期待即时更新**：它只负责初始数据；已挂载编辑器用 `excalidrawAPI` 的 `updateScene`。
3. **把视图当数据库**：导出图形不等于保存业务语义；应保存受验证的 scene、用户权限和一致的版本 ID，服务端复核。
4. **直接信任导入文件和元素链接**：限制大小/数量，拒绝 javascript: 等协议，二进制附件需独立审计。
5. **将 SVG/PNG 当全量可编辑文档**：它们是导出图，回编要使用合法 Excalidraw 场景数据。
6. **把字体和素材许可归入 MIT 代码许可**：字体、模板、品牌、图片可能另行授权，发布前逐项核对。

## 性能、可访问性和检查

不要为避免重渲染给每个 `onChange` 事件无条件同步写入 React 上层业务状态；本示例按 160ms 节流展示元素数量。批量节点或大图形应单独量测内存与重绘时间，不拿 DOM 语法检查代替 Canvas 性能。Web 画板对屏幕阅读器支持有限：提供同步文本流程、可操作的 HTML 按钮和状态公告，颜色不能作为唯一信息。

执行最小验证：安装后在集成仓库中运行 `pnpm --filter @reactloom/library-lab typecheck`、`build`、目标页面 Playwright；检查画板绘制、导入限制、导出、只读、切换 Tab 销毁/重启、字体网络、StrictMode 重复挂载和焦点恢复。未执行时一律 NOT_RUN。

## Agent 迁移建议

复制 `examples/example.tsx` 并优先抽离白板业务数据；不要复制实验室路由、全局 CSS、下载测试文字。变更生产系统前，先核对已安装 Excalidraw 的导出 API 与资产路径；对协作协议和文件链接另做安全评审。

## 官方出处

- [嵌入与字体](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/installation)
- [编辑器 API](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/props/excalidraw-api)
- [简化元素创建](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/excalidraw-element-skeleton)
- [工具库源代码与 MIT 授权](https://github.com/excalidraw/excalidraw)
