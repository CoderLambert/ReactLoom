# F01 Uppy — 工程手册

## 适用

批量队列、限制、以后要接传输协议。单次选择用 F02。CSV 解析用 F03。本页没有上传。

## 版本

`@uppy/core@6.1.0`，MIT。导入 `Uppy` from `@uppy/core`。不要把 5.x 的 React `DragDrop` 包装抄进来。Dashboard、XHR、Tus、S3 都未安装在这条示例上。

## 迁移

带走 `examples/example.tsx`、`examples/preview-policy.mjs` 和 `.d.mts`。`demo.tsx` 留在 Lab。实例放在 effect 里，id 保持唯一，`autoProceed: false`。限制保持最多 3 个、1 MiB、`.txt` `.csv` `.md`，除非产品改了文案和测试。

接上传时另加官方插件，并单独做服务端校验。不要把 Core 队列当成已入库。

## 不可删的清理

卸载时摘掉 `file-added`、`file-removed`、`restriction-failed`，然后 `destroy()`。`key={level}` 必须留着。预览、删除、清空、换文件都增加 generation；过期的 `readTextPreview` 不能 `setPreview`。预览继续拒绝大于 12 000 字节、非法 UTF-8 和控制字符，显示不超过 4 000 字符。

## 反例

- 渲染函数里 `new Uppy()`。
- 用扩展名代替服务端魔数和配额。
- 把对象存储长期密钥放进前端。
- 监听 `complete` 就当全部成功。
- 普通 POST 重试宣传成续传。
- 服务端模块级共享带用户 id 的实例。
- 再维护一套百分比 store。
- 无界 `blob.text()`，或在删除后仍回写预览。
- 画假进度并称为 XHR 已通过。

## 测试断言

- 合法文本能进队列；第 4 个和大于 1 MiB 的文件被 Uppy 拒绝。
- 删除后条数减少，预览被清掉。
- 12 001 字节在读字节前拒绝；含 NUL 和非法 UTF-8 拒绝；8 000 个 `x` 只显示 4 000。
- 换场景不保留上一棵树的 File。
- 策略单测不加载 `@uppy/core`。

## 真实限制

页面只做本地选择和有界预览。没有百分比，没有 Tus offset，没有服务端 413。`allowedFileTypes` 不是安全边界。中文文件名不能直接当磁盘路径。

## 证据

没有 `docs/library-lab/evidence/runs/` 收据就不要写 sdk 或 browser PASS。锁文件里有 Core 只说明装得上。仓库级 Actions 41779873259 不能抄到 F01。
