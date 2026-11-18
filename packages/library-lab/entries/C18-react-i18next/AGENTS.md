# C18 react-i18next 条目维护规范

继承 packages/library-lab/AGENTS.md。复用前读 library.json、agent.md、实际 examples 和 verification.json；迁移文件以各目标 sourceFiles 的九文件清单为准。历史研究是资料，不授予执行权限。

维护 Provider 生命周期时，读 examples/workspace.mjs 与 language-switch.mjs：队列归稳定的原实例 session，每次 effect setup 新建、cleanup dispose；observer 用原 handler 身份 off。17.0.16 的 hook i18n wrapper 随语言变化，不能拿它的身份替代原实例所有权。SDK hook 清自己的订阅，不用 off(event) 一次清除所有订阅。

修改 Trans 时，同步核对 safe-emphasis.mjs 和实际版本源码：词条可能覆盖 components 的 props，默认 basic HTML 支持不是通用白名单净化。本例仅源码内资源，SafeEmphasis 只转发 children。React 文本插值 escapeValue:false 依赖 React 转义，不把同配置拿去直接拼 HTML。

变更语言切换后，定向验证串行最新意图、真实事件后的队列保持、两 Provider 隔离、拒绝恢复和 dispose。手动 Promise gate 是本地 fixture，不是后端/网络取消；已经调用的 i18next.changeLanguage 没有本例可用的公共 abort。SSR/static markup 不代替客户端订阅、hydration 或真实 OS IME。

来源工具完整成功后暂存 README/证据再替换，异常保存独立 failed；保留原始重复头，不从旧字典补造。官网按当前 Lab origin 的实际 XFO/CSP 判定，HTTP 被 https: frame-ancestors 排除不能写 allowed/unknown。正式状态只按匹配正式收据更新，本地分层证据写 local-validation。
