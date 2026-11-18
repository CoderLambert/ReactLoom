# D13 RTK Query 条目维护

遵守根/平台 AGENTS 与 CD 所有权。先读 library.json、agent.md、verification.json。维护同源 examples、指南、依赖声明与三层使用场景；目标 SDK 不可 Mock 后标 PASS，运行日志和源码指纹必须一致。不得写 root package、锁文件、CI 或主分支。

实际 API/store/可取消 fixture 在 examples/runtime.ts，Node SDK 测试必须导入这个源文件，不能另造 API 验证后宣称示例通过。保持 currentData 和参数 key，防止旧参数行显示。保留面板 mutation abort/epoch 与 runtime.clear/dispose 全部运行请求 abort + reset；只操作私有 store。诊断为真实 baseQuery 次数/查询键，不可写死。memory baseQuery 不是 HTTP 服务，tenant 参数不是授权。
