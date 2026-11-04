# C09 React Virtuoso · Agent 实战指南

## 选择它的前提

React 业务拥有需要窗口化的变高列表。小数据无需虚拟化；复杂自定义多轴布局先比较 C10 TanStack Virtual。固定版本基线 react-virtuoso@4.18.19（MIT），自行核对目标仓库 React peer、浏览器布局条件和锁文件。

## 最小迁移源码

读取 examples/example.tsx 中 Basic、Business 或 Advanced；examples/demo.tsx 只是 Lab 入口。复制当前项目所需的业务数据类型和 Virtuoso 组件，不复制整个实验室布局。容器必须有高度，itemContent 只输出内容、不访问网络，computeItemKey 返回稳定业务 ID。

## 严禁删除的行为约束

- 加载下一段要有 pending ref + hasMore + 旧响应 epoch 防护；endReached 可能重复触发。
- 切换筛选或身份时重置旧滚动快照，并取消旧请求。
- prepend 历史记录时一次性更新 data 和 firstItemIndex。
- 动态高度让库测量，控制子项 margin；不把固定高度误用于翻译后文字。
- 用户读历史时不强制跳到底部，注意键盘 focus 与屏幕阅读器可访问的替代分页。
- 卸载时取消定时器、fetch 和订阅；不要全局 clear storage。

## 目标项目验证

至少验证：不同高度项目滚动、稳定 key、搜索后不展示旧结果、分页不重复、中文 IME、首尾跳转、前插锚定、展开内容、离开页面后不回写、移动端/无障碍。针对 SDK 的真实浏览器 E2E 不可用假窗口测量冒充。源代码改动后通过平台 sourceFingerprint 重新判定已有 PASS 证据。

官方：https://virtuoso.dev/react-virtuoso/ 。当前 SDK/build/browser NOT_RUN。

## 新增迁移检查：重复提交的窗口复位

不仅换关键词需要取消旧页和重置窗口，同一关键词重新执行搜索也要复位。复制 `examples/view-policy.mjs` 和 `.d.mts`；在实际 Business 中使用独立 `viewRevision` 作为 Virtuoso key，避免以 query 文本作为唯一 session ID。运行 `node --test tests/view-policy.test.mjs` 只能证明无 SDK 的游标策略；浏览器中必须真的滚到底、重复搜索、检查回到头部且旧延迟页不能追加。
