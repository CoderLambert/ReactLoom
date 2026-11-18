# react-konva：让 React 节点状态驱动画布

审核人员把“采集 RSS、翻译、审核发布”摆成一张草图，需要选择、移动、增删，再把坐标交回业务状态。react-konva把Konva场景图表达为React组件：Stage持有舞台，Layer绘制，Group把矩形和文字作为一个可拖单元。它不是完整白板或执行引擎；这里三张卡片是本地教学数据，不请求RSS或翻译服务。

当前锁定`react-konva@19.3.2`、`konva@10.9.0`与React19.3.0，MIT。19.3.2的peer是React/React DOM `^19.3.0`，不要迁进React19.2项目后靠浮动版本碰运气。条目为recreated，历史来源保留，不继承旧PASS。不需要React时对照A11命令式Konva；需要完整手绘白板可评估A09。

## 三个可操作目标

### 1. 同一份状态，Canvas和表格同时变化

入门层有三节点，初始采集RSS在世界坐标(28,58)。下拉和表格按钮都按稳定id选择节点。用键盘聚焦“键盘替代：右移12px”，按Enter，表中x变40，Canvas矩形也右移。点击真实Canvas里的另一张卡片，选择控件应切到对应id。

本层不开放拖拽。Canvas里的Text是位图字形，不是可访问输入框，DOM下拉/按钮和语义表格提供等价操作。图元不应强行伪装成HTML节点。

```tsx
<Group key={node.id} x={node.x} y={node.y}>
  <Rect width={132} height={52} fill={node.fill} />
  <Text text={node.title} listening={false} />
</Group>
```

业务数组是唯一事实源，key/id保持身份。props更新由真实react-konva renderer应用到Konva对象，不需要再创建命令式Stage。

### 2. 拖动预览，松手提交世界坐标

业务层开放Group draggable。拖动中Konva先改变临时位置，`onDragMove`把它夹进世界范围；松手读取真实位置，四舍五入后写入React state。表格中的相同id随之更新。

```tsx
onDragEnd={(event) => {
  const next = clampNodePosition(event.target.position())
  event.target.position(next)
  update(node.id, next)
}}
```

这里直接设置实例位置是边界修正：默认非strict模式只同步发生变化的props，若旧state和新边界值相同，单靠setState不能保证覆盖拖拽临时attrs。实际节点与业务坐标要一起收敛。`_useStrictMode`是react-konva的props同步开关，与React StrictMode不同；本例没有开启，也不在拖动中用旧state强制覆盖位置。

背景和虚线在`listening={false}`的Layer，不参与命中。文字也不拦命中。虚线只按数组相邻项装饰连接；拖动期间它读的是已提交state，松手才跟随，不是独立端口模型或实时执行边。

### 3. 响应式尺寸、增删和仅锁定拖拽

进阶层点“新增节点（上限24）”，节点数组、表格和真实Canvas同时增加；选择新节点再删除，稳定id从React树移除。允许从23新增到24，达到24后按钮禁用且状态更新函数再检查上限。删除后选择剩余第一项，空场景则禁用删除。

勾选“锁定拖拽”后Group draggable=false，但DOM右移和增删仍可用。这是输入方式开关，不是只读或权限。取消锁定恢复真实拖拽。

将浏览器变窄，容器ResizeObserver更新Stage像素尺寸和scale，节点世界坐标保持不变。停止并卸载后Canvas应移除，重新运行回到三初始节点。没有持久化、PNG、文字编辑或协作。

## 世界坐标与显示像素

世界固定620×260，卡片132×52。`clampNodePosition`限制x为0..488、y为0..208，非有限数回0并取整。`stageScale(width)=min(1, measuredWidth/620)`；测量宽度只保护到1..4096，真实窄容器不被强行撑到桌面宽度。

容器宽310时scale=0.5，世界移动12对应屏幕约6px。Konva拖拽事件给出的节点position已经是父级逻辑坐标，不要再除一次scale。自定义指针落点若使用getPointerPosition则需逆变换，本例没有那个工具。

Stage的width/height是像素布局，scale是世界投影，不能只用CSS拉伸Canvas。容器宽大于620时scale最多1，剩余宽度是留白。世界边界约束卡片几何尺寸，选中描边可能多出少量像素，不把它当额外业务宽高。

## 迁移与所有权

复制`example.tsx`、`stage-policy.ts`、`styles.css`，按业务入口替换仅重导出的`demo.tsx`。使用当前声明依赖及浏览器环境；默认全量入口注册形状，若换ReactKonvaCore需自行导入对应形状。

| 所有者 | 负责内容 |
| --- | --- |
| React state | 稳定id、标题、世界坐标、颜色、选中与锁拖拽 |
| react-konva | Stage和子图元的创建/更新/销毁及事件绑定 |
| 本组件 | 容器ResizeObserver和待执行rAF；卸载disconnect/cancel |
| DOM | 可访问控制、坐标表格和状态提示 |

一个舞台只交给一个所有者。不要在声明式Stage之外new Konva.Stage，也不要数据一变就手动destroy。19.3.2的Stage是独立canvas renderer root，错误/Suspense边界需要放在Stage内部并使用Konva fallback；本例没有引入边界或Transformer。原指南中所有未来变换/HTTP/PNG建议都不作为已实现行为。

持久化应保存带版本的业务数组并校验唯一id/数值，不直接把stage.toJSON当业务协议。大量点数、DPR和Layer数量的性能需要目标设备实测；24是教学上限，不是性能测量结果。

## 官方材料和验证边界

官方README来自匹配19.3.2固定提交，原文在official/readme.md；根与benchmarks共两个README候选，完整树无中文README。精确commit/path/version/language/time/hash在official/source-audit.json与library.json，中文讲解不冒充上游翻译。

官网React教程当前响应带X-Frame-Options: SAMEORIGIN，不能从Lab跨源iframe嵌入；官网面板标blocked，显示原因和直达。完整最终响应头在official/homepage-response.json。

两项真实Node SDK检查把实际react-konva renderer挂到脱离Canvas的真实Konva.Group，验证props/身份同步、事件替换和卸载；不是应用的第二套Stage实现，也不证明绘图、命中或浏览器资源清理。五项纯政策检查只验证坐标/尺寸/上限。主控通过validation/browser-proposal.txt验证真实指针和Canvas像素/表格，正式verification保持NOT_RUN。六项和实际命令见local-validation.md。
