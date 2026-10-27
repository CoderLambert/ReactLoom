# FullCalendar v7：业务排程与 DST 语义

## 选择条件
适合编辑事件、月/周/列表视图及时间交互，React 本身仍是事件事实源。简单日期选择不需要全量日历。Premium resource timeline 属于付费功能，本示例只使用开源标准插件。

## v7 安装与导入
依赖基线 @fullcalendar/react 7.1.3 + temporal-polyfill 1.0.4。安装：

    pnpm add @fullcalendar/react@7.1.3 temporal-polyfill@1.0.4

**重要：v7 插件来自 @fullcalendar/react/daygrid、/timegrid、/interaction、/list 等子路径，不要复制 v6 需要单独装 @fullcalendar/daygrid 的旧示例。**

## v7 CSS 必需项
主题不再自动注入。examples/example.tsx 明确导入 skeleton.css、classic/theme.css、classic/palette.css，plugins 同时注册 classicTheme。缺少 CSS 的空白/错乱布局不能被当成渲染性能问题。

## 入门层
通过 dayGridPlugin 显示月视图与固定事件；initialDate 固定成研究场景日，避免演示随当前月份变化。保持插件数组与事件列表稳定，不要在每次 render 创建 plugin 对象。

## 业务层
将内容排期视为具有唯一 id、时区、开始/结束与版本的领域事件，React 更新内存状态后控制日历刷新。用户创建全天事件使用 YYYY-MM-DD；全天结束日期为排他语义，不要做错一天。生产请求需鉴权、检查 revision/ETag，再持久化；本 Demo 没有请求真实 API。

## 边界层
2026-11-01 美国纽约 DST 回拨，01:30 同时对应 05:30Z 和 06:30Z。保存 UTC instant + IANA zone，而非不带 offset 的当地字符串；需要业务上明确处理 gap/fold。拖拽冲突示例调用 info.revert()，仅本地模拟 409，不证明真实服务器的冲突机制。

## 反例
1. v6/v7 交叉安装插件和 CSS：入口变动导致构建或主题错误。
2. 只存用户可读 01:30 而不存时区/offset：DST 回拨产生两个不同事件。
3. 拖拽先改 UI 后忽略服务端 409：应回滚或提示刷新，再基于 revision 编辑。
4. 把 calendar DOM 直接当可编辑键盘表单：提供等价语义列表和编辑替代通道。

## 性能/许可/验证
大量事件应按可见日期范围加载并取消旧请求；键盘拖拽与读屏、跨月视图/scroll、StrictMode 二次挂载必须由真实浏览器验证。资源时间线及收费扩展不在社区示例范围。当前静态接入不代表 SDK 或生产构建 PASS。

## 官方资料
https://fullcalendar.io/docs/react
https://fullcalendar.io/docs/upgrading-from-v6-js
