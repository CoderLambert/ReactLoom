# A14 React Three Fiber — 工程手册

## 适用

`@react-three/fiber@9.8.2` 与 `three@0.186.0` 用声明式 Canvas 托管一个网格和帧循环。命令式渲染器见 A13，二者不要共管 canvas。海量地理点不放在这里。

## 版本

钉 9.8.2，配合 React 19。`dpr` 上限 1.5，`powerPreference: 'low-power'`。未安装 drei。几何用 `<boxGeometry args>` / `<sphereGeometry args>`，不要在 render 里 `new BoxGeometry`。

## 迁移

从 A13 的 `setAnimationLoop` 迁到 `useFrame`，delta 乘速度并夹在 0.1 秒。静止、隐藏、离屏或减少动态时把 `frameloop` 设为 `demand`。场景切换优先换子树；`key` 重挂载只用于学习卸载。InstancedMesh 要 `needsUpdate`，demand 模式下还要 `invalidate`。

## 不可删的清理

`matchMedia`、`visibilitychange`、`IntersectionObserver` 在 effect cleanup 解除。`useFrame` 在暂停时返回，禁止每帧 `setState`。不要对 R3F 创建的几何再手动 dispose 一次，除非通过 `primitive` 或 `dispose={null}` 接管了所有权。

## 反例

```tsx
useFrame(() => setSpin((n) => n + 1)); // 错：帧率绑在 React 上
<mesh geometry={new BoxGeometry()} /> // 错：每次 render 分配
```

Canvas 外调用 `useThree`、无上限 DPR、用换 key 当路由方案，都不要做。

## 测试断言

`shouldRunFrames` 在暂停、减少动态、不可见或速度不为正时为 false。`boundedFrameDelta` 把非有限数变成 0，并把过大 delta 夹到 0.1。SDK 收据还要看到真实 Canvas 和 useFrame。没有 runs 收据则为 NOT_RUN。

## 真实限制

没有 InstancedMesh、纹理、drei、射线以外的拾取索引或 HTTP。减少动态没有「显式覆盖」开关，这一点与 A13 不同。离屏检测依赖 IntersectionObserver。没有 draw call 或显存数字。fallback 只在 Canvas 报告不支持时出现。

## 断言边界

`tests/frame-policy.test.mts` 覆盖 `shouldRunFrames` 和 delta 夹取。SDK 用例要 `import { Canvas, useFrame } from '@react-three/fiber'`。钩子测试必须渲染在 Canvas 内。`frameloop="demand"` 时零速度不应持续要帧。缺收据时保持 NOT_RUN。`useFrame` 内不要 `setState`。离屏、隐藏和减少动态时使用 `frameloop="demand"`。delta 夹在 0.1 秒。

## 证据

Actions `41779873259` 的仓库级 install、typecheck、build、52 SDK 文件（153 测试）和 45 Playwright 不是 A14 PASS。不要把帧策略测试或历史研究 PASS 写入 `verification.json`。

对照 `library.json` 的版本编写 import，不要升到条目未钉死的版本。
`tests/` 中的策略用例不能改写成 sdk 字段的 PASS。
浏览器与构建未留下收据时，对应字段维持 NOT_RUN。
