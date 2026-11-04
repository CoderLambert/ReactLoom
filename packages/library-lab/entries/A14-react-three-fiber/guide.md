# A14 React Three Fiber 9.8.2：Canvas、useFrame 与按需帧

R3F 用 React 声明 Three 对象：`<mesh>` 对应 `Object3D`，`<boxGeometry args>` 是构造参数，材质挂到父网格。底层仍是 Three.js。手写 `WebGLRenderer` 的生命周期见 A13，不要和 `<Canvas>` 抢同一块画布。地理海量点看 A17，统计图不要做成 3D。

Library Lab 钉 `@react-three/fiber@9.8.2` 和 `three@0.186.0`。9.8 面向 React 19。没有安装 `@react-three/drei`。Drei 的 `Environment preset` 可能去拉远程 HDR，生产要换成有授权的本地文件。下面出现的 Drei 片段是未运行的组合教学。

## Lab 当前示例

`examples/demo.tsx` 导出 `examples/example.tsx`。帧门闩在 `examples/frame-policy.ts`。

已挂载：

- `<Canvas>` 在固定高度 300 的容器里。`dpr={[1, 1.5]}`，`gl={{ antialias: true, powerPreference: 'low-power' }}`，相机 `[0,0,5]`、fov 50。`fallback` 在不支持 WebGL 时给出警告段落。
- `frameloop` 为 `always` 或 `demand`。`shouldRunFrames` 要求未暂停、未开启减少动态、文档可见、容器与视口相交、速度为正有限数。否则按需渲染，避免滚出屏幕后还空转 GPU。
- `useFrame` 在 Canvas 子树的 `ObjectMesh` 里。delta 经 `boundedFrameDelta` 夹到 0..0.1 秒。暂停时直接 return，不 `setState`。
- 悬停把 scale 设为 1.1，点击切换「已处理」颜色（绿 / 橙）。按钮做同样的切换，所以不只靠射线。
- advanced 可换球、暂停、或 `key` 自增重新挂载 Canvas。basic / business 固定盒体。
- 环境光和方向光、背景色用 `<color attach="background">`。没有纹理、没有 `useLoader`、没有 InstancedMesh、没有 `invalidate()` 手动相机。

`useFrame` 和 `useThree` 不能写在 `<Canvas>` 外面。Lab 把它们留在 `ObjectMesh`。

R3F 会在卸载它创建的几何和材质时尝试 `dispose`。`<primitive object={external}>` 或 `dispose={null}` 表示外部所有权，不能多个子树重复释放，也不能谁都不释放。`useLoader` 的缓存是共享的，叶子卸载不应清掉别人还在用的纹理。Lab 没有这些共享对象。`gl.info` 里的数量不是 GPU 字节。[objects](https://r3f.docs.pmnd.rs/api/objects)。

## 帧与事件

`frameloop="always"` 每帧跑。`demand` 只在属性变化或 `invalidate()` 后画。声明式 props 更新通常会自己要一帧；在 demand 模式里直接改 `mesh.rotation` 或相机，必须 `invalidate()`，否则画面停在旧帧。Lab 在循环应当停止时切到 demand，旋转逻辑又因 `paused` 返回，所以静帧来自最后一次渲染。

`useFrame((_, delta) => ...)` 的 delta 是秒。不乘 delta 会在高刷新率上转得更快。后台标签可能给出很大的 delta，所以要封顶。Lab 的上限是 0.1。

指针事件经射线命中，可能穿过后面的物体。`stopPropagation` 也会挡住更远的命中。网格不是 Tab 控件。Lab 的按钮和 `role="status"` 提供等价操作。[events](https://r3f.docs.pmnd.rs/api/events)。

## 三层

### 01 声明式网格

盒体、灯光、悬停和点击。减少动态或滚出视口时 `frameloop="demand"`。状态行写出模型、处理状态、动画和是否在视口内。

### 02 业务状态

「设为已处理」只改 React 颜色，不碰渲染器所有权。这不是研究稿里的 500 个来源柱。那条路径应用一个 `<instancedMesh>`，`setMatrixAt` / `setColorAt` 后把 `needsUpdate` 设为真，`computeBoundingSphere`，在 demand 下再 `invalidate()`。稳定 id 映射到 instanceId，不要用会变的数组下标。

### 03 帧预算和重挂载

暂停、换几何、整棵 Canvas 换 key。频繁换 key 会反复创建 WebGL 上下文，只适合学习卸载。产品里应在同一个 Canvas 里换子场景。`IntersectionObserver` 用 0.01 阈值；环境没有该 API 时保持「在视口内」，避免永远 demand。

研究稿的 Abort、503 保留旧数据、DPR 在低电量降到 `[0.75, 1]`、`useLoader` 本地 checker 纹理，都没有迁入。纹理若加上，设置 `colorSpace = SRGBColorSpace`，不要在叶子卸载时 `dispose` 共享缓存。

## 反例

```tsx
// 错：Canvas 外调用，且每帧 setState
function Outside() {
  useFrame(() => setAngle((value) => value + 0.01));
  return null;
}

// 错：每次 render 分配几何
<mesh geometry={new BoxGeometry(1, 1, 1)} />

// 对：声明式几何；帧内只改 ref
function Spin({ paused, speed }: { paused: boolean; speed: number }) {
  const mesh = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (paused || !mesh.current) return;
    mesh.current.rotation.y += boundedFrameDelta(delta) * speed;
  });
  return (
    <mesh ref={mesh}>
      <boxGeometry args={[1.7, 1.7, 1.7]} />
      <meshStandardMaterial color="#267c6b" />
    </mesh>
  );
}
```

| 错误 | 正确 |
|---|---|
| `useFrame` 里 `setState` | 短时变换写 ref；业务切换再 setState |
| 500 个 `<mesh>` | InstancedMesh + needsUpdate。Lab 只有一个 |
| demand 下改了对象却不 invalidate | 调用 `invalidate()`。声明式颜色变化由 R3F 请求帧 |
| 所有节点 `dispose={null}` | 只对共享外部资产生效 |
| DPR 不封顶且始终 always | 封顶；静止时 demand。Lab 上限 1.5 |
| 只有网格上的点击 | DOM 按钮。Lab 已有 |
| `useLoader` 任意外网 URL | 同源白名单和授权 |
| 和手写 Renderer 共画布 | 选一个所有者 |
| 用关掉 StrictMode 掩盖双初始化 | 让 Canvas 卸载路径释放上下文 |
| React 18 配 Fiber 9 却 `--force` | 升到 React 19 或改用 Fiber 8。本仓库 Web 是 19.3 |

## 性能与安全

关心 draw call、三角形、纹理尺寸、着色器编译、上下文数量和空转耗电，而不是只看 React 渲染次数。DPR 翻倍时像素面积大约四倍，这是面积关系，不是测得的帧时间。实例化减少重复几何的绘制调用，但更新矩阵仍有 CPU 成本。不要在 `useFrame` 里发 HTTP。[pitfalls](https://r3f.docs.pmnd.rs/advanced/pitfalls)。

Canvas 自己创建的 renderer 由 R3F 释放；传入外部 renderer 则调用者负责。`webglcontextlost` 的完整恢复没有在本示例实现。

标签用 React 文本，不要 `dangerouslySetInnerHTML`。Mock 若只在本机监听，不能当成已鉴权的 API。

## 组合

**R3F + drei。** 控制器在 demand 模式下要能 `invalidate`。远程环境贴图改本地。未安装，NOT_RUN：

```tsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
export function Viewer() {
  return (
    <Canvas>
      <mesh>
        <boxGeometry />
        <meshStandardMaterial color="#80ae93" />
      </mesh>
      <OrbitControls makeDefault />
    </Canvas>
  );
}
```

**R3F + TanStack Query。** `queryKey` 带过滤条件，`signal` 传入 fetch，校验后再把数组交给场景。不要同时维护一份手动镜像。Lab 的「已处理」只是本地布尔值。

**R3F + D3。** D3 只提供 `scaleLinear` 这类纯函数。不要用 D3 selection 改 Three 场景图。

## 生产清单

1. 钩子只在 Canvas 内。
2. 帧循环不 `setState`。
3. delta 有上限，速度为 0 不空转。
4. 减少动态、隐藏页签、滚出视口时 `frameloop="demand"`。
5. DPR 有上限。
6. 几何用声明式 args，不在 render 里 `new`。
7. 共享资源的 dispose 只有一个所有者。
8. DOM 提供同等操作。
9. 不把换 key 当成产品级场景切换。
10. 不和命令式 Renderer 叠用。

## 升级与练习

从 A13 的手动循环迁到 Canvas + useFrame 后，快速切换仍只留一个上下文，监听不重复。把多个网格收成 InstancedMesh，点击对得上稳定 id，503 不清空旧数据，`needsUpdate` 和 `invalidate` 都在。

50 与 500 个物体的 draw call 和空转耗电要写明设备和浏览器。本地 GLB 的卸载要分别看几何、材质和纹理。没有这些记录就保持 NOT_RUN。

## 故障排查

找不到包：先确认安装的是 9.8.2 而不是另一条主版本。空白：父级高度、WebGL2、相机 near/far、灯光。demand 残影：手动修改后是否 invalidate。纹理发灰：色彩空间和 CORS。`useThree must be called inside Canvas`：把组件移进 Canvas。长期切换后内存涨：primitive、缓存和多余的 Canvas key。键盘点不到：补表格按钮。

## 官方链接

- [Canvas](https://r3f.docs.pmnd.rs/api/canvas)
- [Hooks](https://r3f.docs.pmnd.rs/api/hooks)
- [Objects](https://r3f.docs.pmnd.rs/api/objects)
- [Events](https://r3f.docs.pmnd.rs/api/events)
- [性能](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
- [v9.8.2](https://github.com/pmndrs/react-three-fiber/releases/tag/v9.8.2)

## 证据

sdk、build、browser 在 `docs/library-lab/evidence/runs/` 有本条目收据之前为 **NOT_RUN**。`shouldRunFrames` 和 `boundedFrameDelta` 不证明 WebGL。Actions run `41779873259` 是仓库级 install、typecheck、build、52 个 SDK 文件（153 个测试）和 45 个 Playwright，不是 A14 的 PASS，不要写入 `verification.json`。
