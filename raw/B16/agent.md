# B16 react-resizable-panels 工程迁移

## 选择与版本

线性相邻窗格的指针/键盘调整用本库；固定布局用 CSS，二维仪表盘用 B15，内容排序用 B13。固定 react-resizable-panels 4.14.1 / MIT，实装 React 19.3.0，React/DOM peer ^18 || ^19。v4 的 Group/Panel/Separator、orientation 已核对安装类型和 source map 原始源码。旧研究的其他补丁不等于当前安装能力。

## 当前三目标

- basic：35/65 双栏，资源 16%–60%，主区 min22%；真实指针/左右键/Home/End。
- business：25/45/30 三栏，检查器 15%–55%；两根真实 Separator、F6/Shift+F6、稳定 panel id，尺寸与 DOM 几何同源。
- advanced：横/纵切换、上下键、重挂复位；默认比例重新发布，来源为初始化/程序变更。没有持久化或折叠。

## 必须保留的契约

Panel 尺寸 props 数字按 px，百分比用明确 "25%"。Layout/getLayout/setLayout/defaultLayout 的映射数字是百分比，不能混淆。百分比基于扣除分割条后的轴空间。

onLayoutChange 是拖动高频；onLayoutChanged 对指针在释放后通知，但**挂载/约束/程序操作也通知**。读取 meta.isUserInteraction 区分输入，不能看到 callback 就声称用户拖动。本例 snapshot 保存实际 layout 副本、尺寸表与 JSON 都读同一对象；没有自行推导一个假 SDK 布局。requestedLayout 是约束前请求值，持久化如何选需另定，不在本例实现。

useId+业务后缀稳定身份，Group key 含 level/方向/generation；重挂就是主动放弃旧布局。切换/复位先清旧 snapshot，SDK 新挂载随后填入默认布局，不能保留旧文“直到再次拖动才显示”。横向 Group 对应竖向 separator ARIA；纵向 Group 对应横向 separator，不能据此把 SDK 标为方向错误。

## 迁移与清理

复制 example.tsx 和 panels.css，demo.tsx 只是出口；pnpm add react-resizable-panels@4.14.1。无 Lab alias/资产/HTTP/存储。保持320px高外框、min-width0、滚动内容、真实Separator的名字和焦点样式；不要覆盖SDK flex布局。Panel className作用在内层内容div，data-b16-panel保留在外层。

应用只拥有React状态。SDK own Group轴/ResizeObserver/Separator订阅与键盘，文档指针监听按同document Group引用计数；最后一个Group才清共享监听。只卸载自己的子树，不清全局状态。无自建timer/observer/持久化需要手动dispose。Node SSR不执行这些客户端效果，不能代替生命周期验收。

未接入：useGroupRef/setLayout、usePanelRef/折叠、useDefaultLayout、Grid、嵌套Group、预览模式、网络保存。不要把未挂载能力添加到验收声明。

## 精确验证入口

区域“可调整尺寸的工作面板”、b16-workshop / data-level、data-orientation；separator名字“调整项目资源和主编辑区域”“调整编辑区域和检查面板”。b16-layout-source显示实际meta来源；b16-layout在details内显示原始映射（先展开“查看 SDK 原始布局映射”）；外层[data-b16-panel=explorer/main/inspector]有真实SDK id。高级控件“纵向排列”“复位布局”。完整三条真实Playwright提案见validation/browser-proposal.txt。

Node SDK只静态SSR与匹配类型，不是布局求解/拖动PASS。没有必要再造一个纯函数约束算法来替SDK验收。实际指针、键盘、几何、窄屏和卸载覆盖见 local-validation.md；触屏/读屏/SSR hydration另列NOT_RUN。正式verification保持NOT_RUN，local-validation日志不提升正式状态。

## 官方

原README固定4.14.1 commit0cd376c57a19900d22f33aa8eb46f417a7437c12；27652B/hash d27812bc8cf8a5e07f0a58bcf68a8f48cc3cac4d22f917777e62662ab61c231c，完整tree无中文。官网GET200完整头未见XFO/CSP，实际Lab iframe未验所以unknown；不把缺头当allowed。原文/时间/来源在official，全部检查命令与剩余在local-validation.md。
