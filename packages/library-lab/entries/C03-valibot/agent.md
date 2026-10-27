# C03 Valibot — 面向工程 Agent 的实施手册

**适用任务**：未知 JSON→可信 DTO、RSS/OPML 输入检验、表单跨字段错误及较小体积的可组合 Schema。
**不适用**：代替后端授权、SSRF 防护、HTTP 重试、可信度评分或通过字符串验证推断目标资源安全。

## 最小迁移路径
读取 `examples/example.tsx` 中的 `FeedSchema` / `BatchSchema` / `WindowSchema` 以及测试 `tests/sdk.test.mjs`。安装 `valibot@1.4.2`。移植 schema 与 safeParse 逻辑，移除 Lab 演示 UI；不要复制 `examples/demo.tsx` 的导出包装。目标项目不同依赖版本需重新核对 API。

## 不可省略
1. 用户与网络 JSON 为 unknown；成功后读 output 而不是输入原对象。
2. 非法输入统一反馈 issues，不因 parseError 使整个页面崩溃。
3. Schema/URL/日期/业务权限分别验证；后端重新校验，拒绝内网请求不由 Valibot 解决。
4. partialCheck 与 forward 用于对具体字段定位跨字段问题；字段未合法之前不推断业务真假。
5. 不把原始敏感 payload 持久化到日志或错误监控。

## Agent 应检查的反例
`as DTO` 伪安全、仅使用 `v.url()` 却要求 HTTPS、非法日期靠字典序比较、所有错误只能显示在根部、前端输入 Schema 直接当后端鉴权依据。

## 最低回归断言
成功解析后输出字段被限制；缺少字段/非法 URL 返回 issues；起止日期逆序定位到 end；错误 JSON 的异常能回到表单，而非未捕获异常；目标浏览器真实交互测键盘与可访问性。

## 验证入口与可信度
`node --test packages/library-lab/entries/C03-valibot/tests/sdk.test.mjs` 要求真实 SDK。生产 `typecheck`、`build` 和浏览器回归由 PLATFORM 统一执行。记录成功证据和 sourceFingerprint 之前不能标 PASS。目前均为 NOT_RUN。参考官方 https://valibot.dev/ 。

## 迁移注意

连同实际 schema 复制同目录的 `boundary-policy.mjs` 与 `.d.mts`，否则丢失无凭据 HTTPS 与真实民用日约束。不要使用 Date.UTC 自动进位证明字符串日期存在。编辑后清除旧结果；官方 SDK、TypeScript、浏览器仍独立验收。
