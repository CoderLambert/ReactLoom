# JSON Forms：Schema、界面与提交各自有边界

订阅配置会随类型显示不同字段，还要区分结构错误、业务字段错误与保存状态。JSON Forms把可信JSON Schema与UI Schema交给renderer/cell集合，生成真实控件和校验；应用仍负责草稿、最终payload和请求生命周期。适合Schema驱动配置页；固定少量字段用RHF更直接，只验证对象则不需要renderer。

固定 `@jsonforms/core/react/vanilla-renderers@3.8.0` 三包、`ajv@8.20.0`，MIT，宿主React19.3.0；React包peer覆盖16.12/17/18/19。没有Material套件、远程schema、HTTP、剪贴板或用户存储。标签来自中文Schema title；默认校验消息仍是SDK/Ajv消息，没有伪称接入中文i18n adapter。

## 数据如何到达控件与提交

```text
可信JSON Schema → Ajv结构校验
UI Schema → Vanilla Control → Cell → 真实输入
JSON Forms onChange(data, errors) → 已通知草稿与Schema错误数
点击保存 → 同Schema复验 → payload白名单快照 → 本地延迟fixture
                                → additionalErrors或成功状态
```

JSON Forms3.8在初始化也通知，实际React实现用10ms debounce发送core.data/core.errors。它不是保存动作，也不保证每次原生按键都同步通知应用。页面“已处理的SDK onChange”包含初始化/校验；“累计模拟提交次数”只统计通过提交门闩的本地操作。保存使用**最近已通知的草稿**并在开始时生成新payload，回包时不重新读取后来草稿。

`onChange.errors`与`additionalErrors`是独立通道。前者控制Schema错误计数/按钮，后者保存服务形状字段反馈。仅错误数组变化时不能把服务错误抹掉；本例只在SDK通知数据真的变化时清服务错误并使旧操作失效。

## 目标一：真实Schema控件与初始化校验

选择“Schema 驱动控件与校验”。真实JsonForms用基本Schema画出工作区名称与启用复选框，renderer负责标签关联，cell负责实际输入。

1. 等待SDK首次通知，错误数从“等待通知”变0，JSON草稿显示Library Lab/true。
2. 名称改成单字母a，SDK错误数增加、校验消息可见；草稿仍保留a，应用不替用户改写。再改回合法名称，错误清除。
3. 切换启用，JSON布尔值随真正SDK数据变化；onChange计数变化不是保存成功。

schema/uischema/renderers/cells均为稳定模块值，不每次渲染重造配置；没有在onChange里发保存或trim中文组词文本。

## 目标二：HIDE不等于删除数据

选择“HIDE 与提交白名单”。订阅类型rss时URL必填，至少8字符且有https://前缀；manual时UI规则隐藏URL，Schema不再要求该值通过RSS分支。

1. 展开“查看最终 payload”，切成manual：URL控件不可见，payload中完全没有url。
2. Vanilla3.8的HIDE实际设置控件wrapper的hidden，input及data可以仍在DOM/草稿里；它不是删除、禁用或提交白名单。切回rss，原地址再次显示。
3. 把地址改成http://example.org/feed，Schema模式失败并禁用保存；修回https后恢复。
4. 保存manual或rss，页面显示本次提交快照及160ms本地结果。名称和URL只在payload中trim，不把trim值写回输入。隐藏字段是否允许提交，由toSubscriptionPayload决定。

`^https://`只检查前缀，不解析URL。`https://`长度正好8，能通过这条长度/前缀检查却不是合法完整URL；`https://a`长度9，不能被称为“太短而必然被Schema拦住”。第二层validateSubmission另用URL解析并拒绝凭据/片段，但不做DNS/重定向或抓取授权。本例根本不抓取输入URL。

## 目标三：服务错误、快照和取消

选择“字段错误、提交快照与取消”，本地延迟500ms：

- 名称duplicate触发模拟409，additionalErrors的/name消息显示在真实字段。Schema错误仍可为0，允许再次提交；这不是HTTP响应。
- 凭据或片段URL可通过Schema前缀，却被本地服务形状规则拒绝为模拟422，错误回填/url。未知字段不能经toServerError进入任意路径。
- 修改真实数据后，旧字段错误与旧提交快照清除。仅校验通知不清它们，避免服务错误闪退。
- 保存期间编辑：收到SDK数据变更通知后推进generation、abort；旧500ms结果无资格回写。取消立即作废代际/清timer，重置还原草稿及Schema等待状态。

AbortSignal不会自动取消setTimeout；abortableDelay监听signal并clearTimeout，完成后移除监听。任务启动就捕获规范payload，新输入不改变旧快照。成功、catch、finally均检查存活/代际；取消不宣称真实服务器没有写入。

重置递增formEpoch并重新挂载当前JsonForms，旧provider的10ms通知被拒绝；它只重建本表单。公共level切换创建新Session，卸载alive=false使晚通知无法写入旧状态，同时abort自有任务。重置清旧composition所有权，不复用已移除输入的组词状态。

组合期间点击保存只提示完成选词，不增加本地提交次数；结束后才能开始新操作。浏览器提案用明确的CompositionEvent验证应用门闩，**不是操作系统中文候选窗口验收**。

## 迁移所需文件和所有权

复制example.tsx、submission-policy.mjs、submission-policy.d.mts、forms.css；demo.tsx只是Lab出口。三个JSON Forms包同版，renderer/cell成对，不额外安装Material。没有Lab alias或外部资产。

应用拥有草稿、服务错误、提交快照、generation/epoch/存活门闩和本地controller/timer；SDK拥有控件、核心状态和内部通知。只清自有任务，不能全局取消SDK工作或修改宿主CSP。strict CSP中的Ajv编译需求需按真实环境设计standalone或服务端边界，这里没有这些产物，不能据本例要求整站降低策略。

## 常见错误

- 把UI HIDE当成删除data、禁用input或POST白名单。
- 初始化onChange就发请求，或每次错误通知都清additionalErrors。
- 服务错误内联新建数组，造成状态反复更新；或把服务错误数当Schema错误数永久禁用提交。
- 回包后读取可变dataRef作为本次输入，取消只改一句状态而不清任务/作废代际。
- 把JSONSchema关键词then当Promise字段删掉，或把前缀匹配说成URL抓取授权。

## 官方与验收边界

[官方React README原文](official/readme.md)固定eclipsesource/jsonforms的v3.8.0真tag，commit `6075bcee93205c8fbe1f88eec19ed9058ad0f965`，path packages/react/README.md；英文4592B，SHA-256 `618f7fb0bccfab2827effb645a0759a38a0d27b545194ae9a73cb8ab9e32aa0b`。三个npm3.8.0均省略gitHead，不能伪造该字段；同commit manifest确认目标版本。完整tree及中文候选检查见[source-evidence.json](official/source-evidence.json)，未翻译改写原文。

官网jsonforms.io真实GET200完整头为XFO SAMEORIGIN及强制CSP frame-ancestors self，**blocked**并保留直达。正文未读完的初次请求有失败记录；后续仅取得完整headers、正文NOT_READ，不冒称iframe已运行。

局部真实SDK3是Vanilla初始SSR标签/HIDE、同Schema Ajv和NoValidation下additionalErrors显示；原pure4只验证payload与字段映射，均不能证明动态onChange/焦点/IME或取消。实际命令/六项见[local-validation.md](local-validation.md)，完整三条[browser提案](validation/browser-proposal.txt)交主控统一运行。触屏/读屏、真实OS输入法、SSR hydration、远程schema/HTTP授权与资源普查未验收；正式sdk/build/browser仍NOT_RUN。
