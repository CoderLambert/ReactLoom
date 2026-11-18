# F11 MSW 维护约束

保持真实msw3.0.3接口与canonical handlers/routes，运行配方和源码展示共用原件。公共src/scripts/runners、Service Worker资产、依赖锁与生成索引由主控拥有；只在当前授权范围写入本条目。

当前浏览器面板使用runners/msw/main.mjs的独立origin与UUID会话scope，prepare/server资产检查已经接线；旧“当前仍BLOCKED”是历史事实，不再沿用。examples/browser-worker.mjs是未被当前UI导入的固定scope参考，当前server不供应它的固定脚本路径。

修改该历史adapter时仍保留：第一次await之前同步取得session gate；创建MSW之前真正调用worker-script-preflight的受限流式fetch；stop并发共享Promise，失败不释放lease；精确scope/script校验，不注销别人的registration。安全策略不能通过静态URL字符串或假Response冒充真正注册/控制页面。

只有有效ACK确认当前会话清理；不全局清Service Worker或存储，不提升为整站scope。原始SDK执行、纯策略、真实浏览器与正式收据分别记录，未运行保持NOT_RUN。
