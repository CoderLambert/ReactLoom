# deck.gl：把站点数组交给 GPU，再核对拾取与更新

资讯来源分布在不同城市，需要查看健康状态、按数量调整点半径，并在数据量增加后继续选择和阅读记录。deck.gl把数组映射成GPU图层；本例使用`@deck.gl/core@9.4.0`的Deck和`@deck.gl/layers@9.4.0`的ScatterplotLayer，没有底图、瓦片、地理编码或模型服务。

这里保留已有standalone接口练习：React effect拥有一个Deck，数据变化调用setProps，卸载finalize。官方在React产品中推荐`@deck.gl/react`的DeckGL包装器；本Lab只声明core/layers，不偷加包装包或同时创建两个所有者。两包MIT，当前内容recreated，历史研究PASS不继承。

## 三个操作目标

### 1. 从真实GPU点到拾取选择

basic显示北京和天津两条本地记录。等待SDK真实onLoad，并展开“查看真实图层、属性和投影”。初始化标志、稳定layer id、图层实例数、加载标志和半径属性来自真实SDK；project坐标来自正在使用的Viewport。

鼠标停在点上，Tooltip显示名称纯字符串；点击真实点通过Deck拾取回调更新选择，DOM表格按钮也可选择同一id。选择目前只显示在状态和aria-pressed，不声称GPU已有选中色。

图层实例数不等于当前视口能看见的圆点数。诊断是在真实onAfterRender之后读取，不是根据业务数组伪造“绘制完成”；它也不是FPS或显存面板。真正的命中仍须通过浏览器指针验证。

### 2. 同一Deck上的过滤和半径更新

business四站：北京、天津、石家庄、太原。勾“仅看健康站点”后剩三站，暂停的天津从图层和表中移除；若天津原先被选中，选择清空。取消过滤恢复四站，Canvas和Deck不重建。

调整“半径倍数”，新描述符仍用id=`library-sites`，`updateTriggers.getRadius`随倍数改变，GPU属性重新计算。诊断中的radiusValues读取实际instanceRadius属性，而不是把滑条值重新显示一次。

```ts
new ScatterplotLayer({
  id: 'library-sites',
  data: rows,
  getPosition: row => row.position, // [longitude, latitude]
  getRadius: row => Math.max(5, Math.sqrt(row.volume) * radius),
  radiusUnits: 'pixels',
  radiusMinPixels: 4,
  radiusMaxPixels: 28,
  updateTriggers: { getRadius: radius },
  pickable: true,
})
```

数据引用变化会更新对应属性；仅accessor闭包参数改变则需要trigger。触发器不是深比较。半径单位是像素，不能把这里的1.5或28直接当作米制覆盖范围。

### 3. 千点数据、全量分页和结束实例

advanced勾“添加1200个本地数据点”：四站加1200个确定性样本，共1204条。再勾健康过滤后是903条。这是本地fixture，不是全国采样，也没有做压力性能测量。

表格每页12行，可逐页访问全部当前数据；过滤/重置回首页，数据缩小时页码收敛。表格翻页只改变DOM窗口，不删GPU图层数据，也不会重建Deck。1204条共101页，健康903条共76页。未以“只显示前12行”冒充全量可访问数据。

“重置数据”回四站、半径1.5、关闭两个开关、第一页并清选择。缩窄浏览器时ResizeObserver只改变当前Deck尺寸；停止并卸载调用finalize，重进恢复初始状态。

## 所有权和GPU边界

```text
React fixture/过滤 → 同一visible数组 ─→ 全量分页DOM表
                               └→ 新Layer描述符、稳定id
半径倍数 → updateTriggers ─────────→ Deck.setProps
                                          ↓
                          SDK创建Device、更新属性并绘制
                                          ↓
                          onAfterRender读取实际Layer/Viewport
```

ScatterplotLayer是描述符，new一个描述符不等于创建新Deck或立即分配完整GPU资源。相同id让SDK在更新中匹配图层状态。源码将fixture、Layer工厂和容器尺寸分成可迁移文件，没有维护第二套画图实现。

本例让真实SDK创建WebGL设备，并使用其onError/onLoad，不再额外分配探测Canvas上下文。构造函数返回仅表示实例已创建，ready由真正onLoad设置。异步初始化或绘制错误显示原始信息，数据表继续可用；不以静态图、假Map或跳过错误代替GPU执行。

onAfterRender读取当前匹配Layer的getNumInstances、isLoaded、实际instanceRadius属性，以及真实Viewport.project。通过签名比较避免相同诊断反复触发React更新；不在该回调中调用pickObject，以免拾取绘制再次触发onAfterRender。真实拾取由SDK事件处理，诊断不替代它。

1200点仍开启picking，以演示交互成本边界；生产大数据要按设备和需求测量或采用聚合，不把该数字当推荐阈值。半径属性值、DOM数量和GPU实例数都不能当作显存峰值。

## 迁移必要文件与清理

复制example.tsx、deck-data.ts、deck-layer.ts、deck-size.ts、styles.css；demo.tsx是Lab适配重导出。依赖core/layers9.4.0与React浏览器环境；不需要deck.gl主包、React包装或MapLibre。容器330px高、relative定位。

measuredDeckSize拒绝0、负数和非有限尺寸，合法尺寸取整后限制1..4096。ResizeObserver合并到rAF，宽高相同不setProps。4096是示例保护边界，不是设备性能保证。

卸载先标disposed、断观察者、cancel rAF，再finalize自己创建的Deck；清空自己的Deck/Layer ref。真实清理标记读取finalize后的isInitialized、getCanvas与宿主Canvas数量。SDK负责自己的图层、拾取、动画循环和事件资源，应用不全局清理别人的Device或Canvas。

| 容易误解的做法 | 本例做法 |
| --- | --- |
| data每次变化new Deck | 单实例setProps更新 |
| layer id随机 | 稳定library-sites |
| accessor参数变了却无trigger | radius更新trigger |
| 构造返回就宣称GPU就绪 | 真实onLoad/onAfterRender分别观察 |
| 大数据只有12个DOM入口 | 同源全量分页与总数提示 |
| 隐藏Canvas当清理 | 当前实例finalize |

没有MapLibre overlay、ArcLayer、网络加载、PNG或相机自动飞行。接地图底图需另审来源、署名和相机所有权，不能同时让两个controller驱动同一视图。中文文字编辑、触控、完整读屏和目标设备性能仍需另验。

## 官方材料与当前证据

固定v9.4.0提交`5eded84b438eef83387dc6579c51670389053602`，实际检查完整tree无上游中文README。主快照选择已安装core包的`modules/core/README.md`原文，109字节、英文；该文件只是官网指引，另分别保留layers包README和完整项目README，不拼接或改写上游Markdown。路径、候选、版本、日期和三个摘要见official/source-audit.json/library.json。

官网deck.gl本次GET200，完整最终响应头在official/homepage-response.json，XFO/CSP均null；未从Lab origin验证iframe，保持unknown和直达，不从200推定allowed。

真实Node两项仅检查生产Layer描述符/accessors/trigger及WebMercatorViewport投影，明确descriptor未GPU初始化；六项纯政策覆盖尺寸、样本和全量分页。真实Deck/WebGL拾取、属性更新和finalize由主控运行validation/browser-proposal.txt。正式verification保持NOT_RUN，六项记录与命令见local-validation.md。
