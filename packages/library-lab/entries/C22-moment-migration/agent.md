# C22 Moment → 现代日期工具：Agent 实施手册

## 任务定位与边界

识别 Moment 旧代码并按语义迁移，不是替旧项目添加一个新的 Moment 包。当前 Lab 使用 date-fns 4.4.0、@date-fns/tz 1.5.0、Day.js 1.11.23；实际 Node SDK、TypeScript、浏览器仍是 NOT_RUN。明确区分“日期（日历字段）”“时间点（UTC instant）”“本地墙上时间 + IANA 时区”。

## 选型判断

- 函数式、静态 Tree Shaking 和纯日期计算：优先 C14 date-fns。
- 旧项目大量 Moment 风格链式 API，易于人工比对：C15 Day.js，但插件、strict parsing、mutability 与 locale 必须审查。
- 明确的 zone、Interval 和民用时间：C16 Luxon。不能把 Date.toString 当稳定业务协议。

## 迁移约束

1. 检索旧调用点的 `moment().add`、`startOf`、`utc`、`tz`、`format`、`isValid`、`diff`，逐个记录输入类型和现有时区。
2. **旧 Moment 可变**；新 Day.js 对象通常不可变，date-fns 函数返回新 Date。更新赋值/共享状态假设，不能机械替换方法名。
3. 格式化 token 有差异：Moment 的 `YYYY-DD` 与 date-fns 的 `yyyy-dd` 不等价；禁止批量字符串替换后跳过真实测试。
4. 服务端只用 ISO 8601 + 偏移或者 UTC instant 存具体时刻；日期字段按 `YYYY-MM-DD` 存民用日，不能无理由附加午夜 Z。
5. 不能通过 `new Date('2026-02-30')` 或宽松 parser 校验输入；严格按模式与实际日历值双重检查。
6. 跨 DST 添加一天，使用带时区的日历日操作，而非 86,400,000 ms；秋季回拨同一个 01:30 对应两个不同 instant。
7. 在 React 渲染里做稳定派生值；不要把可以直接计算的格式化结果塞入 Effect/state。

## 最小迁移文件

真实可执行文件：`examples/example.tsx`。宿主导出：`examples/demo.tsx`。不复制 Lab 导航和 CSS。依赖声明与官方来源见 `library.json`。迁移到其他项目时保留严格输入、明确时区与错误状态，验证目标项目运行时支持的 Intl 时区数据库。

## 必须测试

- 2026-02-30 无效，2026-02-28 有效；
- 同一 Instant 在 `America/New_York`、`Asia/Shanghai` 显示不同；
- 纽约 2026-03-07 中午跨到下一民用日是 23 小时；
- 纽约 2026-11-01 两个 01:30 instant 间隔 1 小时；
- 不继承旧对象的可变副作用；取消/刷新不会覆盖新输入。

## 运行与证据

`node --test packages/library-lab/entries/C22-moment-migration/tests/sdk.test.mjs`；随后 Lab typecheck/build 和 Playwright 验证。SDK test 运行前保持 NOT_RUN；没有安装 Moment 不代表丧失此迁移条目意义。上游参考 https://momentjs.com/docs/#/-project-status/。
