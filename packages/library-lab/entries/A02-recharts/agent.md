# A02 Recharts — 工程手册

## 适用

中等规模、要跟 React 状态放在一起的 SVG 业务图。大屏多坐标系用 A01，密集时序用 A04，自定义几何用 A05。一个数字的迷你趋势不必引入本库。

## 版本

`recharts@3.10.1`（MIT）和 `react-is@19.3.0`。`react-is` 必须跟宿主 React 主版本一致。不要使用研究稿里的 19.2.8。v2 的内部状态 API 不能直接迁到 v3。

## 迁移

复制 `examples/example.tsx` 的容器尺寸、`ResponsiveContainer` 和图表结构，加上 `examples/chart-policy.ts` 的窗口收敛。`demo.tsx` 不要带到业务项目。数据换成已校验的行。若需要同步双图、Brush、null 缺口或请求取消，按 guide 第 4 节自己接上——当前 Lab 示例没有这些。

## 不可删的清理

父级保持非零高度和 `minWidth: 0`。隐藏 Tab 时卸载图表。刷新次数和窗口天数走纯函数，不要在 render 里随机。双轴的次数和百分比继续分 `yAxisId`。组件不要因为数据变化而更换 `key`。

## 反例

- `height: "100%"` 而父级高度不确定。
- 长度不同的序列用默认 `syncMethod="index"`。
- `reads ?? 0` 把缺失画成低谷。
- 切换筛选时不取消上一个请求。
- 只靠颜色，没有表。
- 自定义 tooltip 插入不可信 HTML。
- 把百万原始事件直接交给 SVG。

## 测试断言

- 3–14 天以外的窗口被收敛；刷新不超过 1000。
- 图表和表读同一数组；收藏率在 0–100 的右轴。
- 若实现了 `syncMethod="value"`：缺口两侧 tooltip 的日期相同。Brush 单独断言起止日期。
- 若实现了实时流：暂停和卸载后 interval 数量不增加；减少动态时动画关闭。
- 若实现了远程数据：旧请求不能写入新筛选。
- `chart-policy` 单测不是 SDK PASS，也不是浏览器尺寸证明。

## 真实限制

Lab 样例没有 null、没有 Brush、没有网络。`accessibilityLayer` 不是完整无障碍合格。SSR 要单独看容器尺寸。时区身份不要依赖 `Date` 的本地解析去当类目键。

## 证据

没有 `docs/library-lab/evidence/runs/` 的当前收据，不要把 sdk、build、browser 写成 PASS。仓库级 CI 不能抄到本条目。
