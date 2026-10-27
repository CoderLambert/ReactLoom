# E15 pica：可观察的浏览器本地像素缩放

## 典型任务

降低文章配图长边、生成离线缩略图、减少上传前图片像素。pica是像素缩放引擎，提供 resize 与 toBlob；不会替代选择文件、图片裁剪、EXIF方向处理、图片上传或服务器校验。Node环境官方更推荐sharp，不要为了复用本例强行在服务器运行浏览器Canvas。

基线 pica 10.0.3，MIT。v10 默认导出是工厂函数 pica()；旧版 new pica() 不是正确的v10迁移方式。

```sh
pnpm add pica@10.0.3
```

```ts
import pica from 'pica';
const resizer = pica();
const outputCanvas = document.createElement('canvas');
outputCanvas.width = 480;
outputCanvas.height = 300;
await resizer.resize(inputCanvas, outputCanvas, { cancelToken });
const blob = await resizer.toBlob(outputCanvas, 'image/png');
```

输入是HTMLCanvasElement/Image/ImageBitmap，不是JPEG二进制Buffer。File先经过浏览器解码，之后才能resize。示例真实源码 examples/example.tsx。

## 三层真实演示

| 层级 | 处理对象 | 结果 |
|---|---|---|
| Basic | 内存生成的1280×800原创Canvas画布 | 真实resize到最长边≤480、pica.toBlob输出PNG |
| Business | 文件选择PNG/JPEG/WebP，文件≤4MiB、解码像素≤1600万 | 原本机像素经pica处理、输出本地Blob，不上传 |
| Advanced | 原生Canvas drawImage与pica各生成PNG | 可观察两个输出，但体积/样子不能当真实质量基准；可取消旧任务 |

### 尺寸策略

比例 s=min(1,targetMax/max(width,height))，输出宽高需>=1且按像素取整；默认不放大小图以避免虚假清晰度。pica可以使用worker/WASM优化，但不同浏览器可能回退到JS；本Demo不宣称一定并行或固定性能。

## 机制、取消与内存

- 复用同一Pica实例而不是为每张图创建一个Worker池；官方说明v10实例间的Worker池不再隐式共享。
- 为本次resize传入 cancelToken Promise，并在任务取消/卸载时拒绝该Promise；generation标识只允许当前批次提交结果。SDK的实际取消响应与Worker归还需用真实浏览器证明。
- File和ImageBitmap解码后调用 bitmap.close，画布和Blob输出在组件范围持有；ObjectURL从URL.createObjectURL创建必须revoke。
- 大批文件不要一次创建无限Promise和像素画布，按任务队列与内存预算处理；真正高负载性能验证需固定浏览器/设备/输入，不虚构吞吐。

## 不同于原生Canvas的部分

Canvas drawImage已有简单缩放能力，pica主要在高质量重采样滤镜/分块和可用运行环境下的加速。对比必须固定样本、分辨率、质量准则、输出mime与压缩参数；**文件体积不是感知清晰度的直接指标**。

## 专属反例

1. **将压缩Blob直接传入resize**：pica处理像素容器，先解码格式；必要时用image-blob-reduce。
2. **使用v9位置参数或new默认导出**：v10使用工厂 pica()，filter通过options指定，旧quality参数迁移需查看官方说明。
3. **直接导入远程图片并画Canvas**：缺CORS将无法导出安全像素；本例使用内存图/本地文件。
4. **文件字节限制等于像素限制**：可能解压炸弹和大Canvas失败，必须限制总像素和输出最大边。
5. **取消仅setState(false)**：异步resize仍可能完成且回写，必须结合cancelToken和generation；是否真正释放Worker还需测量。
6. **默认保留EXIF与方向**：Canvas重编码可能丢失元数据；若需保留，使用业务认可的图像处理库和服务端元数据策略。

## 组合建议

E14裁剪几何区、pica缩放裁剪后的Canvas；E13预览原图或缩小图。上传场景可结合F01 Uppy管理队列，但发送/取消与鉴权必须由实际上传插件实现，本例完全不发送文件。

## 验证状态

真实SDK源已写，缺根锁文件/依赖解析，本环境未运行真实pica.resize、Chromium或bundle。SDK NOT_RUN / build BLOCKED / browser NOT_RUN。安装后核查输出PNG字节、尺寸、取消中断、反复开始/卸载、浏览器内存与Worker清理，不以Mock计算成功。

官方：https://github.com/nodeca/pica

## EF wave19：文件替换、取消与任务单飞

此前只在运行开始时读取 `file`，用户在运行途中选新文件不会废弃旧异步结果；且不同 `level` 复用组件时可能显示上一层结果。本轮新增真实数据流中的 `examples/resize-policy.mjs`：非空文件与合法MIME/4MiB约束、1600万安全像素上界、仅允许240/480/800目标最长边；真实 `pica.resize/toBlob` API未被Mock。选文件或改最长边立刻失效旧generation、取消`cancelToken`并清除旧Blob；`operationRef` 同步单飞防止解码/缩放重叠，取消时界面显示等待旧任务结算才解锁运行按钮。`key={level}`让每个场景独立重挂，旧任务卸载后不可回写。

注意pica官方文档中 `cancelToken` 通过Promise rejection结束resize任务，但不能取消已进行的ImageBitmap解码、PNG编码，也无法证明Worker已经terminate；Worker可能按配置 idle 时间复用。禁止把仅设置`running=false`冒充真实取消。本地复现：`node --test packages/library-lab/entries/E15-pica/examples/resize-policy.test.mjs`（只覆盖纯尺寸/输入策略）。PLATFORM仍须在Chromium运行真实pica、反复更换文件/取消/重挂，测量Blob URL、Worker/内存回收与CSP，并运行typecheck/build。
