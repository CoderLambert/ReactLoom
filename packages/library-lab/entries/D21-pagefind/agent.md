# D21 Pagefind — 工程手册

## 适用

为已经生成的公开静态 HTML 做全文索引。它不是权限系统，也不是浏览器里随手 import 的搜索组件。

## 版本

`pagefind@1.5.2`。Lab 用 Node API：`createIndex`、`addHTMLFile`、`addCustomRecord`、`addDirectory`、`writeFiles`。

## 迁移

带走 `examples/workshop.mjs` 和 `publication-policy.mjs`。只索引公开 fixture。输出留在临时目录，用完删除。页面不要执行 shell。

## 不可删的清理

`finally` 里 `deleteIndex`，并删除临时目录。`assertPublicDocument` 不能拿掉。HTML 继续走 `escapeHtmlText`。`visitorSearchExecuted` 保持 false，除非你真的在浏览器里搜过并另记证据。

## 反例

- 对 Markdown 源目录运行索引。
- 用 ignore 属性掩盖仍发布的私密 HTML。
- 把 npm 包的 import 当成站点上的 `pagefind.js`。
- 用 innerHTML 渲染标题。
- 每次按键销毁并重建浏览器索引。
- 页面和索引分两次发布。

## 测试断言

- 非 public 记录进不了索引。
- 生成的文件非空，临时目录在结束后消失。
- 语言和选择器与调用参数一致。
- 策略单测不是 Pagefind 二进制已经跑过。

## 真实限制

这次索引语言是英语。没有浏览器 UI，没有中文召回数据。静态索引谁拿到文件谁就能读。

## 证据

没有收据不要写 PASS。仓库级 CI 没有执行这个工作坊。
