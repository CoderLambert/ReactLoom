# Rive React：文件契约、播放与业务各自有所有者

已有设计器制作的插画，需要在React里播放、控制布局并随业务停播时，可以使用Rive。`.riv`包含Artboard、动画/状态机和可能的数据绑定；WASM解析文件，渲染器绘图，React包装器协调实例与Canvas。它不拥有审核请求、按钮语义或业务结果。简单DOM过渡看B01，时间轴资产看B04；没有合法文件时先解决资产前提。

本例实际安装 `@rive-app/react-webgl2@4.37.0`，依赖 `@rive-app/webgl2@2.45.0`；React19.3.0符合peer。运行时MIT不授权任意设计资产。只有既有官方文档的远程vehicles.riv引用，没有把`.riv`下载或再分发，也没有自造二进制、View Model或成功/失败动画。

## 先准备一条真实链路

```text
React挂载策略 → useRive → WASM + 远程.riv
                         ↓
                   实际Artboard / bumpy
                         ↓
React播放意图 → play/pause → SDK状态 / Advance事件
                                      实际画面另用Canvas帧差观察

React审核phase与错误文本独立存在，不从动画帧推断业务结果
```

本例文件URL是 `https://cdn.rive.app/animations/vehicles.riv`，官方当前React文档仍直接示范stateMachine="bumpy"。这证明引用出处，不等于获得复制、修改或再发布许可。离线/内网需要另行提供获准、自有、版本化且有哈希与同等契约的文件，不能靠把官方样本下载进仓库解决。

WASM使用SDK自带固定2.45.0的unpkg主URL和jsDelivr备URL；本次按主控决定保留这条官方网络路线，未扩大公共依赖或复制资产。源码没有保证离线。SDK、WASM和`.riv`任一请求、CORS/CSP或WebGL2条件失败，必须显示真实错误，HTML仍可操作。

## 实验一：加载成功不等于已播放

打开“入门：Rive播放器”。useRive传入单数stateMachine、autoplay=false与useOffscreenRenderer=true，容器有明确尺寸。包装器返回的rive在文件已加载后才可用；本例以hook选中的实际实例为读取/控制依据，不让晚到的load回调充当新实例。

```tsx
const { rive, RiveComponent } = useRive({
  src: RIVE_SAMPLE_URL,
  stateMachine: 'bumpy',
  autoplay: false,
}, { useOffscreenRenderer: true })
```

实际 [player.tsx](examples/player.tsx) 会核对SDK stateMachineNames里确有bumpy；若不匹配，显示契约错误，不假设某个别的状态机代表审核结果。默认Artboard、实际边界和名字由SDK读取，不预填样本元数据。

展开“查看真实Rive对象与推进事件”，点“读取真实播放器”。null表示当前没有已加载的hook实例。isPlaying/isPaused/isStopped、playingMachines、stateMachines、bounds和layout.fit来自实际SDK；Canvas缓冲尺寸与CSS尺寸分别读取。页面“请求播放”只是策略，不能据此宣布用户看见了动画。

手动暂停后，应读取到isPlaying=false；恢复且允许播放后，SDK应报告播放，观察到的Advance事件数随后增加。Advance计数由真实事件订阅得到，仅说明动画/状态机有推进，不证明renderer成功或屏幕像素变化；也可能漏掉订阅前的推进，读取不会逐帧setState。固定WebGL2 2.45.0虽声明EventType.Draw，但实际draw/flush路径不派发该事件，不能拿这个枚举计数当绘制证据。真实浏览器另比较播放时连续Canvas画面、暂停稳定后的画面，并核实际尺寸与资源响应。

选择Contain与Cover：前者完整显示，后者铺满并可能裁切；rive.layout更新，播放器不为换fit重新创建。instance是React挂载观察身份，objectIdentity是本例WeakMap对真实Rive对象引用的标记，二者合用检查同挂载内是否复用，不能当SDK公开ID。不同挂载不能只比较objectIdentity。

## 实验二：业务只请求视觉，不从视觉判结果

打开“业务：审核状态驱动动画”。点击启动约450ms后本地成功；勾“下次模拟503”后下一次本地任务失败。没有HTTP请求，503只是教学错误标签。pending且允许动画时请求播放，其余业务阶段请求暂停；车辆bumpy并没有approved/failed属性，也没有写入View Model。

启动时捕获当前失败选项，新任务先abort旧任务再递增generation；返回后同时核对generation与AbortSignal。取消/切换场景/卸载作废旧结果并清理计时器，取消回idle。业务message与Rive runtimeError分开：即使审核成功，资源错误仍单独显示，不能被业务文案覆盖；反过来画面播放也不能判审核成功。

若未来设计文件提供status/progress属性，再依据明确的Artboard/状态机/View Model名称、类型和范围绑定。当前资产未提供该业务契约，不照抄虚构的approved或health字段。

## 实验三：挂载、停播和共享渲染器

打开“进阶：视口与资源生命周期”。advanced的IntersectionObserver阈值0.05，离屏卸载播放器，回屏创建新实例；缺IO时视为在视口。所有层在文档隐藏时都请求卸载。手动暂停/系统减少动态只请求停播，仍保留已挂载的静态播放器。

| 条件 | mount意图 | play意图 |
| --- | --- | --- |
| 页面隐藏 | false | false |
| advanced离屏 | false | false |
| 减动/手动暂停 | 可见策略允许时true | false |
| business非pending | 可见策略允许时true | false |
| 其他可见且允许 | true | true |

纯 [runtime-policy](examples/runtime-policy.ts) 只返回意图。是否加载、是否绘制、资源是否释放是另一层证据。第一次渲染即使autoplay=false也可能显示文件默认帧；暂停不等于隐藏敏感内容，本例无敏感数据。

useRive拥有Rive实例，应用不再cleanup一次。应用的Play/Pause/Advance监听在layout cleanup先摘，读取handle按身份清除，alive挡住最终卸载后的错误；包装器再处理实例。SDK也有自己的尺寸/相交策略，应用不去清全站监听或共享资源。

useOffscreenRenderer=true允许多个画布共享离屏WebGL context。卸载一个播放器不保证共享context或全局WASM单例立即销毁。观察旧Canvas断开、包装器把其缓冲宽高清零和重新挂载的新实例，仍不能声称所有GPU资源已经回收。没有开启需要独立context的GPU Canvas/inkbleed，不把这些特性混入当前实验。

## 迁移与API边界

复制example.tsx、player.tsx、runtime-policy.ts、asset.ts、styles.css；demo.tsx只是Lab导出。保留非零容器尺寸、官方远程来源说明、单数stateMachine、autoplay=false、控制effect、原生HTML按钮/状态/错误与装饰Canvas aria-hidden。没有Lab alias或额外本地资产。

不要在渲染期new Rive，或在useRive包装器外重复cleanup。若自己走命令式Web runtime，则自己拥有实例和清理，二者选择一条。不要把SDK实例放业务全局store，也不要为每个表格行申请上下文。

4.37.0仍保留复数stateMachines与useStateMachineInput，但它们已弃用，不是“已经删除”。新设计的数据绑定要真实文件契约；onRiveReady可用于首帧前绑定，而普通属性hook在首帧后执行。本例不做数据绑定/文本输入/事件打开URL，审核仍是HTML，不宣称中文IME或读屏画布已经验收。

## 官方、许可和当前证据

官方v4.37.0固定commit `ed0614c0050923db382df43196de80ecb38f9abd`，根package版本4.37.0。完整递归tree四个README候选无中文，选择 [根英文原文](official/readme.md)，4388B，SHA-256 `d3db576862ff069a0889157166a11e3f3136ec74a4736cb6acbac172ab835262`，[固定出处](https://github.com/rive-app/rive-react/blob/ed0614c0050923db382df43196de80ecb38f9abd/README.md)。精确版本/语言/日期/响应头在 [source-evidence](official/source-evidence.json)，原文不替代本地教学。

官网文档实际GET200，但X-Frame-Options为DENY，CSP frame-ancestors仅自身/Mintlify，Lab origin不允许嵌入，因此blocked并保留直达，不尝试绕过。[远程样本响应](official/asset-response.json) 只读完整GET头，200/宣称长度58792；未读正文、未算`.riv`哈希，也不能从该请求推断浏览器CORS或渲染成功。

本地Node确实初始化安装的MIT Rive WASM，用真实computeAlignment/Vec2D验证Contain与Cover；没有读取`.riv`或伪Canvas。已知100×50内容放入200×200框：Contain矩阵缩放2、Y偏移50；Cover缩放4、X偏移-100。自有native矩阵/点在finally delete。此结果证明布局内核，不证明React加载文件、状态机播放或WebGL绘制。

真实WASM两项、原策略五项、类型/格式/metadata与浏览器提案边界详见 [local-validation](local-validation.md)。在线渲染由主控匹配候选执行提案；离线授权文件仍未提供，assets保留相应BLOCKED，formal sdk/build/browser保持NOT_RUN。
