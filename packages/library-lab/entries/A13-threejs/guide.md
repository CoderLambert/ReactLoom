# A13 Three.js r186：WebGL 循环、几何替换与 dispose

Three.js 管 Scene、相机、网格和 GPU 资源。统计图用 ECharts 或 uPlot，二维标注用 Konva，流程用 React Flow，地理点云用 deck.gl。需要大量声明式组件时看 A14，但不要让手写 `WebGLRenderer` 和 React Three Fiber 同时拥有一块 canvas。

Library Lab 钉 `three@0.186.0`（MIT）。研究笔记里 npm 上出现过的 0.186.1 不是本条目的 pin。代码按 0.186 的 `outputColorSpace`、`BufferGeometry` 和 `setAnimationLoop` 写，不使用已移除的 `Geometry` 或 `outputEncoding`。

## Lab 当前示例

`examples/demo.tsx` 导出 `examples/example.tsx`。循环开关在 `examples/animation-policy.ts`。

已挂载：

- effect 里 `new THREE.Scene()`、`PerspectiveCamera(50, 1, 0.1, 100)` 放在 z=5、`WebGLRenderer({ antialias: true, powerPreference: 'low-power' })`。构造失败就把错误写进 `role="alert"`，不再往下建循环。
- `setPixelRatio(min(devicePixelRatio, 2))`，`outputColorSpace = SRGBColorSpace`。`setSize(width, height, false)` 把 CSS 留给样式表。`ResizeObserver` 更新 `camera.aspect` 和投影矩阵。
- 一个 `MeshStandardMaterial` 的网格，半球光加方向光。没有贴图、没有 glTF、没有 OrbitControls、没有 Raycaster。
- `shouldRunFrameLoop` 要求播放中、页签可见、速度大于 0，且没有减少动态或用户在 advanced 勾了覆盖。为真时 `setAnimationLoop(draw)`，否则 `setAnimationLoop(null)` 并画一帧静图。delta 封顶 0.1 秒，避免后台恢复后转一大圈。
- 转速和颜色不重建上下文。颜色 `material.color.set`。几何从盒体换成球体时替换 `mesh.geometry` 并 `dispose` 旧几何。basic / business 固定盒体。
- cleanup：停循环、断开观察者、摘掉 `visibilitychange`、`scene.remove`、几何和材质 `dispose`、`renderer.dispose()`、`forceContextLoss()`、移除 canvas。`scene.remove` 不等于释放 GPU 缓冲。

没有挂上：文章 HTTP、InstancedMesh、实例拾取、GLB 校验、像素预算 200 万、`renderer.info` 面板。那些仍是生产教学。`renderer.info.memory` 只是内部计数，不是系统显存字节。

## 所有权

```text
React：形状、颜色、转速、播放、减少动态
effect：Scene / Camera / Renderer / Mesh
draw：只改 rotation，再 render
cleanup：停循环并 dispose 独占资源
```

不要 `setState(scene)`，也不要在 render 里 `new WebGLRenderer`。共享材质若来自外部缓存，这个视图不能擅自 `dispose`。Lab 的材质和几何是本 effect 独占的，所以卸载时释放。

`Object3D.dispose()` 存在，但仍要逐个释放几何、材质和贴图。只 dispose 材质会留下纹理。Lab 没有纹理。

## 三层

### 01 旋转网格

绿色盒体。转速滑杆 0..3。速度为 0 时循环停止，留下当前帧。状态段落写出网格、颜色和是否在跑，供不看 canvas 的用户阅读。

### 02 颜色

三种颜色立即改材质。不重新创建 Renderer。这不是 RSS 柱状图；研究稿里的六篇文章和 `instanceId` 映射没有迁入。生产若做柱状对比，用一个 InstancedMesh 共用几何和材质，`setMatrixAt` 后 `needsUpdate`，点击用 Raycaster 的 NDC（由 canvas 的 bounding rect 归一化到 -1..1），再映射回业务 id。拖拽轨道结束不要当成点击。

### 03 暂停和替换

advanced 可换球体、暂停、或显式覆盖减少动态。换几何会丢掉旧 `BufferGeometry`。离开页签停循环。覆盖复选框只在 advanced 出现，避免 basic 无视系统偏好。

GLB 生产路径：检查头部、长度和外部 URI，只用 `blob:` / `data:`，用代数丢掉卸载后才解析完的模型，并 dispose 那份结果。`parseAsync` 没有通用 AbortSignal。20 字节到 15 MB 这类阈值是应用策略。Lab 不读取模型文件。

## API

| API | Lab |
|---|---|
| `WebGLRenderer` | effect 中一次，失败可见 |
| `setAnimationLoop` | 按策略开关；卸载先 null |
| `setSize(w,h,false)` | 配合 aspect |
| `setPixelRatio` | 上限 2 |
| `MeshStandardMaterial.color.set` | 不重建网格 |
| `geometry.dispose` / `material.dispose` / `renderer.dispose` | cleanup 与替换路径 |
| `forceContextLoss` | 卸载时调用，促使上下文释放 |
| `OrbitControls` | 未用。若加上，每帧 `update`，卸载 `dispose` |
| `InstancedMesh` | 未用 |
| `Raycaster.setFromCamera` | 未用 |

## 反例

```ts
// 错：渲染期间创建上下文
function Bad() {
  const renderer = new THREE.WebGLRenderer();
  return <div ref={(node) => node?.appendChild(renderer.domElement)} />;
}

// 错：拿走网格就当 GPU 已释放
scene.remove(mesh);

// 对：停循环，释放独占几何、材质和渲染器
renderer.setAnimationLoop(null);
mesh.geometry.dispose();
material.dispose();
renderer.dispose();
```

| 错误 | 正确 |
|---|---|
| 每个柱一个 Mesh 和材质 | InstancedMesh。Lab 只有一个网格 |
| 只听 `window.resize` | 容器 ResizeObserver。Lab 已做 |
| `devicePixelRatio` 不封顶 | 按预算封顶。Lab 封顶 2 |
| React state 保存 Scene | 只存业务字段 |
| `clientX` 直接当 NDC | bounding rect 归一化 |
| 旧的 glTF Promise 写回新场景 | 代数；迟到结果也 dispose |
| 只 dispose 材质 | 纹理和 ImageBitmap 单独处理 |
| 用截图像导出数据 | 数据走原始行；跨域 canvas 会失败 |
| 只有 3D 柱子表达数量 | HTML 列表。Lab 用状态段落 |
| SSR 顶层构造 Renderer | 只在 effect |
| 把 `outputEncoding` 抄进 r186 | `outputColorSpace` |

## 兼容与安全

WebGL 不可用时保留文字。Canvas 的 `role="img"` 不是完整的无障碍数据表。中文不要画进贴图当输入法。

CSP 一般不需要 `unsafe-eval`；自定义着色器或 WASM 解码器要单独试。不要把密钥放进模型 URL。导入模型要限制三角形数量、外链和版权。Lab 没有这些资产。

性能记录应包含 GPU、DPR、浏览器和采样方法。本文件不提供 FPS。关注 context lost：生产要能重建资源。Lab 在初始化失败时停住，没有 `webglcontextrestored` 自动重建。

## 组合

**TanStack Query + Three + ECharts。** Query 管 HTTP 和取消，ECharts 做精确二维比较，Three 只做空间分布。两边都从同一份 id 列表派生，不要从 canvas 反解析数字。

**不要和 R3F 共管 canvas。** 声明式场景用 A14 的 `<Canvas>`。手写渲染器适合需要直接控制循环和 dispose 的时候。同一块画布不能有两个所有者。

MSW 可以模拟加载失败；Playwright 需要可用的 WebGL 或软件渲染才谈得上黑屏测试。Lab 没有这些测试。

## 生产清单

1. Renderer 在 effect 创建，失败有文案。
2. 循环用 `setAnimationLoop`，后台和零速度停掉。
3. delta 有上限。
4. DPR 有上限，`setSize` 第三参为 false，并更新 aspect。
5. 换几何必 dispose 旧的。
6. 卸载 dispose 材质、几何、渲染器，并丢掉上下文。
7. 减少动态默认停，覆盖是显式的。
8. 颜色和转速不新建上下文。
9. 业务数字不放进 Scene 对象。
10. 不报告未测量的显存。

## 升级与练习

旧教程的 `THREE.Geometry`、`examples/js` 全局脚本和 `outputEncoding` 迁到 BufferGeometry、`three` 的 ESM 附加模块和 `outputColorSpace`。对照 pin 0.186.0，而不是笔记里的 0.186.1。

练习：盒体和球体往返十次后几何体数量不增长；隐藏页签再回来不会跳一大段旋转；StrictMode 下上下文不累积。加上两张纹理时，卸载后纹理也 dispose。这些需要浏览器收据。

## 故障排查

黑屏：WebGL、容器高度 280、控制台着色器错误。模型不在画面里：near/far 和坐标单位。换页后内存涨：dispose 漏了纹理或循环还在。导出空白：要在 `render()` 之后读像素。构建失败不要被说成运行时通过。

## 官方链接

- [创建场景](https://threejs.org/manual/pages/creating-a-scene.html)
- [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html)
- [releases](https://github.com/mrdoob/three.js/releases)
- [npm three](https://www.npmjs.com/package/three)

## 证据

sdk、build、browser 在 `docs/library-lab/evidence/runs/` 有本条目收据之前为 **NOT_RUN**。`shouldRunFrameLoop` 只证明播放、可见性、减少动态和速度。Actions run `41779873259` 是仓库级 install、typecheck、build、52 个 SDK 文件（153 个测试）和 45 个 Playwright，不是 A13 的 PASS，不要写入 `verification.json`。
