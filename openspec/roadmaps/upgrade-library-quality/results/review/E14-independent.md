# E14 react-easy-crop 非作者独立复核

2026-11-18，当前E14，react-easy-crop6.2.4。只写本报告，不改entry/shared、不重跑作者完整7policy或共享浏览器/检查。按catalog→metadata→agent→全部sourceFiles→verification→guide检索，另读local-validation、浏览器提案、实装SDK与官方材料。

结论：发现一项P2程序reset后裁剪区域丢失，作者已定向修复并通过独立静态/受控几何delta核对，P2关闭。Spec与静态质量、隔离迁入/新policy消费者PASS；真实挂载Cropper/Canvas/浏览器回归仍NOT_RUN，由主控执行。

## P2发现与关闭

原examples/example.tsx的reset handler：默认sample、zoom1但crop非零时，invalidateOutput(false)清area，再把crop设0；源码原先只接onCropComplete。实装6.2.4 componentDidUpdate纯crop.x/y变化仅调用emitCropAreaChange，它只触发onCropAreaChange，不触发onCropComplete。故拖动→mouseup已有area→点恢复默认，在没有source/zoom变化时可让area永久null、导出按钮disabled，直到用户再次拖动/缩放。

最小复现交主控：advanced默认sample且zoom1，实际pointer横拖到非零crop后mouseup，再恢复默认；应area回默认且按钮可用。此前“同值reset保area”只保护crop本来0的分支，不能覆盖这个路径。

已关闭delta：作者将Cropper接线改为onCropAreaChange第二参数保存SDK pixels，checkingFile期间屏蔽保留；guide/agent与最小接入片段同步。独立重读当前example.tsx约177行和两文档确认。保留原同值reset的area保护与changeCrop同坐标短路，因此“未触发任何SDK更新”与“发生纯crop更新”两分支都有对应处理，没有手算替代SDK几何。

另用真实SDK类、手工受控media/cropSize（不挂载DOM）调用componentDidUpdate纯crop归零分支，实际getCropData/emitCropAreaChange得到整数矩形：

```json
{"delta":"CONTROLLED_GEOMETRY_PASS","onCropAreaChange":{"width":800,"height":600,"x":200,"y":100},"mountedCropperExecuted":false}
```

这证明选中的回调通路与实际几何方法一致，不证明真实pointer/DOM reset已验；主控真实浏览器仍待跑。没有重复作者SDK/完整policy。

## 新consumer与严格迁入

cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`，`node --input-type=module`内联脚本，exit0。复用实际crop-policy和file-check，用新900×600源、{x75,y40,width360,height240}矩形，验证返回新矩形且范围越界拒绝、本地WebP文件通过。

独立受控Promise消费者验证文件检查epoch：不相关export epoch变化后原检查finally仍可清checking；两次检查交叠，旧finally不能清新checking，新完成后才清；dispose使当前检查过期。额外手工调用真实SDK类的纯crop更新分支，记录仅area-change、无complete，构成P2依据。输出：

```json
{"trial":"POLICY_PASS","newArea":{"x":75,"y":40,"width":360,"height":240},"independentFileEpoch":true,"oldFinallyKeepsNewChecking":true,"disposeInvalidates":true,"controlledActualCropOnlyUpdate":{"areaEvents":1,"completeEvents":0},"mountedCropperExecuted":false}
```

这是自建policy/受控SDK方法分支，不计完整DOM SDK PASS。

复制九个真实迁入文件：example.tsx、crop-policy/sample-image/image-runtime/file-check四组.mjs/.d.mts至独有tmp，链接现有Lab依赖；consumer.tsx导入组件、几何类型、真实cropToPng签名、sample与file-check。仅编译、不执行Image/Canvas代码。cwd仓库根，argv：

```text
pnpm exec tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution Bundler --jsx react-jsx --skipLibCheck /tmp/e14-independent-1o5nxkg2/consumer.tsx
```

exit0、stdout/stderr空，最后只删除自建tmp。第三方声明内部skipLibCheck，不是全Lab检查。此编译在单一callback名delta前；delta已对照安装声明确认两回调相同参数形状，未为同一签名重复编译。

## 六项分层

|要求|结论与依据|
|---|---|
|技术准确|静态/类型/几何与policy PASS，P2已关闭；真实DOM NOT_RUN。像素参数是第二参数、SDK几何为整数、Node与Canvas范围清楚，不称解码前像素防护。|
|解释清楚|PASS，静态：Cropper选择/Canvas编码/自建预算分工，三目标、九文件迁入、默认SVG与本地文件、错误恢复与不可物理取消边界完整。|
|Demo有用|设计/policy PASS，真实交互NOT_RUN。basic几何、business16:9 PNG、advanced文件竞态与资源各有目标；reset问题的真实pointer回归交主控。|
|源码可迁移|PASS，九原件strict consumer编译。默认样式注入/330px相对容器、React/DOM/Bundler/Image.decode/createImageBitmap/Canvas/Blob/URL前提齐，无Provider/env/服务；无遗漏sample或helper类型。|
|官方来源可靠|PASS，原字节/字段：ValentinH/react-easy-crop固定commit91bfd8f0928ead345e5126a539edab4657d82993 README独立raw与本地SHA均104b7fa40dc28745590bf4236cf1150441f6a2f6e5db387ec81a6634f40c980f。安装version6.2.4/licenseMIT与保存LICENSE一致，固定无中文README，保留en；保存及当前官网GET200未见明确frame限制，unknown合理。|
|结果可复核|policy/迁入/受控几何层PASS，DOM/browser/formal NOT_RUN。作者7policy未冒充SDK，独立命令/输出与原问题保留，未把P2静态关闭写成真实pointer通过。|

## 所有权与Canvas边界

file-check独立于export generation；选择失败保留旧源/area、检查期间禁range/pointer且忽略几何回调，新选择/卸载/恢复默认才作废旧file-check。旧finally不改更新检查。bitmap在解码与维度检查后finally.close；16MP检查在decode后，不能防所有首次解码内存分配，MIME声明不是格式证明。

导出gate同步设置id，几何变化作废旧id且清结果，旧finally仅在activeExport匹配时释放；允许新几何计算后另启导出，不让旧结果覆盖新源。image-runtime先decode与自然尺寸检查，再检查整数/边界/4MP输出，最后分配Canvas；toBlob拒绝null/空输出，finally清image.src与Canvas尺寸。未提供旋转/CORS任意远程源/EXIF保留或物理cancel。

源File与结果Blob的URL由各自effect成对创建/revoke，无全局清理；无效导出Blob不会发布URL。实装Cropper componentWillUnmount解除resize/gesture/scroll与文档事件、disconnect ResizeObserver、clear自身resize计时器及样式；没有虚构destroy API。这些源码事实不代替浏览器观察，主控已有真实API/URL外层提案。

报告完成，停止写入。
