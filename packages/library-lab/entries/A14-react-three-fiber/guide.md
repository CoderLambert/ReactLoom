# A14 React Three Fiber：工程实战指南

> 本条目是依据官方资料重新编写的示例，不是历史研究附件的复制品。示例源码已接入；SDK、TypeScript、构建、浏览器验证需以 verification.json 的实际证据为准。

## 选择R3F还是直接Three.js
React Three Fiber 不是另一个3D渲染引擎，它是Three.js对象树的React renderer。与直接Three相比，React自动管理声明式几何体的mount/unmount，事件可以写在mesh上。对于现有非React 3D引擎或高级定制渲染循环，先评估A13。采用 @react-three/fiber **9.8.2**，因为官方9.8.0明确修复React19.3兼容；暂不采用v10 alpha WebGPU-first新入口。

## 安装与最小入口
```bash
pnpm add @react-three/fiber@9.8.2 three@0.186.0
```
```tsx
import {Canvas,useFrame} from '@react-three/fiber';
return <Canvas><ambientLight/><mesh><boxGeometry/><meshStandardMaterial/></mesh></Canvas>;
```
源码：`examples/example.tsx`，其中 `ObjectMesh` 在 Canvas 子树中使用 useFrame。

## 三层实验
**basic** 观察Canvas、灯光、Mesh和材质；**business** 点击模型与普通按钮均改变业务状态，验证键盘用户不被3D交互排斥；**advanced** 调整转速、几何体、暂停、重新挂载。降低动画偏好使用 matchMedia 实时监听，暂停通过 Canvas frameloop=demand 减少空转而不是“跳过绘制函数内部更新”。

## 生命周期与性能
`useFrame` 必须在 Canvas 内调用，回调只做小型逐帧Mesh mutation，delta以秒计并上限截断。不要在每帧运行 React setState、网络请求或创建Geometry/Material。R3F默认处理 JSX 对象卸载；手工创建纹理、loader缓存和传入外部Renderer仍需明确所有权与清理。高DPR使用Canvas dpr限制，隐藏Tab由DemoHost卸载，浏览器非GPU环境 fallback 与外部语义状态同步。

## 专属反例与修复
1. 在Canvas外调用useFrame/useThree会抛上下文错误。2. 混用WebGPU v10 alpha示例与v9 WebGL特性导致API错位。3. 用索引key重用动态mesh，发生身份/材质错配；稳定业务ID。4. 用常驻requestAnimationFrame与R3F内部循环并行；只使用Canvas的frameloop。5. 把GPU交互当唯一操作入口；提供同等HTML按钮与文本状态。

## 练习与组合
把模型处理状态对接TanStack Query成功/失败，但仅业务请求进入Query；逐帧旋转仍由R3F管理。第二练习测量高DPR、reduced-motion以及Canvas多次卸载时的资源峰值。对比A13原生Renderer和A17海量GeoPoint图层的选型边界。

## 官方资料与版权
- [R3F Canvas官方API](https://r3f.docs.pmnd.rs/api/canvas)
- [R3F useFrame官方API](https://r3f.docs.pmnd.rs/api/hooks)
- [React19兼容发布说明](https://github.com/pmndrs/react-three-fiber/releases/tag/v9.8.2)

本地数据与示例代码为原创。使用前核对依赖版本与当前许可证；不请求第三方付费 API。
