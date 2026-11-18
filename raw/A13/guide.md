# Three.js：做一个能解释资源所有权的产品预览

产品页需要展示一件可换颜色、可旋转的三维物体。Three.js提供场景、相机、几何和材质，再由Renderer把它们绘制到Canvas。它适合需要直接控制三维对象和渲染循环的预览；普通统计比较用二维图表更容易读，React场景组件较多时可以用React Three Fiber管理同一引擎。两种方式都应让一个所有者管理一块Canvas。

本例使用MIT的 `three@0.186.0`，只用本地盒体和球体，没有模型、贴图、远程服务或加载密钥。当前WebGLRenderer需要WebGL2。软件WebGL2可以验证功能，不能代表目标设备的帧率或功耗；不能把一个网格的结果推广到复杂场景。

## 最小模型：Scene、Camera、Geometry、Material、Mesh

Scene是对象集合；Camera定义从哪里看、视野和近远裁剪面；Geometry提供顶点等几何属性；Material定义表面怎样着色；Mesh把几何和材质组合成场景对象。Renderer使用相机把场景绘制到自己的Canvas。

```ts
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100)
camera.position.z = 5
const geometry = new THREE.BoxGeometry(1.65, 1.65, 1.65)
const material = new THREE.MeshStandardMaterial({ color: '#227b68' })
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)
// StandardMaterial需要光照；本例还加入半球光和方向光。
renderer.render(scene, camera)
```

输入是尺寸、相机参数、几何和材质；渲染输出是像素。FOV的50是角度，aspect是宽高比，0.1/100是裁剪距离。容器变宽只改Canvas而不更新aspect会把物体拉扁，所以ResizeObserver同时更新投影矩阵与渲染尺寸。

完整实现用React state保存形状、颜色和播放偏好，effect独占Scene/Camera/Renderer/Mesh。SDK对象留在ref，不放进业务state；React只在控件变化时同步必要属性，不逐帧重建渲染器。

## 实验一：网格、相机与材质

打开“网格、相机与材质”。画面是真实WebGL2盒体。改变“材质颜色”，绿色、橙色、蓝色立即反映在表面；改变转速可以观察旋转，滑到0只保留静止画面。系统开启减少动态效果时默认停止自动旋转，本层尊重该偏好。

展开“查看真实渲染器与资源”，点击“读取当前渲染状态”。它读取当前Mesh/Geometry/Material的真实uuid、顶点属性数量、材质颜色、相机aspect、CSS渲染尺寸、实际绘图缓冲尺寸和renderer.info。本例快照是显式读取，不会每帧setState。`loopActive`来自应用安排循环的开关，帧数和资源计数来自真实renderer.info。

换颜色后再次读取：material和mesh的uuid应保持，color变化。示例调用 `material.color.set(color)`，不重新创建场景。点击“缩窄渲染容器”，宽度变为65%，相机aspect随实际尺寸变化；恢复后回到原宽。`setSize(w,h,false)`更新绘图缓冲而不覆盖CSS宽度，`setPixelRatio`上限为2；绘图缓冲像素量与DPR平方有关。

颜色和转速只是本地交互参数，没有产品接口或库存含义。

## 实验二：循环、几何替换与资源所有权

高级层增加形状、播放和明确覆盖减少动态效果。先在暂停状态读两次渲染快照，`render.frame`应保持；选择允许覆盖再播放，帧数和rotation才随时间变化。点击“暂停动画”停止循环并保留一帧。

`renderer.setAnimationLoop(draw)`安排绘制。draw按时间差累加旋转，delta封顶0.1秒，避免长时间停顿后突然转很大角度。播放、页面可见、减少动态偏好及速度共同决定是否安装循环；不满足时调用 `setAnimationLoop(null)`。几何或颜色改变会主动补一帧，因此暂停仍能看见用户刚改的内容。

在暂停时依次换“球体 → 盒体 → 球体”，每次创建新的BufferGeometry，替换 `mesh.geometry`，然后dispose上一份。Mesh和Material保持同一实例。再次读取可看见真实geometry uuid/type/顶点数量改变，几何dispose事件计数增加，而渲染器保留的当前几何计数不会随切换无限增长。

`renderer.info.memory`是渲染器内部资源数量，不是系统显存字节；dispose事件表明SDK释放调用已发生，也不是硬件显存测量。不要给这份示例补出没有测过的FPS或内存数字。

点击宿主“停止并卸载”：先停止动画，断开ResizeObserver和visibility监听，再移出Mesh、dispose对象及其独占几何/材质、dispose Renderer、请求丢失上下文并移除Canvas。重进应只有一个Canvas。r186的Object3D也有dispose，但它不能替你释放可能共享的Geometry/Material/Texture；本例资源全由该effect创建，才可在这里逐一释放。

## 迁入React项目

复制 `example.tsx`、`geometry.ts`、`animation-policy.ts`、`workshop.css`；`demo.tsx`仅重导出适配，可换成自己的入口。安装匹配的three，保留客户端effect与有效容器尺寸。没有额外字体、图片或模型资源。

当前实现初始化会读取浏览器减动偏好，不能直接参与SSR首屏。SSR应用需要让此查看器只在客户端挂载，并禁用该子树的服务端渲染；仅声明客户端组件仍可能预渲染，不能保证首次HTML一致。Renderer只在浏览器effect创建，构造WebGL失败时保留可读错误及参数；本例没有上下文自动恢复。迁到R3F时交回Renderer/循环所有权，不能同时手写第二个Renderer。

生产模型若共享材质或纹理，清理必须按引用所有权设计，不能照抄本例的独占dispose。加入模型加载、纹理或控制器后，还要分别处理异步迟到结果、贴图/控制器释放和资源许可；本例没有这些加载路径。

可访问性依靠原生控件、状态文字和快照。Canvas的img语义不是完整的模型说明；触控、读屏和复杂模型需要目标环境验收。后台、减少动态、0速等开关有策略和真实循环的分别证据，不从策略函数推导GPU运行通过。

## 官方资料与版本选择

官方README原文使用npm `three@0.186.0`公开metadata的gitHead固定提交，文件原字节保存，版本、时间与摘要在原文页签。`r186`标签的实际manifest为0.186.1，与本例pin不同，因此没有把那份标签资料冒充0.186.0；过程和原始失败留在维护记录。

- [官方创建场景](https://threejs.org/manual/pages/creating-a-scene.html)
- [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html)
- [资源清理](https://threejs.org/manual/pages/cleanup.html)

在线手册可能变化，关键API同时核对本地0.186.0源码/类型。官网面板保留实际响应依据和直达；未知嵌入状态不能由load或超时升级成允许。实际命令、原生SDK与真实浏览器的边界见 `local-validation.md`。
