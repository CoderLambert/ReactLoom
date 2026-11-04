# F08 @react-pdf/renderer — 工程手册

## 适用

用 React 原语生成新的 PDF。阅读已有文件用 F07。修改已有字节用 F09。

## 版本

`@react-pdf/renderer@4.9.0`，MIT。调用 `pdf(element).toBlob()`。字体只用 Helvetica。

## 迁移

带走 `examples/report.tsx`、`examples/example.tsx`、`examples/report-policy.mjs` 和 `.d.mts`。生成必须发生在点击之后。行数据先过 `validatedRows`。不要嵌入网络字体或图片。

## 不可删的清理

`running` 在 await 之前置位。`epoch` 在卸载时增加，过期 Blob 不创建 URL。替换和失败都 `revokeObjectURL`。卸载 effect 再收一次。行数 1–140，名称仅可打印 ASCII。

## 反例

- 挂载时 `toBlob`。
- 只靠 `disabled` 防连点。
- 泄漏 object URL。
- 把中文直接交给 Helvetica。
- 使用 `div` / HTML CSS。
- 去掉 140 行上限。
- `<Image src="https://...">`。
- 过期 Promise 仍 `setUrl`。

## 测试断言

- 非 ASCII、重复 id、空行、141 行、非法文章数被拒绝。
- Blob 不是 `application/pdf` 或小于 100 字节时失败并回收 URL。
- 连点第二次被 ref 挡住。
- 100 行夹具仍能通过校验。
- `policy.test.mjs` 不 import renderer。

## 真实限制

没有中文字体，没有服务端 `renderToBuffer`，没有内嵌阅读器。100 字节只是空文件门槛。分页外观要打开真实 PDF 才算看过。100 行夹具不是压力上限，上限仍是 140 行。

## 证据

没有 `docs/library-lab/evidence/runs/` 收据就不要写 sdk 或 browser PASS。Actions 41779873259 不是 F08 的单项验收。

`tests/policy.test.mjs` 不调用 `pdf().toBlob()`。
