# C04 JSON Forms — Agent 工程指南

## 选择条件
字段由 schema 动态定义、需要统一 renderer/校验和多步骤表单时采用 JSON Forms；固定业务表单优先评估 C01 React Hook Form。目标 @jsonforms/* 为 3.8.0；必须核对目标项目 React 与 peerDependency。

## 文件迁移
阅读 examples/example.tsx 的 schema/uischema、onDataChange、toSubscriptionPayload、submit。examples/demo.tsx 仅为平台适配。将表单控件样式、数据契约与后端接口分离，不要复用演示 fixture 作生产服务端。

## 不可删除
1. schema、uischema、renderer 和 cells 的配套版本。
2. 隐藏字段的白名单数据映射与后端再校验。
3. onChange 初始触发处理、受控更新稳定性。
4. AbortController 和 generation 以及组件卸载清理。
5. 附加服务端错误映射与错误状态可访问性。

## 反模式与验收
禁止把 UI rule 当授权，禁止接收任意 schema 中的执行代码，禁止信任浏览器客户端校验，禁止旧异步写回。断言 required/conditional URL、manual payload 不含 url、duplicate→409 显示、取消后 UI 不回写；同目标 SDK browser/SSR 验证分开记录。

## 来源与状态
官方 https://jsonforms.io/docs/integrations/react/；当前仅提交真实包 import 的源码和定向测试，不代表 SDK/构建/Chromium PASS。优先查 verification.json 与运行时指纹。

## 新增迁移要点
必须一起复制 `examples/submission-policy.mjs`、`.d.mts` 与 React 示例。切换为 manual 后的旧 URL 不能作为客户端错误，也不能继续出现在 payload。对 /name 的409、/url 的422错误按 `additionalErrors` 回填。中文输入法选词期间不发起提交，编辑后旧请求无权回写。服务端不可信 URL 还需内网 SSRF 检查。
