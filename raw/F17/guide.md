# axe-core：局部 DOM 的三条规则与修复对照

固定axe-core4.14.0，MPL-2.0。给React组件做自动可访问性检查，得到规则id、impact、说明和受影响节点；适合在测试里快速发现可计算的语义问题。自动规则无法替代键盘走查、人工读屏或完整WCAG验收。本例只运行image-alt、label、button-name，不扫描整站。

## 三个实验

| 目标 | 操作 | 未修复预期 | 修复后预期 |
| --- | --- | --- | --- |
| basic：替代文本 | 点击审计，再勾选修复重审 | image-alt共1条 | 0条 |
| business：关联标签 | 同样对照输入框 | label共1条 | 0条 |
| advanced：组合与作用域 | 同时观察图/输入/空按钮 | 三规则共3条 | 0条 |

Chromium 实测缺陷版为 1、1、3，修复版均为 0。运行证据见 [local-validation.md](local-validation.md)。

## 4.14规则实际边界

实装axe.js的label规则any包含implicit-label、explicit-label、aria-label、aria-labelledby、non-empty-title、**non-empty-placeholder**。所以原夹具虽然只有视觉span，但非空placeholder仍让此规则通过。已把缺陷态placeholder移除，修复态才可出现；修复真正依靠label htmlFor=useId关联input，不靠placeholder。placeholder不是持久可见标签、不是完整表单体验，但不能因此错误预测4.14的label必失败。零违反仍仅说明选定规则未发现问题。

图片为原创透明1×1 GIF数据，占位背景不是实拍素材；修复补示例alt仅为教学规则，不推广到生产内容描述。advanced空按钮缺文字/aria-label，修复同时添加可见“添加”和明确aria-label。

## 完整迁入与调用

React19、axe-core4.14.0、TypeScript DOM/react-jsx/Bundler；复制example.tsx和audit-queue.mjs/.d.mts三个原件。demo.tsx仅Lab适配，不必复制。挂载 `<AxeAuditExample level="business" />`，生产只复制修复态DOM，不能把故意缺陷或这三条runOnly当完整审计策略。

数据路径：ref容器→用户手动audit→同步running防重入→共享队列→真实axe.run(container,{runOnly:{type:'rule',values:[...]}})→当前generation才写violations/incomplete。输出的违反数是规则数量，不是违规节点数量；target保留节点定位。incomplete单独计数且要求人工判定。

队列自建，不是axe SDK。模块单例tail串行，失败通过尾promise恢复；排队前检查token、ref相同、isConnected，失效返回skipped不开始SDK调用。它仅协调使用同一helper实例的扫描，无法约束第三方另外调用axe.run；不要声称全页全局锁。

## 清理与限制

level作为key重挂会话。卸载增加generation、清自身running，排队任务会跳过；已开始的axe.run无法物理取消，结束后旧结果/错误/finally不会写入新会话。修复切换也失效旧代次并清结果，扫描期间修复控件禁用，避免修改被扫描DOM。没有添加全局监听、timer、Worker或URL，不需要伪造SDK destroy。若底层扫描永不settle，队列也会等待；本例不提供引擎中止。

axe局部上下文只包含ref子树；Lab外壳故意坏DOM不应污染结果。换层可卸载已扫描容器，旧任务可能失败，仍只丢弃；停止/重挂必须观察新会话可再次扫描，不以DOM消失称SDK取消成功。真实浏览器验证由主控已有quality-resume-axe配方执行，覆盖1/1/3→0、外部坏DOM与停止重挂。作者本次不跑共享浏览器。

## 可复核证据

Node audit-queue.test四项仅证明串行/失效跳过/异步与同步失败恢复，不import axe-core，不叫规则SDK PASS。三个原件隔离strict和scopedBiome另记。正式verification无收据均NOT_RUN。Chromium 也验证了容器外缺陷不进入结果，以及卸载后的旧结果不会发布到新会话。

官方README固定v4.14.0 commit e797173108eadfa4355fe06af331791734e1757f原文（该树根只有英文README），与LICENSE/package字段保存在official，重新GET比对。官网deque.com/axe真实GET200但CSP frame-ancestors 'self'，跨源Lab blocked，保留直达。声明许可与规则解释都按实际安装/固定源码核对，不按记忆推测。
