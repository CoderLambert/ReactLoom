# F13 独立试用

依据目录身份、agent 的固定版本及五文件声明，把实际 config、fixture、三个 spec 复制到新临时目录。Playwright 版本为 1.64.0，用声明的独立配置运行新 consumer。采用已有本地依赖，通过 Lab 的 pnpm 选择固定 CLI。

新用例向订阅夹具输入 `orion+new@example.invalid`，真实 Chromium 操作表单，`page.route` 确认完整编码值并返回受控 201，页面显示 `订阅成功`，按钮恢复可操作。1 条通过，exit 0。业务 JSON 是 mock，SDK 是实际 Playwright。未重复作者 10 条矩阵。首个 harness 在 node_modules 内误触全局 1.65 和 Node TS stripping 限制，失败日志保留。改为独立临时目录并由 Lab 解析本地 CLI 后通过。原始证据及可复现脚本在 candidate-37 的 f13-independent*.txt 与 f13-consumer.sh。

五文件合同、隔离 config、浏览器安装、输入输出及阻塞写法一致。旧请求夹具的屏障在 finally 释放。源码验证不把路由拦截冒称生产请求或服务端取消。官网及固定 README 状态作为面板另外验证，原字节见作者记录。正式收据 NOT_RUN。
