# React Three Fiber：React声明对象，帧循环修改变换

一个产品模型需要灯光、业务颜色、指针命中和可暂停的旋转。React Three Fiber（R3F）把React树协调成真实Three对象：Canvas提供场景/相机/渲染器，mesh绑定几何和材质。它适合需要React状态与三维交互共存的页面；只做统计图无需引入WebGL，已有命令式Three渲染器可先看A13，地理图层看A17。不要让手写Renderer和Canvas拥有同一块画布。

本例使用实际安装的 `@react-three/fiber@9.8.2`、`three@0.186.0` 和React19.3.0，均为MIT。只有原创盒体/球体，没有模型文件、纹理、远程HDR、drei、HTTP或服务端业务。三个目标是 **声明式对象 → React状态与真实射线 → 帧与资源所有权**。

## 先看最小接线

```tsx
<Canvas camera={{ position: [0, 0, 5], fov: 50 }} frameloop="demand">
  <ambientLight intensity={1.3} />
  <directionalLight position={[3, 3, 4]} intensity={2.5} />
  <mesh>
    <boxGeometry args={[1.7, 1.7, 1.7]} />
    <meshStandardMaterial color="#267c6b" />
  </mesh>
</Canvas>
```

Canvas父元素需要实际尺寸，本例高度300 CSS px。几何的1.7是场景单位，不是像素；相机距离5和视角50度一起决定屏幕大小。标准材质需要光照，环境光与方向光影响可见效果。JSX的args是构造参数数组：boxGeometry创建几何，meshStandardMaterial自动附着到父mesh的material，不是DOM子标签。

React拥有HTML控件、业务布尔值和JSX声明；R3F拥有场景对象的创建/协调/默认释放，Three处理几何、材质、相机与真实WebGL绘制。useFrame只在Canvas上下文内部使用，不能在外层React组件里调用。完整源码拆为 [example](examples/example.tsx)、[scene](examples/scene.tsx)、[帧门闩](examples/frame-policy.ts)、[可见性钩子](examples/visibility.ts) 和 [样式](examples/workshop.css)。

## 实验一：声明式对象究竟生成了什么

打开“JSX构建Mesh、几何与灯光”，看到静态绿色盒体。这个目标关闭持续旋转、使用demand，不提供业务切换；先理解一个mesh、几何、材质和灯光如何组成结果。

展开“查看真实Three对象和帧状态”，点“读取真实场景”。应看到实际Mesh/Geometry/Material UUID、BoxGeometry、24个position顶点、颜色267c6b、非零尺寸与DPR、demand模式和真实renderer.info。24是盒体分面后的缓冲顶点数量，不是8个空间角点。若为null，说明本代Canvas子树尚未提交，稍后读取；它不是预填fixture。

检查器主动读ref与useThree状态，不逐帧setState；快照不会自动追随后续操作，变化后再读。frameCallbacks是本例useFrame回调次数，renderFrame/renderCalls来自Three renderer.info；这些计数不等于GPU显存、耗电或性能验收。检查器所在父层重绘被memo隔离，不为一次读取主动提交新的Canvas props。

## 实验二：指针命中和业务状态如何汇合

打开“射线命中与React业务状态”。把指针移到盒体，真实R3F射线事件使scale变为1.1，移开回1；点击切换“已处理”，材质颜色变橙色c47b37。再用Tab找到“设为未处理”并Enter，回到绿色。HTML按钮与网格事件都只更新同一个React active布尔值，颜色由声明式props传入材质。

每次主动读取，比较Mesh与Material UUID：普通颜色变化应复用它们，改变的是实际material.color。指针事件不是DOM点击冒充拾取，也不能只按HTML状态宣称三维命中通过；浏览器需实际点Canvas并读对象结果。网格不是Tab控件，HTML按钮提供等价入口；这不代表整页已做屏幕阅读器/WCAG验收。

“已处理”只是本地演示状态，没有新闻工单、后端保存或权限。当前只有一个可交互物体，不涉及更远物体的穿透选择；加入叠放网格时再按产品语义处理stopPropagation。

## 实验三：旋转、按需帧与几何身份

打开“帧循环、几何更新与卸载”。允许动画且可见时，useFrame接收秒单位delta，夹到0..0.1后乘角速度，直接改mesh.rotation；没有每帧React setState。

```ts
useFrame((_, delta) => {
  if (!running || !mesh.current) return
  mesh.current.rotation.y += boundedFrameDelta(delta) * speed
})
```

点暂停后为demand，读取两次确认旋转稳定；继续后旋转变化。把角速度设为0也停止持续帧。系统prefers-reduced-motion、隐藏文档或滚出视口同样使门闩关闭，回到可见且允许状态才恢复。没有强制覆盖系统减动的开关。

demand不是“此后零帧”：必要的声明式属性更新、指针悬停等仍会请求帧，useFrame也可能因该帧执行，但running=false时不旋转。暂停与否、相交状态是应用门闩，实际frameloop从R3F状态读出；不能只看按钮文字证明节能。给delta封顶限制后台恢复的跳变，不是实测帧预算。

暂停后把几何从盒体换为球体，再读取。应保持同一Mesh/Material UUID，geometry变为SphereGeometry且UUID改变；R3F移除旧声明式几何并安排dispose。这里改变子几何，不新建Renderer。

“重新挂载场景”增加Canvas边界key，重建整个场景、清空处理/暂停状态；形状和速度保持当前选择。这是学习完整卸载的操作，产品切换模型优先复用Canvas并换子树，频繁重挂载会反复创建WebGL上下文。

## 可见性、清理和错误边界

保留原来的matchMedia change、document visibilitychange和IntersectionObserver；每个effect解除自己的监听或disconnect。IO阈值0.01，没有IO时保留可见，避免永久停帧。document与容器可见性共同生效。每代Canvas持有独立read handle ref，只在子场景提交后发布，卸载仅清理属于自己的handle；读取还核对scene generation，旧Canvas的迟到清理不写新代ref。

useFrame订阅由R3F在子组件卸载时解除。声明式geometry/material由R3F处理释放，应用不再重复dispose；本例未使用primitive、dispose=null、共享loader缓存或外部Renderer。安装9.8.2的移除对象路径按空闲调度dispose，根卸载关闭事件/帧并释放自建Renderer和上下文，不承诺在React移除DOM的同一瞬间全部GPU资源已回收。浏览器提案另检查真实旧Canvas断开及实际WebGL上下文lost。

Canvas的fallback是canvas元素的备用内容，不能当作所有WebGL初始化异常/上下文丢失的恢复器。当前源码会把configure错误向外抛，本例增加局部React错误边界，保留外层HTML控件/状态；advanced可重挂载，其他层可停止后重跑。本例未实现webglcontextlost后的自动恢复，缺WebGL的环境应报告BLOCKED，不用假渲染器制造PASS。

## 迁移与边界

复制example.tsx、scene.tsx、frame-policy.ts、visibility.ts、workshop.css；demo.tsx仅为Lab导出适配器。 当前查看器的初始state读取浏览器减动/可见性，SSR项目需让整个查看器只在客户端挂载并禁用该子树SSR；仅标为客户端组件仍可能预渲染，不能据此保证hydration一致。依赖React19与ReactDOM、R3F9.8.2、Three0.186.0和Three类型。安装包peer为React>=19<19.4、Three>=0.156，当前React19.3.0满足；不要用强装绕过peer。没有额外资源、Lab alias或共享存储。

为容器提供高度，保留Canvas唯一所有者、帧内ref变换、减动与可见性门闩、DOM等价操作和卸载清理。需要纹理/GLB、drei或外部Renderer时另定义授权、缓存与释放所有权。本例没有InstancedMesh、远程请求、模型加载、WebGPU、性能测量或完整上下文恢复；不能从一个网格推断海量场景能力。

## 官方原文与版本差异

官方v9.8.2 release/tag指向commit `d74622ea8ed717f7212d7e19d65ff3e325508389`，该固定提交的packages/fiber/package.json却声明9.8.1。npm官方发布与本机均为9.8.2；npm gitHead e6ec3506ebf7879c26bd5ac27986b5d4421f3254对应两个公开raw路径实际404。三者差异如实保留，不把固定manifest伪写为9.8.2。

完整tag tree无官方中文README，保留该官方release tag下根 [readme原文](official/readme.md)，14301字节，SHA-256 `29c7319a41a30b95319e68d540672efaa31a2c3bd44bad6ef2e48b93d00d4ab6`，[固定出处](https://github.com/pmndrs/react-three-fiber/blob/d74622ea8ed717f7212d7e19d65ff3e325508389/readme.md)。它是release tag概览，不据此宣称manifest或全部代码等于已装9.8.2。

为核实运行依据，匿名读取官方npm9.8.2 tarball，在内存验证registry sha512，并逐字节核对package.json和两个实际运行bundle均与安装包一致；没有安装新包或提取共享资源。原始版本/完整响应/摘要见 [source-evidence](official/source-evidence.json)、[npm完整性](official/npm-integrity.json)。运行API以匹配安装9.8.2源码/类型为准，在线 [Canvas](https://r3f.docs.pmnd.rs/api/canvas)、[hooks](https://r3f.docs.pmnd.rs/api/hooks)、[objects](https://r3f.docs.pmnd.rs/api/objects) 作为补充，不把当前站点当固定快照。

官网GET200、完整响应头没有XFO/CSP，未真实Lab iframe，所以保持unknown与直达。真实对象helper Node执行和纯帧策略分开；二者都不证明Canvas协调、useFrame实际调度、WebGL绘制、射线或卸载。三目标浏览器提案在validation/browser-proposal.txt，实际命令、结果与六项见 [local-validation](local-validation.md)；formal verification保持NOT_RUN。
