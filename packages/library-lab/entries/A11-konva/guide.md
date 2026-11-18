# Konva：把审核步骤卡片变成可操作的二维画布

需要让编辑人员拖动“RSS收集、内容审核”两张卡片、调整大小并保存坐标时，直接操作Canvas上下文还要自己实现命中检测和拖拽。Konva提供场景图：Stage管理画布容器，Layer负责绘制，Group把卡片背景和文字组合起来，Rect/Text是图元。你改节点属性，库处理绘制、命中和拖拽。

本例使用MIT的 `konva@10.9.0`，适合自定义二维编排、小型设计器和图元操作。它不自带完整白板文档、协作或审批执行器；需要白板产品先评估Excalidraw/tldraw，需要节点端口和连线评估React Flow。React项目也可以用react-konva声明式描述同一类图元；那时由包装器持有Stage，不要再手动创建第二个。

## 数据所有权与最小接入

本例React state保存 `Card[]`，包含id、标题、世界坐标、宽高和颜色。Konva场景是它的显示投影。业务数组不保存SDK实例，也不把Stage序列化结果当业务协议。

```ts
const scene = new Konva.Stage({ container: host, width: host.clientWidth, height: 280 })
const layer = new Konva.Layer()
const group = new Konva.Group({ id: 'rss', x: 25, y: 35, draggable: true })
const rect = new Konva.Rect({ width: 150, height: 68, fill: '#e4eee5' })
const label = new Konva.Text({ text: 'RSS 收集', x: 10, y: 21, fontSize: 16 })
group.add(rect, label)
layer.add(group)
scene.add(layer)
```

输入是容器、坐标和图元属性；Stage/Layer建立绘制边界，Group让背景和标题一起移动。创建放在浏览器effect，清理调用 `scene.destroy()`。完整源码还包含Transformer、容器观察与按id更新，复制时以“真实源码”的三份文件为准：`example.tsx`、`stage-policy.ts`、`demo.tsx`；没有额外图片、字体或CSS资源。

第二个effect按id同步数组：新卡片创建Group，已有卡片修改位置/尺寸/文字，被删除的卡片销毁Group。更新业务数据不会重新创建Stage。拖拽中SDK先移动临时位置，应用不逐帧覆盖；`dragend`才把实际Group坐标写回React。Konva 10默认安排批量绘制，同步末尾的一次 `batchDraw()` 也会合并，而不是每次属性设置后立即重画。

## 实验一：真实Canvas命中与键盘替代

打开“Canvas节点与选择”。画面包含两张卡片；点击“内容审核”，下拉框变为对应id。用下拉或列表按钮也可选择卡片，再用键盘激活“向右10px”或“向下10px”，图与下方坐标一起变化。本层未开放鼠标拖拽，也没有变换手柄。

点击命中来自Konva的Canvas事件，选择状态和按钮移动是示例自建的React逻辑。Canvas中的Shape不是DOM元素，不能用HTML的 `getElementById` 查图元。为键盘和文本阅读提供原生控件及等价卡片列表，比只给画布加一个可聚焦属性更完整。

展开“查看真实场景节点与变换”可观察实际Stage宽度、Group位置、Rect尺寸、选中Transformer节点和锚点位置。这些是示例读取SDK对象形成的诊断快照，不是Konva自带的性能面板。

## 实验二：把拖拽结果提交到业务坐标

打开“新闻卡片拖拽编排”。拖动RSS卡片，松手后列表显示新的x/y。事件代码读取 `group.x()`、`group.y()`，四舍五入后更新卡片数组；随后同步effect把一致的数据重新投影进场景。

点击“缩窄画布容器”，ResizeObserver读取实际容器宽度，下一帧修改Stage宽度；恢复后画布回到原宽。卡片坐标不因此改变。这个实验调整视口，不把文档整体缩放到容器，也不保证所有离屏卡片自动移回可见区域。

`stageWidth`拒绝0或非有限宽度，并将有效宽度夹在1至4096。4096是教学保护边界，不是Canvas或Konva性能上限。Observer的rAF会在卸载时取消，并确认仍是本组件当前Stage后再写入。

## 实验三：尺寸归一、指针缩放与销毁

打开“Transformer、缩放、键盘替代与销毁”。选中RSS卡片，拖动右下手柄。Transformer改变Group的 `scaleX/scaleY`，不会替你改Rect宽高；`transformend`将比例乘进卡片宽高，然后把Group scale重置为1。

```ts
const width = Math.max(85, Math.round(rect.width() * group.scaleX()))
const height = Math.max(48, Math.round(rect.height() * group.scaleY()))
group.scale({ x: 1, y: 1 })
apply(id, { width, height, x: Math.round(group.x()), y: Math.round(group.y()) })
```

否则下一次从React同步时会回到旧尺寸，或者反复乘比例。`boundBoxFunc`收到绝对坐标中的盒子，本例先除以Stage缩放再检查最小85×48世界单位；禁止翻转和旋转，缩放后仍按同一业务最小尺寸约束。

将指针放在画布内滚轮缩放。Stage保存视口的位置和0.6至2之间的比例，卡片的世界坐标不变。缩放前指针下的世界点是 `(pointer - stagePosition) / oldScale`，新位置为 `pointer - world * newScale`，让同一世界点仍留在指针下。“还原缩放”只重置视口。

新增卡片通过递增id加入业务数组，最多24张；选择新增卡片再删除，场景中的Group也随之销毁。24是示例预算，不代表测过24张时的性能。滚轮与手柄是直接操作，没有自动播放动画；此例不模拟触控缩放或滚动惯性。

点击宿主“停止并卸载”，Stage连同图层和图元销毁，DOM Canvas移除；再运行应只出现一份Canvas。清理还包括断开ResizeObserver、取消rAF、移除本Stage的命名空间事件、清空自己持有的Map和ref。诊断标记记录销毁后的实际注册表归属、孩子数量与残留Canvas，不由“组件看不见了”推断已清理。

## 迁入项目与重要取舍

依赖是React浏览器环境和 `konva@10.9.0`。复制 `example.tsx`、`stage-policy.ts`，使用自己的入口时可省略仅重导出的 `demo.tsx`。容器需要有效尺寸；Stage创建在客户端effect，SSR不创建Canvas。组件内的状态、Map、Observer、Stage由同一组件拥有。

保存可编辑文档时保存带版本的卡片数组，加载时验证唯一id、数值范围和类型，再重建投影。Konva的 `toJSON` 不会替你保存业务权限、图片加载和事件逻辑。本例数据只存在内存，刷新会还原，不包含HTTP、持久化、PNG导出或文字输入。

实际文本编辑应交给HTML输入框，尤其中文IME；Canvas文字本身不是编辑器。PNG导出还要考虑视口/选框、像素预算、图片CORS和下载URL清理，这些不是本实验已实现的功能。大量节点、触控、读屏和高DPR预算需要在目标设备实测，不能从两张卡片推出。

## 官方资料

“官方README原文”保存10.9.0固定提交中的上游英语原文；该提交根目录没有官方中文README。“官网预览”复用公共面板，官网响应明确包含 `X-Frame-Options: SAMEORIGIN`，禁止从Lab跨源嵌入，因此展示限制原因与直达入口。

- [场景图概览](https://konvajs.org/docs/overview.html)
- [Transformer与尺寸比例](https://konvajs.org/docs/select_and_transform/Basic_demo.html)
- [以指针为中心缩放](https://konvajs.org/docs/sandbox/Zooming_Relative_To_Pointer.html)
- [销毁与资源](https://konvajs.org/docs/performance/Avoid_Memory_Leaks.html)

讲解的关键API按本地10.9.0源码/类型核对。真实Node场景图测试与真实浏览器Canvas执行的范围分别记录在 `local-validation.md`。
