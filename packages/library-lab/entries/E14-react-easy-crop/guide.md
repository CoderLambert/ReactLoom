# react-easy-crop 6.2.4｜受控裁剪框和 Canvas PNG

`library.json` 钉住 `react-easy-crop@6.2.4`，MIT。它提供拖动和缩放的裁剪框，以及 `onCropComplete` 的像素区域。它不编码图片、不上传、不保留 EXIF。导出是本示例自己的 Canvas。

## Lab 当前示例

真实组件是 [`examples/example.tsx`](examples/example.tsx)。[`examples/demo.tsx`](examples/demo.tsx) 只再导出。边界在 [`examples/crop-policy.mjs`](examples/crop-policy.mjs)。

用户点开 Demo 后才挂上 `<Cropper>`。没有 `localhost:5173`。默认图是内联 SVG data URL，不请求外网。

挂载行为：

- `crop`、`zoom` 受控。`minZoom={1}`，`maxZoom={3}`。
- 比例：basic 为 1，business 为 16/9，advanced 为 4/3。
- `onCropComplete` 的第二个参数是像素区域，写入 `area`。检查文件期间不更新 area。
- 「裁剪并导出 PNG」调用 `cropToPng`：`Image.decode`，`checkImageDimensions`，`checkCropArea`，再 `drawImage` 和 `toBlob(..., 'image/png')`。
- 源和结果的 object URL 在 effect 清理时 `revokeObjectURL`。
- `source`、`aspect` 或 `zoom` 变化会作废进行中的导出：递增 generation，清空结果。
- 双击由 `activeExport` 同步挡住。旧导出的 finally 不能清掉新导出的锁。
- advanced 才有文件选择：`image/png`、`image/jpeg`、`image/webp`。`checkImageFile` 要求非空且不超过 4MiB。再用 `createImageBitmap` 看像素，不超过 1600 万，然后 `bitmap.close()`。输出像素超过 400 万会在 `checkCropArea` 抛错。
- 换文件时作废旧结果，缩放和位移回到 1 和原点。

没有旋转。源码写明：若加上 `rotation`，必须同时改导出几何。当前 PNG 不是服务器裁剪，也不保留 EXIF。

没有挂载：Uppy、上传 mutation、PhotoSwipe 预览导出图、pica 二次缩小。

## 1. 产品边界

| 任务 | 判断 |
| --- | --- |
| 头像、封面，要在浏览器里选一块矩形 | 适合，导出必须用像素而不是百分比冒充文件 |
| 只看大图 | E13 |
| 整图高质量缩小 | E15 |
| 要旋转、滤镜、多层 | 另做几何和编码，不要只加一个 prop |
| 要服务端按 EXIF 方向裁 | 本示例做不到 |

百分比坐标不能直接当文件。`croppedAreaPixels` 才是 Canvas 的源矩形，而且库会取整，所以导出前还要 `checkCropArea`。

## 2. 数据流

```text
SVG 或本地 File
    │ object URL（File 才需要）
    ▼
Cropper（crop / zoom / aspect）
    │ onCropComplete → 像素
    ▼
checkCropArea
    ▼
canvas.drawImage → image/png Blob
    │
    ▼
结果 object URL（可另存，不上传）
```

权威的裁剪结果是 Blob。屏幕上的框是交互状态。两者用 generation 对齐，避免慢的 `decode` 把旧图写到新文件上。

官方入口：[仓库](https://github.com/ValentinH/react-easy-crop)、[npm](https://www.npmjs.com/package/react-easy-crop)。

## 3. 三层

在 Library Lab 打开 E14 再运行。

### 基本

方形框。拖动图片，缩放滑块从 1 到 3。像素 JSON 会变。导出后出现 PNG 预览和字节数。字节数不是画质分数。

### 业务

16:9，当作新闻封面教学。仍然是本地 SVG 或你在 advanced 才换上的文件。没有标题字段，没有保存到文章 API。

### 进阶

选择本地图片。类型或大小不对时，错误写在 `role="alert"`，不替换当前源。超大像素在 bitmap 阶段拒绝。导出期间按钮会显示处理中。换缩放会清掉上一次 PNG。

## 4. 反例（带代码）

### 反例 1：把百分比当像素

```ts
ctx.drawImage(image, areaPercent.x, areaPercent.y, areaPercent.width, areaPercent.height, 0, 0, w, h)
```

`onCropComplete` 的第一个参数是百分比。Lab 使用第二个参数，并再校验边界。

### 反例 2：不限制解码像素

```ts
const bitmap = await createImageBitmap(file)
canvas.width = bitmap.width
```

文件只有几兆也可能解出巨大位图。Lab 在绘制前 `checkImageDimensions`，并在 finally 里 `close()`。

### 反例 3：不释放 object URL

```ts
setLocalUrl(URL.createObjectURL(file))
```

每次选择都泄漏。Lab 用 effect 的清理函数 revoke。结果 Blob 同样处理。

### 反例 4：旧导出写回新图

```ts
const blob = await cropToPng(source, area)
setResultBlob(blob)
```

用户已经换文件时，这次 Blob 必须丢掉。Lab 比较 generation 和 `activeExport`。

### 反例 5：双击两次导出

只靠按钮 `disabled` 挡不住同一拍的两次点击。Lab 用 ref 做同步闸门。

### 反例 6：加上 rotation 却沿用同一 drawImage

旋转后的采样矩形不是现在的 `x, y, width, height` 直接平移。源码禁止在未改几何时宣称支持旋转。

### 反例 7：把裁剪框组件当成已上传

导出只留在浏览器。没有 fetch。不要在文案里写「已保存封面」。

### 反例 8：跨域图片不设 crossOrigin

本示例的源是 data URL 或 blob URL。若改成远程 URL，Canvas 会被污染，`toBlob` 失败。那不是本 Demo 的路径。

## 5. 组合（未挂载）

**E13。** 导出 PNG 可以再放进灯箱，但要写真实像素宽高，并 revoke 不再使用的 URL。

**E15。** 先按业务裁剪，再把 PNG 画布交给 pica 缩到允许的最长边。不要用 CSS 缩放冒充已缩小的文件。

**上传队列。** 选择文件、裁剪、上传是三步。上传失败保留 Blob，取消时 revoke。Query 只在服务端确认后更新文章封面 URL。

**E01。** 编辑器只保存最终资源 id。裁剪 UI 不要嵌进每个按键都重渲染的文档事务里。

## 6. 性能与可访问性

滑块有 label。裁剪区是固定高度 330 的容器。键盘是否能操作 Cropper 内部手柄，没有收据。

`createImageBitmap` 和 `drawImage` 都在主线程旁边占用内存。4MiB 与 1600 万像素是拒绝阈值，不是流畅保证。不要写虚构的毫秒数。

中文不进入像素路径。文件名不要当成可信 HTML。

## 7. 升级核对

- 锁定 6.2.4。`onCropComplete` 的参数顺序以 npm 文档和当前源码为准：第二参才是像素。
- 升级后用一张已知尺寸的 PNG 对比 `checkCropArea` 是否仍拒绝越界。
- 不要从旧版 class 组件示例里把 crop 改成非受控又和现在的 state 混用。

## 8. 故障

| 现象 | 先看 |
| --- | --- |
| 导出按钮一直禁用 | `area` 是否还是 null，或仍在检查文件 |
| 提示超出源图 | 取整后的像素越界，策略拒绝 |
| 换图后还是上一张 PNG | generation 是否递增 |
| 内存涨 | object URL 是否 revoke，bitmap 是否 close |
| toBlob 失败 | Canvas 是否被跨域污染。本示例不应出现 |
| 旋转后内容歪 | 本示例没有旋转支持 |

## 9. 验收

1. basic：拖动后像素 JSON 变化，能导出非空 PNG。
2. business：框是 16:9。
3. advanced：拒绝超限文件；合法文件替换源；换缩放后旧 PNG 消失。
4. 离开 Demo 后 blob URL 已 revoke。
5. 没有请求上传接口。

sdk、build、browser 保持 **NOT_RUN**。没有 `docs/library-lab/evidence/runs/` 的 E14 收据就不能写 PASS。Actions `41779873259` 是仓库级运行，不是本条目通过。

## 10. 资料

- https://github.com/ValentinH/react-easy-crop
- https://www.npmjs.com/package/react-easy-crop
