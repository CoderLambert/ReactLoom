# A08 Mermaid — 工程手册

## 适用

`mermaid@12.2.0` 把受信任的 DSL 编成 SVG。可拖节点用 A06，关系探索用 A07。不要把用户文章里的原始字符串直接 `initialize`，也不要把 SVG 灌进页面 HTML。

## 版本

钉 `mermaid@12.2.0`，MIT，ESM。`startOnLoad: false`，`securityLevel: 'strict'`，`theme: 'neutral'`。v12 默认布局可能是 ELK；本示例没有钉 `layout` / `look`。Node 门槛 22.12 来自上游，不是浏览器验收。

## 迁移

弃用 `mermaid.init` 扫全文档。受控路径是一次 `initialize`、`parse`、唯一 id 的 `render`。业务 id 映射成 `n0` 这类内部 id。从 v11 升上来要显式写出布局和主题再比截图。不要为了点击改成 `loose`。

## 不可删的清理

`queueMermaidRender` 在调用解析前和提交前都看 `isCurrent()`。effect 清理把代数作废。失败和换图时清空上一张 SVG。iframe `sandbox` 保持空字符串。不要调用 `bindFunctions`。

## 反例

```ts
mermaid.initialize({ ...remoteConfig, securityLevel: 'loose' }); // 错
element.innerHTML = userDiagram; // 错：DSL 不是 HTML
// 对：常量配置 initialize 一次；只把 render 返回的 svg 放进 sandbox iframe
```

固定 render id、每键布局、用 `parse` 代替领域校验，都不要做。

## 测试断言

队列测试断言：过期任务不调用 render、不提交结果；失败只报告给仍当前的主人。SDK 收据还要看到真实 `parse`/`render`、非法 DSL 不保留旧图、iframe 无脚本权限。没有 runs 收据则为 NOT_RUN。

## 真实限制

DSL 是源码常量，没有编辑器、防抖、HTTP 修订或 `accTitle`。时序图和状态图不会生成可执行流程。iframe 隔离也意味着父页面不能再查询内部 SVG。没有布局耗时数字。

## 断言边界

`tests/render-queue.test.mts` 用替身函数证明过期任务不提交。SDK 用例要 `import mermaid from 'mermaid'`，对合法 flowchart `parse` 再 `render`，对非法片段得到失败且不保留上一张 SVG。iframe 的 sandbox 属性应为空。缺收据时保持 NOT_RUN。`initialize` 只调用一次，配置对象不要展开远程 JSON。

## 证据

Actions `41779873259` 的仓库级 install、typecheck、build、52 SDK 文件（153 测试）和 45 Playwright 不是 A08 PASS。不要把队列测试或历史研究 PASS 写入 `verification.json`。

对照 `library.json` 的版本编写 import，不要升到条目未钉死的版本。
`tests/` 中的策略用例不能改写成 sdk 字段的 PASS。
浏览器与构建未留下收据时，对应字段维持 NOT_RUN。
