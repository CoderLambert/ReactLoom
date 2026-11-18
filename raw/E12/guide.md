# assistant-ui：真实聊天运行时，确定性的本地回复

需要消息列表、输入框、进行中状态与停止按钮时，assistant-ui把会话状态和UI primitives接起来，模型传输则交给适配器。此例固定@assistant-ui/react0.15.21（实际安装及固定上游package字段MIT），没有模型、检索、工具执行、上传或持久化。回答是原创fixture模板，包含最近用户提问，不能当模型评测或新闻研究成果。

只有一次静态问答可用普通表单；需要会话原语与可替换runtime时再引入。供应商协议、服务端会话和权限由生产系统另外设计，不在浏览器放密钥。

## 数据流与所有权

Composer提交→useLocalRuntime持有user/assistant消息与当前run→ChatModelAdapter.run接收messages/abortSignal→累计全文yield→MessagePrimitive.Parts展示纯文本。AssistantRuntimeProvider把真实runtime提供给Thread/Composer/Message primitives。不要再把进行中消息复制到另一个可写React数组或Query缓存形成双主人。

example.tsx负责Hook/Provider/primitives；local-adapter.mjs是真正传给useLocalRuntime的生成器与取消所有权；reply-policy.mjs只读最近user的text parts，忽略tool/assistant内容，替换ASCII控制字符并按160个码点裁剪。没有user文本时用明确占位句。未知level抛错，/error产生可恢复的本地错误，不把失败当正常回复。

每次yield形如`{content:[{type:'text',text:累计全文}]}`。business每24码点、advanced每18码点扩大前缀，而非把delta当完整消息覆盖，也不把累计片段再追加造成重复。220/450ms只是本地定时延迟，不是模型token速率。

## 三个操作目标

### 1. 最小真实会话

basic输入自己的短句后显式点击发送，收到“本地演示已收到：你的问题。这是确定性回复，不是模型推理。”，一次yield完整文本。原生输入框设置submitMode=none，Enter不自动发送，避免将IME选字Enter当提交；这不等于人工输入法已验。

输入/error再发送，MessagePrimitive.Error显示“本地模拟失败；重新提问可恢复”。再发普通问题，新的assistant回复只引用最近问题，不串上一次旧输出。历史消息仍保留是正常会话，不是新回答混入旧文本。

### 2. 可见累计流式

business发送较长的RSS问题，首段出现后文字逐段变长；后段包含前段前缀，结束提示明确没有检索实时新闻。UI与数据结构都是真assistant-ui，但内容不是AI。在本地会话切换层级，key=level创建新runtime，旧问题不进入新会话。

### 3. 停止、重新提问与卸载

advanced发送长问题，首段出现时点击停止响应。按钮调用真实aui.thread.cancelRun，runtime AbortSignal转发到本次local controller，当前sleep立即清timer/解绑listener并reject；生成器只吞已取消错误，不再yield，现有部分文本可保留。等待超过450ms仍不增长，再提问启动独立回答。

切层或停止卸载时组件cleanup调用session.abortAll，取消自己拥有的controllers；不是只靠组件消失推断任务清理。每次run的finally移除runtime signal转发监听并从active集合删除。正常sleep到期也移除abort监听。abortAll不永久禁用会话，StrictMode清理后可重新run；不会取消其它实例或全局timer。它只取消本地等待，没有远端请求，更没有停止模型计费的承诺。

## 完整迁入

已有React/TSX应用执行`pnpm add @assistant-ui/react@0.15.21`。复制example.tsx、local-adapter.mjs/.d.mts、reply-policy.mjs/.d.mts，保持相对路径；demo.tsx只Lab重导出可省。渲染`<AssistantUiExample level="advanced" />`，也支持basic/business。需要React DOM、ESM/TS bundler解析、AbortController/AbortSignal/DOMException与timer；无需Provider外置配置（组件已提供）、环境变量、CSS插件、模型账号或网络服务，布局为内联样式。

生产替换adapter时保留abort转发/finally和累计内容协议，服务端负责授权、超时、请求所有权、幂等、日志脱敏与持久化，不能从这个fixture推出真实服务取消保证。消息Markdown另接安全渲染器；这里不innerHTML。用户文本160码点是回复摘要边界，不是Composer输入/API安全限额；没有长文性能数字、工具确认、云线程或跨设备恢复。

## 官方来源与验证分层

固定@assistant-ui/react@0.15.21提交的packages/react/README.md在git中是指向../../README.md的symlink，因此保存同commit根README.md实际原字节而非15字节路径文本。固定树无官方中文README，保留英文en。官方文档实际curl GET200的CSP frame-ancestors self禁止当前跨源Lab嵌入，状态blocked保留直达；第一次urllib403作为取证经过保留。来源、原文SHA、package/license和响应头见official。

Node7项只运行自建reply/adapter/sleep策略，不运行assistant-ui SDK，不将async generator PASS写成LocalRuntime PASS。真实Hook/Provider/primitives/取消必须由browser提案执行；提案观察首段与累计、停止后超等待稳定、新提问、真实外层450ms timer与AbortController计数、切层/卸载清理，受控浏览器时钟防止人为点击延迟抢跑。真实IME候选与读屏仍人工NOT_RUN。命令/原始日志和六项状态见local-validation.md，formal verification保持NOT_RUN。
