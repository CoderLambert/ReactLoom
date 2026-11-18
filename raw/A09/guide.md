# Excalidraw：编辑草图，再验证导入和只读边界

RSS流程评审需要移动节点、补充文字和导出图片，而不是执行一套自动化管道。`@excalidraw/excalidraw@0.18.1`提供真实手绘编辑器；本例用官方骨架转换API创建草图，观察元素身份与位置，再处理受限导入、PNG和只读。数据只在当前实例内存，不接RSS服务、模型、账号或协作后端。

当前内容为重新适配的`recreated`，历史研究来源保留，历史PASS不继承。需要端口和执行约束时看A06；文本可版本控制的图看A08。自由手绘内容不会自动变成可执行工作流。

## 三个实验

### 1. 从指针操作到场景元素

打开“嵌入式手绘画板”。点击矩形工具，在画布空白处按下、移动、松开；“非删除元素数”在停止变动约160ms后增加。展开“查看当前元素身份、位置与文字”，可读出真实SDK返回的id/type/x/y。用SDK撤销快捷键撤回，数量回到原值。

这是Canvas编辑器，不是用截图或伪SVG模拟。导入官方`index.css`，父容器必须有非零高度。`autoFocus={false}`不在挂载时抢焦点；`handleKeyboardGlobally={false}`让快捷键只在SDK自己的交互范围处理，不把宿主页面输入当白板命令。

### 2. 草图来自结构化骨架

打开“RSS流程草图与结构化初始元素”。`convertToExcalidrawElements`接收3个带label的矩形和2个箭头。label会生成独立绑定文字，因此初始正常场景是8个元素（3矩形、3文字、2箭头），不是5个。

移动一个节点，观察同id的坐标变化；可编辑文字。点“重置当前画布”清空当前实例，再点“恢复流程草图”调用`updateScene`重新生成骨架。恢复使用新生成的元素身份，不是恢复之前保存的快照；本例没有保存文档按钮。

`initialData`只用于首次挂载，不是受控属性。用户操作后不把onChange数组写回initialData。恢复和导入是本地明确动作，使用`CaptureUpdateAction.IMMEDIATELY`记录历史；远端协作更新应另行设计captureUpdate，不能照搬成本地撤销步。

### 3. 导入、拒绝恢复与只读

进阶层提供文件输入、PNG和“只读演示”。导入只接受`.excalidraw`/`.json`，先限制非空且不超过1.5MB，再交给真实`loadFromBlob`解析，之后检查最多200元素、无凭据HTTPS链接、无附件，以及几何/箭头/文字/自由绘制类型白名单。图片、embeddable、frame等不在教学导入范围。SDK嵌入验证也显式关闭。

导入成功通过`updateScene`替换当前元素；失败保留原画布并显示原因，可立即再选合法文件。文件输入会清空value，允许重试同一个文件。白名单是本例应用政策，不是Excalidraw能力上限，也不是完整通用schema安全审核。

勾选只读：SDK启用`viewModeEnabled`，应用同时禁用导入、重置和恢复；切换时递增操作代数，使进行中的导入/导出结果失效。PNG读取仍允许。取消只读不会复活旧操作。服务端写接口仍需自己的权限判断，前端只读不是授权。

“下载PNG”读取当前elements/files/appState，通过`exportToBlob`生成PNG，长边上限2048；空场景拒绝。字体、图片、浏览器Canvas或资源网络失败都可能使导出失败，错误会显示，不伪造成功图片。成功后本地下载，不上传。

## 生命周期和异步所有权

```text
官方骨架 → initialData / updateScene → SDK场景
SDK onChange → 160ms派生观察（不回写场景）
文件 → 字节限制 → loadFromBlob → 场景政策 → updateScene
PNG → exportToBlob → token/mounted/API身份检查 → 本地下载
重置 / 恢复 / 切只读 / 忽略 / 卸载 → 旧操作代数失效
```

`operationId`不是AbortSignal：SDK底层解析/导出可能继续，但旧结果不得更新画布、触发下载或覆盖新状态。“忽略当前导入或导出”明确表达这个边界。成功提交前同时核对代数、mounted、发起时API身份；导入还检查当前只读状态。

0.18.1在SDK构造函数交付excalidrawAPI。StrictMode会重放外层effect清理，但不保证再交付同一个API；因此组件保留私有candidate供effect恢复，只有active apiRef可执行命令，inactive时清空。真正卸载后组件引用随实例释放，不对外保存API。onChange在未挂载时不安排报告，计时回调也检查挂载标志。

卸载递增代数、清active API、防抖报告和下载timer，撤销本例创建的所有Blob URL；普通下载约2秒后撤销URL。SDK负责内部Canvas与输入监听，不遍历清理全站存储或其它条目资源。

## 迁移必要内容

复制`example.tsx`、`scene-policy.ts`、`styles.css`，按产品入口替换`demo.tsx`重导出。安装匹配0.18.1并导入官方CSS；使用客户端运行环境，不把浏览器SDK直接放进SSR服务端模块。0.18.1修复了0.18.0的特定Mermaid序列图标签漏洞，不代表所有外部内容都安全。[官方安全公告](https://github.com/excalidraw/excalidraw/security/advisories/GHSA-39h7-pwv7-rc3x)。

| 对象 | 这里如何处理 |
| --- | --- |
| elements | SDK场景事实；id稳定于一次编辑，报告过滤isDeleted |
| appState | 瞬时工具/选区；导入只应用本例背景色，不盲目恢复整个外部状态 |
| files | PNG需带上；教学导入拒绝附件和image元素 |
| link | 导入及onLinkOpen都拒绝非HTTPS/凭据URL；不是域名信任审核 |
| 初始场景 | initialData一次性；后续通过API更新 |

不要在render里创建元素、把initialData当双向受控源、每个pointermove同步保存、仅改按钮却遗漏在途回写，或把PNG当可编辑文档备份。外部场景进入产品前仍要做资源/权限/恶意复杂度及服务器边界检查。

## 字体和当前资源事实

目标包README明确默认从CDN下载使用到的字体；自托管需复制匹配版本fonts并在模块加载前设置`window.EXCALIDRAW_ASSET_PATH`。本例没有复制字体、修改全局资源路径或接入离线资产。外部字体网络、中文显示和PNG字形要在真实浏览器观察。旧assets BLOCKED缺少当前失败证据，现如实为NOT_RUN；不能据此猜测画布不能运行，也不能宣称离线已完成。

嵌入包为MIT；第三方图片、字体和品牌的具体分发条件分别核对。这里不复制未经确认的资源。当前Canvas不是可访问结构化内容的替代，三步RSS说明和元素观察提供文本入口；完整读屏、触控和中文IME仍需设备验收。

## 官方来源和验收边界

`official/readme.md`保留目标包原文，固定v0.18.1提交`a2ec2889babf7d2295469c6d90ebe77fae57df84`的`packages/excalidraw/README.md`，英文1631字节，SHA-256 `d3458f4ffe1617432989dfa40896255e805f0ddbad194873808ba7e8996e1f45`。固定完整tree共7个README候选，无上游中文README；locales/README是翻译贡献说明。具体时间、版本、候选在source-audit.json和library.json。

官网docs.excalidraw.com现重定向到plus.excalidraw.com/docs/sdk，GET200；完整响应头、最终URL和XFO/CSP null在official/homepage-response.json。未从Lab originiframe实测，因此unknown并保留直达。

普通Node导入真实SDK在当前Node26环境遇open-color JSON import attribute错误，未进入转换函数；这不是Vite浏览器失败，也不通过mock或改loader造SDK PASS。纯政策测试和入口类型不证明画布、字体或PNG。主控使用`validation/browser-proposal.txt`里的真实Playwright提案执行三个目标；正式verification保持NOT_RUN，六项与命令见local-validation.md。
