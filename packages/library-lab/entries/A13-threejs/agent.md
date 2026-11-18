# Three.js 0.186.0 工程复用

需要直接持有三维渲染器、循环和资源时使用；React声明式场景可选R3F，不共管Canvas。实际依赖three0.186.0，WebGLRenderer需要WebGL2。只有本地Box/Sphere与光照，没有模型/纹理/HTTP。

## 两个目标

basic理解Scene/Camera/Geometry/Material/Mesh，真实材质变色/速度0/static frame/容器resize与投影同步；advanced真实循环门禁、几何替换dispose、上下文与Canvas退出。旧business只有标题差异已合并，不再声明重复目标。

复制example.tsx、geometry.ts、animation-policy.ts、workshop.css；demo.tsx只是适配。state只存参数，effect/ref持有对象，draw只改rotation并render，不每帧setState。显式“读取当前渲染状态”读取真实uuid/属性/renderer.info；dispose事件计数为示例观察，不是显存测量。

颜色set保持Material，几何替换后dispose旧BufferGeometry；材质/几何变化补静帧。DPR<=2，ResizeObserver同时setSize(false)/aspect/updateProjectionMatrix。setAnimationLoop由播放/文档可见/减少动态+显式覆盖/正有限速度控制，delta<=0.1。

卸载先setAnimationLoop(null)，断RO/visibility，mesh移出并dispose对象、独占geometry/material、renderer.dispose/forceContextLoss/移除Canvas。Object3D.dispose不代替共享几何/材质/纹理释放。构造失败只有错误说明，无contextrestored重建。初始state读取浏览器偏好，因此整个查看器必须client-only/不参与SSR首屏；仅标为客户端组件不足以保证hydration一致。Renderer在effect内也不等于组件本身SSR-safe。

真实Node SDK2只测Geometry/Color/Camera/Scene/实际dispose事件，没有WebGL；policy13只开关。browser必须实际Canvas画面、材质/几何变化、帧统计、投影/尺寸、dispose与丢失旧上下文；不mock渲染器。复杂模型、触控/读屏/硬件性能与dev重放另验。

匹配README采用npm0.186.0 gitHead148ef33ecb6d2502ff796d4554abd1549c95d519，不误用r186标签中声明0.186.1的manifest。原文/固定来源/完整官网头与选择依据见official和validation，正式verification仍NOT_RUN直到获授权recorder。
