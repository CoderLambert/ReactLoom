# E15 pica — 工程手册

## 适用

在浏览器里把画布高质量缩小并导出 PNG。构图裁剪用 E14。上传不在 pica 里。不要用 CSS 宽度代替 `resize`。

## 版本

`pica@10.0.3`，MIT。调用工厂 `pica()`，再 `resize` 与 `toBlob`。策略在 `examples/resize-policy.mjs`：4MiB，1600 万像素，最长边 240、480、800，只缩小不放大。

## 迁移

复制 `examples/example.tsx` 的单飞、generation 和 `cancelToken`。`examples/demo.tsx` 只是再导出。`key={level}` 隔离文件和 Blob。bitmap 必须 `close()`。结果 URL 在 effect 里 revoke。不要从 CDN 再加载一份 pica。

## 不可删的清理

取消要 reject `cancelToken` 并递增 generation，清空两张结果。卸载同样递增并取消。`operationRef` 在入口同步置位，finally 里才放下。旧 `toBlob` 不得在 generation 变化后 `setResultBlob`。

## 反例

- 每个渲染调用 `pica()`。
- 不传 cancel、不看 generation。
- 并行两次 resize 共用实例。
- 用文件字节比较画质。
- 只查 `file.size` 不查解码像素。
- 把 Worker 回退说成已验证。
- 脚本标签加载库。
- 界面可选的边长不在 `ALLOWED_LONG_EDGES` 里。

## 测试断言

- 非法 MIME、超限字节、超限像素、未知边长被拒绝。
- 目标尺寸不超过源，且长边不超过所选值。
- 浏览器：按钮才运行；取消不回写；离开后不再 setState。
- policy 测试不是 pica SDK PASS。

## 真实限制

示例源是 Canvas，不是相机原片。未设置锐化参数。cancelToken 不是 AbortSignal。resize 结束后的取消只丢掉编码结果。Worker 与 CSP 没有收据。

## 证据

sdk、build、browser 保持 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有 E15 收据。Actions `41779873259` 是仓库级运行，不是本条目 PASS。

资料：https://github.com/nodeca/pica 。
