# A13 Three.js：工程实战指南

> 本条目是依据官方资料重新编写的示例，不是历史研究附件的复制品。示例源码已接入；SDK、TypeScript、构建、浏览器验证需以 verification.json 的实际证据为准。

## 架构选择
Three.js 是场景图渲染引擎，不是 React 组件库。构建最小场景时应分别理解 Scene、Camera、Geometry、Material、Mesh、Renderer 的所有权。示例使用 Three.js r186（npm 0.186.0）的 WebGLRenderer；与新的 WebGPU 渲染管线属于不同技术路径。

## 安装与真实代码
```bash
pnpm add three@0.186.0
```
```ts
import * as THREE from 'three';
const renderer=new THREE.WebGLRenderer({antialias:true});
// 主循环由 renderer.setAnimationLoop(callback) 管理
```
可迁移源码在 `examples/example.tsx`，演示适配层仅重导出默认组件。

## 三层实验与预期
**basic**：盒体、相机和真实照明，通过材质颜色切换观察渲染链。**business**：产品状态色与角速度作为业务状态，场景模型可由其他产品控制而非硬编码在Canvas。**advanced**：切换球体时销毁旧geometry，暂停/恢复动画，检查ResizeObserver与VisibilityChange在组件卸载后不存在。

## 数据流、资源所有权与性能
React只保存业务旋转速度和材质选择，逐帧角度写入Three Mesh，不通过每帧setState触发整个React树重渲染。ResizeObserver更新Renderer尺寸和Camera宽高比；像素比限制2，防止高DPR设备GPU显存非线性放大。离开Tab时 `renderer.setAnimationLoop(null)`、`geometry.dispose()`、`material.dispose()`、`renderer.dispose()` 和断开所有监听。本例额外主动断开演示专属WebGL上下文，正式App要考虑重新载入策略。

## 常见反例与修复
1. 仅移除canvas而不销毁Three资源：GPU仍占用；对scene中的所有私有geometry/material/texture统一清理。2. Resize时只改renderer不更新camera.aspect：比例畸变；更新projectionMatrix。3. 每帧setState：React整树重渲染；直接更新Mesh对象。4. 快速切Tab继续RAF：销毁后仍draw；明确停止setAnimationLoop。5. GPU失败白屏：Canvas之外提供语义等价参数与错误信息。

## 项目迁移练习
把本例BoxGeometry替换为本地GLTF资产，并梳理Loader缓存与dispose归属；再实现两块图表同时存在且只卸载一块时另一块不受影响。与A14对比何时值得引入R3F的声明式管理。

## 官方资料与版权
- [Three.js 官方入门](https://threejs.org/manual/pages/creating-a-scene.html)
- [WebGLRenderer API](https://threejs.org/docs/pages/WebGLRenderer.html)
- [Three.js releases](https://github.com/mrdoob/three.js/releases)

本地数据与示例代码为原创。使用前核对依赖版本与当前许可证；不请求第三方付费 API。


## 动态效果与页面可见性（AB wave8 加固）

三维场景不应在 `document.hidden` 或用户选择 `prefers-reduced-motion: reduce` 时持续 GPU 动画。实际 Demo 将四个输入 `playing / visible / reducedMotion / overrideMotion` 交给 `examples/animation-policy.ts` 的纯函数裁决：页面不可见与显式暂停总是优先于减少动态覆盖；减少动态默认停止动画循环，仍渲染静态帧以保留内容。`matchMedia` 的 change 监听和 visibilitychange 在卸载时释放。高级 Demo 提供明确的减少动态覆盖选项，但默认不覆盖。使用 `node --experimental-strip-types --test entries/A13-threejs/tests/animation-policy.test.mts` 验证这部分纯规则；它不证明 Three.js WebGL、GPU 资源释放或浏览器功能已经通过。

## AB wave16：零速GPU空转与几何生命周期

`examples/animation-policy.ts` 的 `shouldRunFrameLoop` 在速度为0、页面后台、手动暂停或未覆盖的减少动态偏好下停止 `setAnimationLoop`，只保留静态帧。恢复时重置上一帧时间，避免跨暂停状态积累跳帧。材质色切换只调用 `material.color.set`，不再每次新建并dispose Geometry；实际球/盒形状变化才替换并释放旧geometry。使用 `node --experimental-strip-types --test tests/animation-policy.test.mts` 检查纯策略；WebGL实际帧循环与GPU回收仍待浏览器验收。
