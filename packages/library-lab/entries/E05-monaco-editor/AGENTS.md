# E05 Monaco 条目维护

继承本包 AGENTS.md。同步 library.json、guide.md、agent.md 与真实 examples；未经验证不得改 verification 状态。不要把官方旧 Worker 的代码或 VS Code 扩展全部引入 Lab；不要在应用根目录修改 Vite、package 或锁文件。这些统一交 PLATFORM。
## 第24轮清理所有权

`resource-cleanup.mjs` 是示例运行的真实回收代码，不得以仅供测试的伪清理器替换。所有初始化阶段写入owned资源记录，异常、卸载统一幂等释放；其中任一释放函数失败不得阻止后续model及Worker租约释放。Node单测不能升级SDK/browser状态。
