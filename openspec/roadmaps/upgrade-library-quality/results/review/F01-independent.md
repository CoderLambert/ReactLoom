# F01 Uppy 非作者独立复核

2026-11-18，当前F01-uppy，@uppy/core6.1.0。仅写本报告，不改entry/shared、不重复作者SDK5/policy6或共享检查/浏览器。按catalog→metadata→agent→全部运行sourceFiles→verification→guide检索，并读local-validation、实际SDK测试与浏览器提案。

结论：Spec与静态质量、真实Core新消费者、独立预览policy及五文件迁入编译PASS；没有实质整改项。浏览器input/drop/迟到读取和正式收据仍NOT_RUN，不由NodeCore成功推为浏览器上传/文件安全通过。

## 新真实Core消费者

cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`，`node --input-type=module`内联ESM，exit0。实际导入local-queue.mjs，用observations.md与archive.exe同批，真实Core新增1/未新增1并有restriction事件、无fatal。再加second.txt后，总数2，再加third.csv/fourth.md整批拒绝，原id集合不变。

remove确实改变队列；clear清空但不调用逐文件投影同步回调，因此UI手工setFiles([])必要。最后再放一个真实File，调用bindLocalQueue的dispose，Core getFiles为空且owned回调不再收到随后受控emit('file-added')探针。此emit只测试解绑，不声称销毁后实例API不可用或重新添加文件。

```json
{"trial":"REAL_CORE_PASS","partial":{"added":1,"notAdded":1},"overCountBatch":{"added":0,"notAdded":2},"clearHasNoPerFileCallback":true,"offBeforeDestroy":true,"coreFileRefsCleared":true}
```

真实Core部分与后述预览policy分列。没有Uploader、upload调用、远程服务或网络成功。Node没有浏览器online/offline监听、input/drop，不能由此证明这些路径清理。

## 新纯预览消费者

同一个独立脚本继续调用实际readTextPreview：空Blob返回空字符串；3999个ASCII后接emoji再接z，输出4000码点并完整保留emoji；恰好12000字节的ASCII接受且显示截4000；NUL与非法UTF8过长编码拒绝。12001字节Blob覆盖arrayBuffer统计读调用，前置预算拒绝且读取次数0。

```json
{"trial":"PREVIEW_POLICY_PASS","empty":true,"displayCodepoints":4000,"emojiWhole":true,"UTF8Fatal":true,"NULRejected":true,"byteBudget":12000,"overBudgetReads":0}
```

这些是Blob/解码策略，不计Uppy SDK数量。12,000是十进制字节，4,000是码点非字素簇，1MiB是Core排队预算，三者没有混用。空文本与null未预览状态在UI区分，文本节点输出不执行HTML。

## 五源文件严格迁入

复制example.tsx、local-queue.mjs/.d.mts、preview-policy.mjs/.d.mts到独有tmp，node_modules只链接现有Lab依赖。新consumer导入真实组件、LocalFile/BatchSummary、Core工厂/绑定/批次和Promise<string>预览；只编译，不执行React/DOM。

cwd `/home/lambert/githubRepos/lambert/ReactLoom`，argv：

```text
pnpm exec tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution Bundler --jsx react-jsx --skipLibCheck /tmp/f01-independent-aztwywd3/consumer.tsx
```

exit0、stdout/stderr空；复制的实际UI与类型使用通过，第三方声明内部skipLibCheck，不是fresh install或全工作区检查。最后仅删除本次tmp。

## 六项分层

|要求|状态与依据|
|---|---|
|技术准确|PASS，真实Core+预览策略/静态。addFiles部分接受与数量整批拒绝/非throw语义、事件数不等文件数、clear无逐文件removed、off后destroy文件引用清空均有实执行。|
|解释清楚|PASS，静态：队列/传输/内容解析区分、三个目标、真实批次摘要/失败恢复、1MiB/12000字节/4000码点与外部授权边界清楚。|
|Demo有用|Node队列/策略PASS，浏览器NOT_RUN。basic入队限制、business读取/移除、advanced超限/清空各有操作与观察；无假上传进度或Uploader承诺。|
|源码可迁移|PASS，五原件strict consumer编译。Core effect创建与keyed会话、原生input/drop、所有helper声明齐全，精确依赖/ESM/ReactDOM/TS前提、无Provider/CSS/env/server明确。|
|官方来源可靠|PASS，原字节/安装字段：固定transloadit/uppy commit41edd0f96a450616431cec1e57c2cb70e7c1a9e7的Core README；独立raw请求packages/%40uppy/core/README.md与本地SHA均2ce52890c65c3b27618a991c62a90907e692b05d8523c0da81b8b16ee807e01e。metadata保留原path @、sourceUrl编码%40，实际来源一致。安装6.1.0/MIT与保留MIT LICENSE一致，固定树无中文包README，en回退。当前及保存官网GET200无明确frame拒绝头，unknown不冒称allowed。|
|结果可复核|真实Core/预览/迁入层PASS，browser/formal NOT_RUN。作者SDK5与policy6分列，独立新consumer另列，不重复或将纯策略计成SDK；具体argv/cwd/output在上。|

## 清理与迟到结果

Core持有真实File，React列表只存id/name/size/type投影，减少双主人。临时restriction收集器finally off；三个持久监听cleanup先off再destroy，避免清理触发已卸载setState。Core销毁清文件/store，不强制释放其它代码的File引用，也不承诺所有内部timer取消，文档没有这些夸大。

所有新增/删除/清空/下一次预览/卸载都会递增generation；读取开始先清旧preview，成功/错误都检查token。原生arrayBuffer未物理abort，旧读取可结算但不能覆盖新预览。浏览器提案持有真实读取结果后删除/新读取/卸载再release，观察epoch而非虚构取消读取；只有DOM消失不足以证明内部Core销毁，实际Core文件/事件清理由本次Node运行与浏览器范围分别限定。

限制扩展名/MIME不是ACL、病毒扫描或服务端配额；没有执行CSV/Markdown/HTML，数据不传远端。错误后队列保留、下一预览可恢复，clear只动当前Core不清全局存储。

报告完成，停止写入，浏览器由主控执行。
