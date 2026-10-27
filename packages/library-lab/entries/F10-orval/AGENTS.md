# F10 Orval 条目维护

读取本目录library.json/agent.md/verification.json与上级AGENTS。仅操作本目录和EF progress；OpenAPI是原创安全fixture，禁止连接真实第三方生产API或执行远程schema。代码生成只到 examples/generated，禁止覆写其他源码。CLI真实运行前不标SDK PASS，Node >=22.18 是硬要求。

第20轮：Orval 生成之前清理仅当前项目的固定 targets；不得使用 `orval --clean` 删除其他项目，不能把旧 `.ts` 文件、伪输出或纯策略 Node 测试计为真实生成成功。每项运行两次比较 SHA-256；运行环境 Node >=22.18，必须真执行本包 pnpm Orval CLI 并单独做 tsc。
