# E14 react-easy-crop：裁剪 UI、坐标与真正的图片导出

## 目标

新闻封面、头像、用户上传配图需要可拖动、缩放、确定裁剪区域。react-easy-crop 提供交互与像素回调，**不负责生成最终图片**。实际导出必须结合Canvas或服务端裁剪流程。此示例完全在浏览器本地执行，不上传任何文件。

基线：react-easy-crop 6.2.4、MIT。完整运行源码 examples/example.tsx，宿主导出 examples/demo.tsx。

## 安装

```sh
pnpm add react-easy-crop@6.2.4
```

```tsx
import Cropper from 'react-easy-crop';
<Cropper image={url} crop={crop} zoom={zoom}
  aspect={16 / 9}
  onCropChange={setCrop}
  onZoomChange={setZoom}
  onCropComplete={(_, pixels) => setArea(pixels)} />
```

必须把Cropper放在 position:relative 且明确高度的容器里，否则其绝对定位可能覆盖整个应用。自动样式注入和手动CSS加载二选一，避免在多个容器里重复注入。

## 三层实际应用

Basic：原创SVG、方形裁剪区域、滑动改变zoom与拖动改变crop。
Business：宽高比16:9，获得 onCropComplete 的 croppedAreaPixels，把其 x/y/width/height用于Canvas drawImage，使用canvas.toBlob真生成PNG。
Advanced：本地PNG/JPEG/WebP文件，不超过4MiB；导出前校验解码像素不大于1600万，切换媒体/参数后废弃旧导出结果、URL.createObjectURL逐个revoke。

提示：高级边界只演示无rotation的方案。增加rotation时，需要变换/旋转的Canvas裁剪公式；不能继续直接把像素矩形画上去就声称旋转裁剪正确。

## 关键数据流

File / 本地SVG → 可解码图像 → Cropper内部手势/缩放 → onCropComplete像素矩形 → 新Canvas绘制 → Blob → 本地ObjectURL → 结果预览。焦点、业务校验和持久化由产品侧实现。

**坐标精度**：croppedAreaPixels有舍入误差，保存/恢复编辑会产生偏移。要稳定恢复UI，参考官方 croppedArea 的百分比或 cropSize API，而不是机械持久化rounded pixels。

## 专属反例

1. **只拿回调就称已生成裁剪文件**：回调是几何信息，不是图片字节；需要真实Canvas输出或服务端实现。
2. **忽略图片解码尺寸**：上传文件字节小不代表像素小，解码巨图可能造成内存风险。应在展示/处理前尽早校验宽高和总像素，本例仍需实测不同浏览器解码极限。
3. **直接裁剪第三方图像**：跨源图片绘制到Canvas会污染画布，toBlob失败；必须确保CORS、合法来源和安全策略。
4. **忘记URL.revokeObjectURL**：反复换图和导出会长期持有Blob内存，卸载或替换时必须回收。
5. **将外部旋转属性加入但不改导出公式**：导出画面与预览位置不一致，需要同步几何算法与单测。

## 组合和生产约束

- E15 pica：完成裁剪后，再对Canvas/Blob像素做高质量缩放。pica不是裁剪手势库。
- E13 PhotoSwipe：先大图预览、再进入裁剪工作流，避免两个库同时控制同一Pointer事件。
- 对内容上传，服务端仍需检查格式、文件大小、解码结果与资源权限；本示例本地导出不等于完成安全上传。
- 组件可能涉及键盘箭头、滚轮与移动手势，应测试页面滚动冲突、焦点和触屏缩放，不能只测鼠标。

## 验证

PLATFORM安装后执行真实typecheck/build和Chromium：拖动更新坐标、改变比例、实际PNG Blob非空且可解码、重复换图/卸载后ObjectURL撤销、本地文件大小和解码像素限制、没有上传网络请求。状态目前 SDK NOT_RUN / build BLOCKED / browser NOT_RUN。

官方：https://github.com/ValentinH/react-easy-crop

## EF wave19：有效矩形、异步所有权与输出预算

`examples/crop-policy.mjs` 是**真实导出路径所使用**的约束：非空文件≤4MiB、解码源图≤1600万像素、`croppedAreaPixels` 必须为安全整数且完全落在解码源图内部、输出≤400万像素。限制必须在 `canvas.width/height` 分配之前执行；大图允许进入交互但若裁剪输出过大，会提示继续放大再重试。Canvas `toBlob` 必须生成非空PNG。**禁止**只约束源文件大小而忽略画布尺寸。

拖动/改变缩放/切换文件即失效正在导出的 Promise；`activeExport` 用同步任务ID挡双击，旧finally不能解除新任务的门禁。新文件解码时禁用导出；`createImageBitmap` 在成功和异常中释放 bitmap。详见实际源码。运行 `node --test packages/library-lab/entries/E14-react-easy-crop/examples/crop-policy.test.mjs` 只验证独立纯策略，不能计SDK/浏览器 PASS。PLATFORM须执行真实Cropper手势、PNG解码/实际尺寸、重复快速选择、取消回写、Blob URL回收与CSP。源SVG由本地可信代码构造；用户上传SVG未开放。不执行收费服务。
