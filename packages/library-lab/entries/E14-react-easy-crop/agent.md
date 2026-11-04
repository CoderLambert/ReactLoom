# E14 react-easy-crop — 工程手册

## 适用

浏览器内选择矩形并导出 PNG。只浏览用 E13。整图缩小用 E15。本库不上传、不保留 EXIF、不包含旋转导出。

## 版本

`react-easy-crop@6.2.4`，MIT。像素区域取 `onCropComplete` 的第二个参数。策略在 `examples/crop-policy.mjs`：文件 4MiB，源像素 1600 万，输出 400 万，MIME 仅 png、jpeg、webp。

## 迁移

复制受控 `crop` / `zoom`、比例、`cropToPng` 和 generation。`examples/demo.tsx` 只是再导出。object URL 放在 effect 里创建并在清理时 revoke。bitmap 用完 `close()`。产品上传发生在拿到 Blob 之后，不在 Cropper 内部。

## 不可删的清理

`source`、`aspect`、`zoom` 变化要作废旧导出。`activeExport` 用同步 ref，旧任务的 finally 不能释放新任务的闸门。卸载时递增 generation。换文件清空结果。不要在未改几何的情况下打开 `rotation`。

## 反例

- 用百分比调用 `drawImage`。
- 不限制解码像素。
- 泄漏 object URL 或不 `close` bitmap。
- 异步结果不看 generation。
- 只靠 `disabled` 防双击。
- 把本地 Blob 说成已上传。
- 远程图片不处理 Canvas 污染。
- CSS 缩放冒充已裁剪文件。
- 检查文件期间仍把 `onCropComplete` 写进 `area`。源码在 `checkingFile` 时会丢掉这次回调。

## 测试断言

- 非法 MIME、空文件、超 4MiB、超像素、越界裁剪、超输出像素都被策略拒绝。
- 浏览器：导出非空 PNG；换图后旧结果不回写；离开后 URL revoke。
- policy 测试不挂载 Cropper，不是 SDK PASS。

## 真实限制

默认源是 SVG。没有旋转、没有 EXIF、没有上传、没有键盘手柄收据。字节数不是画质。

## 证据

sdk、build、browser 保持 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有 E14 收据。Actions `41779873259` 是仓库级运行，不是本条目 PASS。

资料：https://github.com/ValentinH/react-easy-crop 。
