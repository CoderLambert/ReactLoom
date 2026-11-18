# E12 assistant-ui 工程复用

真实@assistant-ui/react0.15.21 MIT（安装/固定package字段），useLocalRuntime+Provider+Thread/Message/Composer primitives。没有模型/API/secret，模板只引用最近user text；tool/assistant不读，160码点摘要，yield累计全文不是delta。

安装本包后复制example.tsx、local-adapter.mjs/.d.mts、reply-policy.mjs/.d.mts，TS bundler/ReactDOM/AbortController/DOMException/timer前提，无env/CSS插件/账号服务；demo仅适配。Composer submitMode=none显式按钮发送，IME人工未验。MessagePrimitive.Error展示/error本地失败，后续普通问题可恢复。

local-adapter是真正UI生成器：每run拥有controller，转发SDK abortSignal，sleep正常/取消都解绑listener，取消清timer；finally解除转发并移出active。只吞local.signal.aborted错误，其他抛给runtime。session.abortAll由effect cleanup调用，清自有等待，StrictMode可重新run，不清全局timer。停止按钮真实cancelRun，仅isRunning且capabilities.cancel可用。key=level换会话，不把DOM消失当清理证据。

basic完整yield；business24码点/220ms；advanced18码点/450ms。不是模型token速率。已显示部分可保留，取消后不再yield，新回复只取最近问题；历史保留不等于串输出。生产传输需另管权限/持久化/所有权，不读工具秘密、不innerHTML、不双写进行中消息。

Node 7 项验证应用策略，真实 SDK Runtime 在 Chromium 验证，详见 local-validation.md。浏览器受控时钟与外层timer/abort观察证明停止/卸载/换层cleanup，最后yield稳定等待超过delay。无正式收据verification保持NOT_RUN。固定package README为symlink，实际保存根README原字节；官方文档CSP只self，blocked直达。
