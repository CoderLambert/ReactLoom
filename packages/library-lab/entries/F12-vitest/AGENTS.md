# F12 Vitest 条目规则

先阅读上级 AGENTS、agent.md、library.json 和验证记录。node-ci 示例是真正可以经 Vitest CLI 运行的源码；不得伪装成浏览器在线 Shell，不能把业务 Response Mock 误称 HTTP 真连通。公共package/lock/CI由PLATFORM所有。
