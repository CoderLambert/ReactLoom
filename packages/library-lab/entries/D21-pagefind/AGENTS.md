# D21 Pagefind 条目

遵循上级 AGENTS.md 和 CD 路径所有权。仅使用原创公开内容 fixture；构建索引不得读取真实私密文档或凭据。任何 pages/meta/filters 必须经目标应用权限审查，Pagefind 静态索引不提供访问控制。仅在独立 Node 临时目录生成并删除示例构建文件；不能让页面执行 Shell。SDK/构建/Browser 分维记录证据，不得伪造 PASS。

getFiles/writeFiles是两次独立生成，带hash文件名可能不同；分别记录内存与实际磁盘产物，不能硬配成同一批字节。产物摘要须由实际读盘获得。保留仅本次scratch清理和进程级close所有权；keepOutput仅允许成功后留存。Node-only浏览器测试只验命令和官方资料，不新增search宿主或声称search已运行。内容/执行证据维护在local-validation.md。
