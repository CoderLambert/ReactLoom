# Konva 10.9.0：原生场景图与可编辑 Canvas

## 安装与应用边界
`pnpm add konva@10.9.0`，`import Konva from 'konva'`。Konva管理Canvas内部`Stage → Layer → Group → Rect/Text`节点与hit graph；DOM React只管理舞台容器和业务状态。若希望所有图元用JSX表示，则比较 A12 react-konva，不要混用两种Stage所有权。

## 三层实战
**入门**：创建两个业务图元、画布外<select>选中节点；Canvas文字并非DOM可访问文本。
**业务**：拖动处理流水线节点，`dragend`将节点坐标写回React状态，重新渲染时已有Group复用，不整图重建。
**进阶**：Transformer调整节点宽高；滚轮缩放按指针坐标更新stage.scale和stage.position；用原生DOM按钮实现移动、选择、删除和缩放重置。

实际业务Demo位于 `examples/example.tsx`，`demo.tsx`仅是导出适配。复制到其他项目时把领域数据、事件映射与Stage生命周期一起迁移。

## 核心时序
React管理`cards[]`的稳定ID与字段 → 渲染effect按ID增量增删Konva节点 → 用户拖拽/变换 → `dragend/transformend`提交数据 → React同步到Konva（拖拽中的节点不要重置位置）。`transformend`拿到的是节点scale，并非卡片实际width/height；需要规范化几何尺寸、`group.scale({x:1,y:1})`，否则重复编辑会累积缩放误差。

## 六条防错建议
1. **组件每次重渲染new Stage**：泄漏Canvas与事件；舞台创建effect负责生命周期。
2. **将节点位置只存在Konva**：业务无法保存/撤销；dragend同步稳定ID。
3. **拖拽进行中React强制写回旧位置**：闪跳；检查`group.isDragging()`。
4. **不受约束的Transformer**：负宽高/镜像异常；boundBoxFunc限制最小尺寸和flip。
5. **用Canvas颜色表达唯一业务状态**：键盘和读屏不可操作；必须提供HTML控件与等价节点列表。
6. **画布PNG导出无限pixelRatio**：巨大Canvas导致内存和浏览器限制；商业场景输出前验证尺寸/权限，禁跨源污染图片。

## 资源与安全
ResizeObserver + rAF在实例销毁前停止。缩放wheel只在高级场景消费并preventDefault，其他场景不阻止页面正常滚动。离开示例只`scene.destroy()`、清空本组件图元Map，不调用全局清理。跨源图片会污染Canvas，用户上传的图元和SVG不要直接不可信执行。

## 应该选谁
Konva适合框架无关图形底层控制与频繁命令更新；react-konva适合React声明式层级；tldraw/Excalidraw有更完整白板协作功能，不要闭门从0补选区、撤销、历史与多人状态。

## 验证
SDK、TypeScript、生产构建、浏览器均未运行，不能标PASS。后续需验证重复mount/unmount不残留Canvas，键盘按钮更新真实节点，dragend坐标、transformend尺寸稳定，移动端touch拖拽，极端缩放约束，截图与无障碍替代。

官方：https://konvajs.org/docs/index.html · https://github.com/konvajs/konva （MIT）。
