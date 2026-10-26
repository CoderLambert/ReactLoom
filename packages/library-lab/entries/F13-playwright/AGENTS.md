# F13 Playwright 指导

独立node-ci教学样例。不要改主Playwright配置/CI，真实浏览器由平台统一安装。只通过已注册node-ci协议展示复现命令，绝不能创建执行用户输入shell的宿主。所有网络为静态拦截模拟，不能声称已调用生产API；校验fingerprint与真实日志后才能写PASS。
