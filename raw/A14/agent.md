# A14 React Three Fiber 工程入口

先读library/guide、实际examples和verification。实际R3F9.8.2、Three0.186.0、React19.3.0；peer React>=19<19.4/Three>=0.156满足。MIT，只有本地原创几何，无纹理、模型、drei、WebGPU或HTTP。Canvas与手写Renderer不能共管画布。

## 三目标与迁移

basic：静态demand，理解真实Mesh/Geometry/Material/灯光及场景单位；business：射线hover/click与HTML等价按钮共用active，颜色更新复用Mesh/Material；advanced：useFrame秒delta、同Mesh换几何、帧门闩与整Canvas重挂载。不是三份同名业务壳。

sourceFiles六份：example/scene/frame-policy/visibility/workshop.css和demo适配器。整个查看器初始state读浏览器偏好，SSR集成需client-only/禁该子树预渲染，非已验证SSR-safe组件。容器高度300，DPR1..1.5、low-power；没有Lab alias或额外资源。React管HTML/业务状态，R3F协调Three对象，useFrame只改ref。无每帧setState；检查器主动读取，memo隔离检查器重绘，快照需要重新读。

真实UUID、geometry/type/vertices、material.color、rotation/scale、root frameloop/DPR/size和renderer.info来自对象。frameCallbacks只是本例回调次数，不是GPU指标。null表示当前generation未提交；每代Canvas拥有独立handle ref，卸载核对身份，旧Canvas不写新代ref。

## 必须保留

原shouldRunFrames和boundedFrameDelta，0..0.1秒封顶；暂停/系统减动/文档隐藏/离屏/零速度使advanced demand。demand仍允许必要更新帧，回调执行不等于正在旋转。matchMedia/visibility监听与IO都按所有权清理。基本和业务场景静态按需，advanced才持续旋转。

声明式geometry/material由R3F释放，不再手动重复dispose；本例没有primitive/dispose=null/共享缓存或外部renderer。几何变化保持Mesh，Canvas key只用于学习完整重建，产品优先复用Canvas。安装包释放可异步/空闲调度，DOM卸载不能等价全部GPU已释放。

Canvas fallback不是通用WebGL错误恢复。局部错误边界显示configure异常，外层HTML仍可操作；没有上下文丢失自动恢复。缺真实WebGL时BLOCKED，不mock GL来通过。射线必须真实Canvas点击；HTML按钮单独通过不证明拾取。

## 验证与官方

Node SDK仅真实R3F applyProps/buildGraph/dispose与实际Three对象，纯帧策略另记；不证明Canvas/useFrame/WebGL。三目标真实浏览器源码提案在validation/browser-proposal.txt，root统一接入。定位region React Three Fiber 实战，a14-workshop/stage/canvas-host/status/sdk-state；展开检查器后点“读取真实场景”。

官方v9.8.2 tag commit d74622ea8ed717f7212d7e19d65ff3e325508389的manifest实际9.8.1；npm/安装9.8.2及公开gitHead raw404分别保留。运行API按经官方npm sha512和bundle字节核对的安装9.8.2，不伪造manifest版本。tag完整tree无中文README，英语根readme原文14301B及sha/日期/完整HTTP证据在official；官网GET200无XFO/CSP但未Lab iframe，unknown。

完整状态/命令/日志/产物见local-validation，正式sdk/build/browser仍NOT_RUN。未声明InstancedMesh/资源加载/海量性能/实际GPU压力或屏幕阅读器验收。
