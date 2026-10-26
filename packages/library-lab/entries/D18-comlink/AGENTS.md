# D18 Comlink 目录规则

先读上级AGENTS.md，使用真实 Worker/Comlink SDK，禁止在主线程返回预设结果冒充 Worker；示例源码为 examples/worker.ts + example.tsx。退出时 releaseProxy/terminate，异步回写用epoch防护。未实际运行 Node/浏览器时 verification 保持 NOT_RUN；公共 Worker runner/CSP改动交给PLATFORM。
