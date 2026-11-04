# A13 Three.js — 工程手册

## 适用

`three@0.186.0` 适合需要直接掌握渲染循环和 GPU 资源的场景。声明式 React 树用 A14，不要两个所有者共用 canvas。一个网格的演示不要扩展成未经测量的实例化性能结论。

## 版本

钉 `three@0.186.0`。使用 `WebGLRenderer`、`SRGBColorSpace`、`BufferGeometry`、`setAnimationLoop`。不要写 `outputEncoding` 或旧 `Geometry`。研究笔记中的 0.186.1 不是本 pin。

## 迁移

从手写 RAF 改为 `renderer.setAnimationLoop`。从「remove 即释放」改为几何、材质、渲染器分别 dispose，并 `forceContextLoss`。换几何时先替换再 dispose 上一份。颜色用 `material.color.set`，不新建上下文。

## 不可删的清理

cleanup 停循环、断开 ResizeObserver、移除 `visibilitychange`、dispose 独占几何和材质、`renderer.dispose()`、`forceContextLoss()`、移除 DOM。速度为 0、隐藏页签或减少动态时循环必须关掉，并保留一帧。delta 不超过 0.1 秒。DPR 不超过 2。

## 反例

```ts
scene.remove(mesh); // 错：GPU 缓冲还在
renderer.setAnimationLoop(null);
mesh.geometry.dispose();
material.dispose();
renderer.dispose();
```

render 中 `new WebGLRenderer`、无上限 DPR、把 Scene 放进 React state，都不要做。

## 测试断言

`shouldAnimate` 在暂停、隐藏或减少动态且未覆盖时为 false。`shouldRunFrameLoop` 在速度不是正有限数时为 false。SDK 收据还要看到真实渲染器、换几何后旧几何 dispose、卸载后循环停止。没有 runs 收据则为 NOT_RUN。

## 真实限制

没有 OrbitControls、InstancedMesh、glTF、射线拾取或 HTTP。覆盖减少动态只在 advanced。初始化失败没有上下文恢复流程。`renderer.info` 未读取，也不能当成显存。没有 FPS 数字。

## 断言边界

`tests/animation-policy.test.mts` 只判断循环开关。SDK 用例要 `import * as THREE from 'three'`。没有 WebGL 时断言失败路径可见，而不是把渲染器桩掉。换几何后旧几何已 dispose，卸载调用 `setAnimationLoop(null)`。缺收据时保持 NOT_RUN。

## 证据

Actions `41779873259` 的仓库级 install、typecheck、build、52 SDK 文件（153 测试）和 45 Playwright 不是 A13 PASS。不要把动画策略测试或历史研究 PASS 写入 `verification.json`。
