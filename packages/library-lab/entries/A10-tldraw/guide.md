# A10 · tldraw：无限画布、形状 Store、业务权限和许可证

## 选型前先确定你的产品性质

tldraw 提供 React 可嵌入的无限画布、形状数据库、手势工具、画面缩放、相机与快照能力。适用于创意白板、批注、自由图形编辑和可编程图形应用。若只要 Mermaid 文字架构图或 React Flow 类型化连接图，应先选更窄的工具，避免导入大体积 SDK。

**许可证是技术方案的一部分**：本示例锁定 `tldraw@5.5.2`，它不是普通 MIT 库。官方许可证页面要求生产环境有效 license key，商业/试用/非商业类型条件不同。本示例未注册 key，因此仅允许本机 localhost/127.0.0.1 编辑器挂载；非本机部署缺 key 时只展示授权提示，不注入假密钥或移除水印。真实生产部署前必须自行取得合法授权。参见 [官方许可证](https://tldraw.dev/sdk-features/license-key)。

## 安装与最小引用

~~~bash
pnpm add tldraw@5.5.2
~~~

~~~tsx
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';

<div style={{ height: 450, position: 'relative' }}>
  <Tldraw autoFocus={false} />
</div>
~~~

当业务需要分享或部署，传入自己持有的 `licenseKey`，不可把占位字符串作为凭证。tldraw 使用 React 18/19；还需确认构建工具、静态资源、字体与 CSP。

## 本库三个真实示例

**基础**：渲染完整官方编辑器、画笔和选择工具；父容器有明确高度。禁用自动抢焦点，避免进入 Lab 切换 Tab 就劫持键盘。

**业务**：调用真实 `Editor.createShape` 创建包含 `toRichText` 文本的四个节点：RSS 获取、清洗、分类、审核。无需自研 drag/zoom 事件。通过 `Editor.zoomToFit` 查看全部节点。

**进阶**：调用 `Editor.run` 作为单批次创建事务，仅对示例提供的程序化创建按钮限制当前画布总形状数为 80（原生画笔绘制不受此代码限制）；用 `Editor.updateInstanceState({isReadonly:true})` 切换只读，测试工具栏/变更 API 是否不可操作。按需导出 `getSnapshot(editor.store).document` 的真实文档 JSON，而不是仅截图。只读为客户端会话状态，不等于后端权限。

Demo 的代码来自 `examples/example.tsx`。`examples/demo.tsx` 是Lab入口复用，`examples/styles.css` 只承担容器尺寸/本地样式。三层选择共用 SDK 实现，不表示三个独立构建。

## Store 与数据所有权

tldraw Editor 有文档模型（shapes/pages/assets）与实例态（焦点/相机/选择/readonly）。文档可通过 `getSnapshot/loadSnapshot` 迁移，但**迁移必须使用官方验证与 schema 版本，不允许直接反序列化任意用户文件到 store**。本阶段仅提供导出，避免没有导入限制就宣称实现了恢复。

本示例**不设置 `persistenceKey`**，防止跨条目写入共享 IndexedDB。正式产品需要保存快照时必须指定稳定文档 ID、大小上限、schema 迁移路径、并发冲突策略和清理范围；多人同步需要另行使用成熟协作协议与访问控制，不能用单机 key 当作多人权限。

## 五个容易出错的点

1. 缺 CSS/容器高度：编辑区域消失、坐标错误。先验证父容器宽高、Z-index和Portal。
2. 将 tldraw 视为普通自由许可证组件：正式部署不提供授权会违反SDK生产条件。
3. 把 readonly 当服务端权限：攻击者仍可直接调业务 API；后端必须核验读写权限。
4. 保存整个 store 当成业务文档：相机、选择和临时状态无须覆盖业务持久化；至少区分 `snapshot.document` 与会话数据。
5. 无限调用 `createShapes`：没有业务上限时重型内容消耗内存；本实验仅对程序化新增设80形状上限并使用单批事务。原生工具仍能继续绘制，生产文档上限须由产品层单独设计和验证，不能将示例按钮上限称为全局配额。
6. 未释放 `Editor.store.listen`：每次重新挂载倍增订阅。本实现通过 `onMount` 返回函数注销。

## 性能 / 安全 / 可访问性

对输入规模进行上限控制，业务类操作提供键盘按钮替代拖拽；语义文本必须独立于 Canvas 保存。界面缩放、触控、IME、嵌入宿主的 Tab/Escape 焦点、只读切换、StrictMode 双挂载、历史记录持久性与生产许可证需在真实浏览器验收，不能用文件结构检查代替。批量场景不是压力测试成绩。

## 实际验证顺序

集成方先确认 `tldraw@5.5.2` 和 React19 的真实 lockfile，再运行 Lab `catalog:check / typecheck / build`；在本机环境手动/Playwright 运行三层示例，检查形状数量、只读保护、业务快照、卸载订阅、移动端与输入焦点。无运行证明时 `verification.json` 保持 NOT_RUN。

## 官方引用

- [安装](https://tldraw.dev/installation)
- [Editor API](https://tldraw.dev/sdk-features/editor)
- [只读](https://tldraw.dev/sdk-features/readonly)
- [许可证和不同主机的限制](https://tldraw.dev/sdk-features/license-key)
- [npm 5.5.2](https://www.npmjs.com/package/tldraw)
