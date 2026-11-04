# IMask / react-imask 7.6.1 — 输入格式、光标与 IME

## 产品使用场景
企业录入编号、日期、金额及电话号码时，输入掩码可帮助用户遵循显示规则。但它**只控制字符编辑**，无法证明日期真实存在、金额精度符合会计规则或电话号码可用。这个区分决定如何设计业务表单和后端验证。

## 安装与真实示例
```bash
pnpm add react-imask@7.6.1 imask@7.6.1
```
真实可交互的 React 入口：`examples/example.tsx`，Lab 适配：`examples/demo.tsx`。独立 Node SDK 测试在 `tests/sdk.test.mjs`，测试目标是底层 imask 库而不是模拟版本。

## 三层练习
**入门**：八位编号 `0000-0000`，输入时观察格式与 unmaskedValue 的不同，点击重置只作用于当前示例。
**业务**：Number mask 的 radix、scale、千位分隔符，通过 onAccept 读取取消格式后的值；与 D05 decimal.js 比较，注意显示小数不等于算术精度。
**边界**：`0000-00-00` 可接受格式正确却不存在的日期，须在提交前做日历语义校验。旁边的中文备注使用普通 input，不把数字掩码错误用于 IME 自由文本。

## API 与所有权
`IMaskInput` 提供 `mask`、`unmask`、`onAccept`，官方明确**不要依赖原生 onChange 获取掩码值**。`unmask=true` 时 onAccept 传入去格式后的字符串；Number mask 可设置 radix 和 scale。组件销毁后应释放插件持有的 DOM 处理，而不能在 React 外重复手动绑定新 mask。需要更复杂 DOM 集成时使用核心 `IMask.createMask` 或 `IMask(element,opts)` 并显式 destroy。

7.6.1 的 Number mask 会规范化 `unmaskedValue`，因此 `1234.50` 对应字符串 `1234.5`；`scale:2` 限制最多两位小数，不保证保留尾零。需要固定两位的显示时可设置 `padFractionalZeros:true`，此时显示值可以是 `1,234.50`，取消格式后的值仍为 `1234.5`。原始小数位数或财务计算精度必须由业务合同另行管理。

## 五个容易遗漏的实际问题
1. 在 React 里同时对 `value` 和掩码实例分别赋值，会导致回写环和光标跳动。单一 owner，只有 onAccept 进入表单状态。
2. 把掩码结果当数据库数据。保存规范化 DTO，展示格式独立处理；服务端再次校验。
3. “02-30”一类日期通过字符形状，却不是合法日历日期。需要更高层日期校验。
4. 中文输入法 composition 阶段自动触发提交或对备注应用数字掩码。IME 事件期间不应提交，也不要给自由文本强加格式。
5. 用 Number 掩码输出直接相加，浮点误差造成金额异常；引入十进制精度策略。

## 性能、无障碍、维护
对表单局部实例按需使用，别为整个应用每个 input 默认安装掩码。保留原生 label、required、错误文本和键盘操作；placeholder 不是标签。重置应清空当前实例，不要操作其它输入框或全局存储。当前上游发行节奏较慢，依赖维护状态需定期复核，不自动升级未验证版本。

## 推荐组合与对照
C01 React Hook Form：用 Controller 接受 onAccept，而非 register 直接监听 onChange；C14 date-fns：业务日期；D05 decimal.js：十进制计算。与 Zod/Valibot 的关系是后者负责 schema 验证而不是输入时格式。

## 验收与限制
真实 SDK `tests/sdk.test.mjs` 验证核心 createMask；浏览器须额外验证 onAccept、光标与中文候选词行为。尚未有真实包安装和浏览器日志，不得将代码提交视为 PASS。

## 官方
- https://imask.js.org/api/modules/react_imask.html
- https://imask.js.org/guide.html
- https://github.com/uNmAnNeR/imaskjs
许可 MIT。

## 日历边界专项：年份 0001–0099、世纪闰年与 DST

示例将真实运行的日期规则独立为 `examples/calendar-policy.mjs`，通过 `setUTCFullYear` 按日历年月日比较。不能直接使用 `Date.UTC(year, ...)`：JS 会将 0–99 年重新映射为 1900–1999，导致 `0096-02-29` 等有效日期被误判。业务明确禁止 `0000` 年；`1900-02-29` 不存在，`2000-02-29` 存在。这里验证 calendar date，而不是用户所在时区的 instant：纽约 DST 切换日期依然是合法日历日期，不能据此计算 UTC 偏移。Node 纯规则验证：`node --test packages/library-lab/entries/C06-imask/tests/calendar-policy.test.mjs`；`imask`/`react-imask` SDK、光标与 IME 仍需实测。
