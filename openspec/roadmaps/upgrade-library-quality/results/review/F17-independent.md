# F17 独立试用

从 `find-library --id F17 --agent` 进入，按 `agent.md` 固定 axe-core 4.14.0，复制真实 example.tsx、audit-queue.mjs/.d.mts。新 `FeedFormAudit` consumer 挂载 business 场景，严格 `tsc` exit 0，完整命令和最小源码见 candidate-37/f17-consumer.sh、f17-independent.txt。

在实际生产预览独立操作三场景。缺陷版分别报告 `image-alt`、`label`、`image-alt + label + button-name`，修复均为 0。额外在容器外放入缺名按钮和缺 alt 图片，修复结果仍为 0。保留修复前 business 实际为 0 的日志及迹线。确认使用的实装 4.14.0 将 `non-empty-placeholder` 列为 label 规则的备选检查，移除缺陷态 placeholder 后实际命中。

另调真实 axe.run 并持有其已经返回的第一份结果，完成停止、重挂、请求第二次的操作。持有期间实际只有一次调用，释放后第二次真实运行并报告 3 项，旧结果未发布到新会话。引擎本身未被虚构，也没有声称物理取消。纯队列 4 项、浏览器 SDK 和正式收据分别记录。固定官方原字节及主页 CSP 阻止证据已核对，独立面板通过。正式验证仍 NOT_RUN。
