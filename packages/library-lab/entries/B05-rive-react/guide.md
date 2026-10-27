# B05 · Rive React Runtime：WebGL2 动效和业务状态分离

## 核心定位

Rive 是设计时制作的状态机 / 艺术板运行时。与 Motion/GSAP 直接控制 DOM 不同，Rive 把复杂插画和状态机模型封装在 `.riv` 文件里。React 只管理输入、播放条件和业务数据。适用于品牌动效、交互提示、UI 游戏化与设计师参与维护的高保真动画。

本实验采用 `@rive-app/react-webgl2@4.37.0` 和官方示例 `https://cdn.rive.app/animations/vehicles.riv`，状态机名称 `bumpy`。这是官方 React 文档公开的远程样本，**本仓库不拷贝、不声称拥有其二进制授权，离线无法加载**。商业项目应由团队合法导出自己的 .riv 文件并验证资源来源。

## 安装与导入

~~~bash
pnpm add @rive-app/react-webgl2@4.37.0
~~~

~~~tsx
import { useRive } from '@rive-app/react-webgl2';

function Demo() {
  const { rive, RiveComponent } = useRive({
    src: 'https://cdn.rive.app/animations/vehicles.riv',
    stateMachine: 'bumpy',
    autoplay: false,
  }, { useOffscreenRenderer: true });
  return <div style={{ width: 320, height: 220 }}><RiveComponent /></div>;
}
~~~

提示：`rive` 在文件加载完成前可能为 null；不要调用空对象。播放意图与实际渲染状态不同：没有拿到浏览器 SDK/资源加载证据前，不能把UI的“请求播放”当作已播放。远程资源错误和播放 API 错误回调必须在子组件卸载后失效。画布尺寸由父容器提供。WebGL2 使用有限 GPU 上下文，列表中若大量同时挂载应考虑替代 renderer 或复用策略。

## 三层真实场景

**基础**：组件式 `useRive` 挂载，手动暂停/恢复。动画视觉层标注 `aria-hidden`，由旁边的 HTML 文字提供语义等价信息。

**业务**：本地模拟审核请求（可以选择 success/503）。真正调用 Rive 的播放接口，同时 React 控制实际 `idle / pending / success / error` 业务状态。新请求先 abort 旧请求并递增代号，取消和卸载后旧 Promise 不回写。Rive 不承担判断审核成功的职责。

**进阶**：按 `IntersectionObserver` 视口状态控制子 Rive 组件挂载；后台页面、系统减少动态效果、手动暂停都会通过 `rive.pause()` 停止播放；离开视口时卸载子组件，让 SDK 自行清理 WebGL/WASM 相关上下文。没有执行 GPU Profiler 前不可宣称内存释放量。

主实现：`examples/example.tsx`，静态资源信息在 `examples/asset.ts`，引导入口在 `examples/demo.tsx`，局部样式在 `examples/styles.css`。代码查看器读取实际这四个文件。

## 2026 API 更新必须注意

官方 2026-08-31 更新将旧 `stateMachines`（复数）与 `useStateMachineInput` 标为弃用；当前新代码使用单数 `stateMachine`。有 View Model/Data Binding 的正式动画，优先使用新绑定 Hook，但它要求资产确实含对应字段，不能借官方车辆样本假装实现一个不存在的 `health` 参数。这里仅控制现有官方状态机播放，不虚构 View Model 资产。

Rive runtime 是 MIT，但动画资源、美术模板、导出服务或其他产品订阅不必然同为 MIT。无拥有权的 .riv 只能作已授权引用，不能拷入 npm 发行包。

## 五个反模式

1. 把旧复数 `stateMachines` 照搬进新版本，忽略弃用和实际动画名字；
2. 没有非零尺寸的 div，渲染黑屏时误判 SDK 装错；
3. 将 Canvas 动效当成唯一状态反馈：屏幕阅读器和网络错误路径不能依赖帧；
4. 页面隐藏和减动效开启时仍让 WASM/WebGL 持续运行；
5. 用户连续触发异步业务时旧结果覆盖新状态，或组件卸载后继续 setState；
6. 把 CDN 资产引用当成可合法重分发的文件，把运行时 MIT 误读为资产 MIT。

## 使用建议

大列表先评估只挂载视口内实例与 OffscreenRenderer 的影响。React 组件返回的 RiveComponent 需要完整生命周期，不要把同一个 Canvas DOM 随意搬到不同宿主。切换示例后应触发真正 unmount；动态导入本身不负责 GPU 清理。图形支持高保真动效，但复杂状态仍必须有符合语义的 HTML 按钮、文本、键盘及读屏替代。

## 真实验收路线

1. PLATFORM 核对 npm 正式版本和 React19 peer，统一写入 package/lock；
2. 在可用网络检查官方 .riv 请求、MIME 与 CSP，运行 `pnpm --filter @reactloom/library-lab typecheck` / `build`；
3. Playwright + 实机：播放暂停、503与取消、快速重复启动、隐藏Tab、reduce-motion、视口退出重新进入、StrictMode双挂载、WebGL资源释放和移动端兼容；
4. 源码指纹与真正 SDK/browser 日志匹配后，才更新 `verification.json` 中相应 PASS。

## 官方一手资料

- [React runtime 官方指南](https://rive.app/docs/runtimes/react/react)
- [2026-08-31 Runtime更新](https://community.rive.app/c/announcements/rive-runtime-updates-august-31-2026)
- [React Runtime MIT仓库](https://github.com/rive-app/rive-react)
- [状态机概念](https://rive.app/docs/runtimes/react/state-machines)

### wave17：后台GPU与场景取消

`examples/runtime-policy.ts` 统一挂载和播放判定：后台页面**卸载**Rive播放器（不是仅设 `play=false`），高级场景脱离视口也卸载；可见但减少动画或手动暂停时保留静态实例并停止播放。场景切换会取消正在执行的本地业务计时器，代次拦截旧任务回写。播放器卸载时由官方`useRive`运行时释放WebGL2资源，是否真正释放GPU/WASM需Chromium和目标SDK实测。
