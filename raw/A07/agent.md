# A07 AntV G6 5.1.1 工程入口

用于依赖网络和关系探索；端口/流程编辑优先 A06，文档 DSL 图优先 A08。本例固定坐标、默认 Canvas、原生 Graph，无 React 扩展、WebGL、自动布局或远程图服务。MIT；外部资源另查授权。

## 真实实现

- `graph-data.ts` 一份 nodes/edges 供画布和文本使用。稳定 id，边端点存在；size42 是圆尺寸/直径。SDK getNodeData 顺序可能保留插入次序，不能当业务步骤顺序。
- basic：3节点2边，Graph.render，真实节点点击与可操作文本按钮共同设置 selected 状态。
- business：4/3 ↔ 3/2，setData 后 await render，不重建 Graph；autoFit 会重置相机。删除已选审校清空选择。
- advanced：ResizeObserver/rAF→setSize+await fitView，窄容器最多320px；显式重建才替换实例。动画关闭，无持续 timer。
- a07-sdk-state 通过真实 getter 读取 rendered、size、zoom、nodes/edges/state 和事件计数；app instance 是本例序号，不是 SDK id。client 是 getClientByCanvas 转换的 CSS 视口坐标。

## 不可删的所有权

`async-owner.ts` 为本例自建：每实例串行 render/fitView/setElementState，跳过未开始的旧意图；await 后验证代际再写 UI。它不 abort 已运行的 SDK 操作。

cleanup 立即 disposed、移除 Graph 事件、断开 observer、取消 rAF、分离专属 mount，等待已有任务结算后 destroy 一次。5.1.1 prepare 等待 Canvas.ready；不要把 destroy 移到 render 尚未结算时。旧任务必须持旧专属容器。销毁失败留在 detached mount 的 data-cleanup-error，不得冒充成功。

宽度非有限/小于1时等待，最大4096。不要添加撑破手机的最小宽度。固定图坐标与 client 不可混用。只换普通样式可 updateNodeData+draw；本例选择走 setElementState(states,false)。不要引入 v4 changeData/save/read。

## 迁移与验收

每个 Demo sourceFiles 都包含七个实际文件（入口、组件、数据、配置、所有权、尺寸、CSS）。依赖 @antv/g6@5.1.1、React、浏览器 DOM/Canvas/ResizeObserver；无 Lab alias/额外资源。远程请求/权限不是 G6 职责。

控件和预期见 guide 三目标；Playwright 源码提案在 validation/browser-proposal.txt。断言同实例更新、真实状态/节点命中、窄屏 fitView、旧容器分离且最终 graphDestroyed、快速切换和卸载不写回。只数 Canvas 不能证明旧实例 destroy。

tests/sdk.test.mjs 是实际 G6 模型执行（3项，无 DOM/render）；async-owner 和 graph-sizing 共7项是纯策略。不可称为图形运行 PASS。实际命令/退出码/输入/日志见 local-validation.md；正式 verification 三项保持 NOT_RUN，主控后续真实浏览器另留收据。

官方中文 README 固定 5.1.1 提交 5a5551cea13d021d12c90a87116e3c6092d53210；metadata 含版本/语言/日期/sha。官网完整 GET 头未发现 XFO/CSP，但 Lab-origin 尚未实测，状态 unknown，不得改 allowed。当前官网可能升级，API 优先匹配安装源码/声明。
