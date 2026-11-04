# E19 ffmpeg.wasm Agent目录规则

先读上级AGENTS、library.json、agent.md和verification.json。禁止自动下载第三方WASM或擅自配置根级COOP/COEP，PLATFORM专属公共runner和依赖。真实Worker加载/资源释放需浏览器测试；不能填假PASS。

输出校验采用同源 `examples/wav-output-policy.mjs`；新增chunk解析测试仅为Node策略，不能让SDK/build/browser状态自动PASS。
