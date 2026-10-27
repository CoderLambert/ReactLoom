# C05 Ajv

维护前阅读上级 AGENTS.md、library.json、agent.md 和 verification.json。Schema 必须受信任；勿用禁用 strict/关闭 CSP 来掩盖兼容问题。源文件变动后 SDK/Browser PASS 必须重新校验。

变更 RSS 输入合同时保持 schema、rss-policy、同源源码视图、SDK 与纯策略测试一致；绝不因 uniqueItems 或前缀匹配便声称 URL 安全。
