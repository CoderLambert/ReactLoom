# C06 IMask — Agent 最佳实践与迁移说明

用途：**限制输入形状，不是最终业务校验器**。依赖基线 react-imask/imask 7.6.1（MIT），目标组件需实测 React19 compatibility。原始研究可参考，但请以本目录真实示例和 official API 为准。

## 怎么迁移到项目
先读 `examples/example.tsx` 的 IMaskInput/onAccept/unmask 三种场景；如果使用 React Hook Form，控制权应归 Controller，表单提交保留字符串/规范化数值，而不是直接用浏览器的显示格式。只移植需要的 mask 配置与回调，不复制 Lab 视觉壳。

## 绝对不能省略
- onAccept 是掩码数据接口；onChange 不应作为 maskedValue 来源。
- number 格式不是 decimal 计算，日期格式不是日历合法性。
- 中文自由输入与 IME 候选阶段不得被数字掩码干扰。
- mask 切换避免多个组件控制同一个 DOM value；退出组件后释放资源。
- 外部服务返回值再次由 Schema（Zod/Valibot）校验。

## 不要照搬的模式
在普通文本字段添加 mask、用正则格式当提交结果、把 onAccept 接口的 value 当数值算金额、重置清空所有表单、用 onChange+onAccept 双向回写造成光标跳跃。

## 验证契约
Node: `node --test packages/library-lab/entries/C06-imask/tests/sdk.test.mjs` 真正调用 imask；浏览器需要测试真实 react-imask 回调、编辑中删改、焦点、IME、重置。未执行保持 NOT_RUN，不能拿静态源文件做验证证据。

官方 https://imask.js.org/api/modules/react_imask.html 。

## 特殊日期规则不可简化

复用 `examples/calendar-policy.mjs`，保留 0001–0099 年处理、闰年、`0000` 禁止和年月日精确往返；避免 `Date.UTC(0..99)` 世纪重映射。DST 不能用 calendar-only 校验判断具体本地时间是否存在。Node 领域测试只证明策略，不等于 `react-imask` 组件和浏览器已验收。
