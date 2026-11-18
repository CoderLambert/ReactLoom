# D06 Immer 独立试用与评审

日期：2026-11-18。对象为当前工作树 `entries/D06-immer`，SDK `immer@11.2.9`。只写本报告，未改条目、共享文件或验证状态；未重复作者完整 8 项测试，未运行生成、全量构建或 typecheck。

## 结论

Spec 静态复核 PASS；质量静态复核与独立真实 SDK 消费试用 PASS。实现未发现实质问题；验证记录有一处需更正文案的证据分类问题（见下）。Demo 真实浏览器验收与最终“六项全部通过”仍 NOT_RUN，等待主控执行浏览器提案；正式 sdk/build/browser 收据继续 NOT_RUN。

检索顺序为根 LIBRARY_CATALOG.md 的 D06 → library.json → agent.md → 全部六个声明源文件 → verification.json → guide.md，并阅读条目维护规则、测试、local-validation.md、浏览器提案及官方来源证据。适用规则与质量 skill 的三份参考已核对。工作树存在大量并行改动，未覆盖任何他人文件。

## 独立消费者试用

在仓库根执行独立 `node --input-type=module` 内联脚本（exit 0），导入文档列出的 `feed-model.mjs` 五个导出和 `patch-ownership.mjs` 的 takeUndo，通过 Lab package 的 createRequire 加载实际 Immer，显式 enablePatches。未依赖测试内部函数或 Lab 宿主。

依次验证带空格的改名归一化、故事数组真实共享、按 s2 ID 更新只复制对应行、原始 fixture 内容不变、全部已读后的第二次调用保持同一个 root，以及故事 ID 仍为 s1/s2。之后以真实 produceWithPatches 插入消费者故事，先 takeUndo 捕获 inverse、清空 ref，再将 ref 改为另一批 Patch；延迟闭包 applyPatches 仍准确恢复原内容，且不读取或破坏新 ref。实际输出：

```json
{"trial":"PASS","sdk":"11.2.9","storyIds":["s1","s2"],"noOp":true,"patchCount":4,"deferredSnapshot":true}
```

这个试用验证模型与迁移接口，不充当 React/browser 执行。作者 validation/sdk.log 确有 8/8 PASS，但正确分类是 sdk.test.mjs 的真实 SDK 6 项 + patch-ownership.test.mjs 的纯策略 2 项；本次没有将它改写成正式 SDK 收据。

### 需更正的证据表述

P2：local-validation.md 将上述通配测试的 8 项统称“真实 SDK 8 项”，verification.json 的 sdk.note 同样写“本地真实 SDK tests 8 项通过”。其中 2 项是纯 takeUndo 策略测试，不导入 Immer。请改为“本地测试 8 项通过：真实 SDK 6 + 策略 2”，并同步任何汇总表，避免抬高 SDK 测试数量。既有 8/8 执行结果有效，不需要重跑；正式 NOT_RUN 状态本身正确。

## 六项评审

|要求|结论与证据层级|
|---|---|
|技术准确|PASS，静态 + 独立真实 SDK：base/draft/next、按路径复制、no-op、Patch 元组和 enablePatches 均对应安装包 dist/immer.d.ts；回滚承诺恢复内容而非旧对象身份。|
|解释清楚|PASS，静态：guide 从 RSS 深层更新与选型取舍进入机制，再到三条操作链；明确 SDK/业务锁/fixture/无网络边界。|
|Demo 有用|静态 PASS，浏览器 NOT_RUN：改名结构共享、按 ID/批量 no-op、受控 inverse 回滚分别增加独立知识；JSON 之外有真实 === 引用面板。|
|源码可迁移|PASS，静态 + 模型试用：文档完整列出 example.tsx、两组 .mjs/.d.mts、React 宿主、精确依赖、structuredClone、bundler 模块解析；demo.tsx 仅重导出，无 Lab 私有导入或必要 CSS。|
|官方来源可靠|PASS，字节复核：固定 commit 75a290e44ba14bd723c8ef8546b6559c8ef3ae88/readme.md，上游 raw HTTP 下载与本地 snapshot 都得到 aa4c25aa3b251470ec5512d4271c202d229a0a9ffcf377762be331a5157edfba，与 metadata 相同；source-evidence.json 记录固定树无中文 README。中文官网保留直达，HTTP 200 没有被误称嵌入 PASS，unknown 合理。|
|结果可复核|模型层 PASS；整条目运行验收 NOT_RUN：本报告列出独立执行输入、结果与范围；作者 8 tests/Biome 日志已读，浏览器提案尚需主控执行，build 不在本次范围。|

## 安全与时序核对

所有 recipe 同步，无 draft 跨异步边界。故事查找与 React key 均为业务字符串 ID；乐观 ID 由递增 revision 产生，回滚重用的 ID 对应已移除故事，不与当前数据碰撞。

UI 的 rename/toggle/batchRead/optimisticChange 均同步检查 undo ref，待确认时禁用相关可见控件；ref 先更新再排队 state，避免同一批未渲染事件覆盖 inverse。latest ref 保存最新同步快照。rollback 先 takeUndo，再捕获局部 inverse 进入纯 updater，禁止延迟读取已清空 ref；独立试用额外覆盖 ref 后续被替换的情况。锁只保护本组件控制的写入；文档明确真实缓存并发需 token/revision 与失配协调，未声称这套本地锁保护外部更新。

主控剩余条件：实际浏览器执行 basic/business/advanced、锁定、撤销、确认与卸载重挂载。通过前保留上述 NOT_RUN，不由模型试用推定浏览器或正式收据通过。
