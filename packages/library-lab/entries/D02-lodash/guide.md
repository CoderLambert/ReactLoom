# Lodash/lodash-es 4.18.1 — 组合工具函数与边界

## 适合的工作
从新闻聚合数据中去重、排序、分组、分批，或防抖用户输入。Lodash 提供成熟行为，省去自己实现复杂边界；但原生 `Array.prototype` 已覆盖许多基本任务，不应为简单 `map/filter` 额外拉入工具库。此条目统一讨论 **CommonJS 的 lodash** 和 **ES Modules 的 lodash-es**，示例采用后者。

## 安装 / 模块方式
```bash
pnpm add lodash-es@4.18.1
pnpm add -D @types/lodash-es@4.17.12
```
```ts
import {uniqBy, groupBy, orderBy, chunk, debounce} from 'lodash-es';
```
不要假设 `lodash` 和 `lodash-es` 在 CommonJS/ESM 运行时与类型声明上可直接互换。本仓库只装 `lodash-es`，主站不导入 `lodash` 整包。唯一实际源码 `examples/example.tsx`，`demo.tsx` 仅转发。

## 三层实际演练
**入门：**重复 RSS item id，`uniqBy(feeds, 'id')` 保留**第一条**，并由 `chunk(...,3)` 显示批次长度；不能误称保留最新/最高分。**业务：**先去重，再 `groupBy` 分类别，`orderBy` 按 score 降序、id 升序，重复业务 ID 不重复显示。**进阶：**通过 `debounce(fn,250)` 实际延迟输入筛选、`flush` 立即执行、`cancel` 取消待执行回调，并在卸载时清理。

## 核心机制
去重依赖**业务主键**：真实系统不能用可变标题当唯一 ID；需要按更新时间选取记录时，应在去重前排序或使用显式冲突解决。分组返回字典，不自动产生已排序的分组；对用户权限过滤必须**先过滤再排序/截断**。防抖等待是本地 UI 优化，不会自动 abort 已开始的网络请求，不等同于节流和速率限制。

## 应避免的反例
1. **仅调用 uniqBy 就期待最新**：它保留最早出现的条目；实际要先定义保留策略。
2. **sortBy 后希望倒序**：用 `orderBy(...,['score'],['desc'])` 并明确 tie-break，不能靠输入偶然顺序。
3. **React 每次 render 都创建 debounce**：回调计时器不稳定，卸载会留下写状态的旧回调；使用 useMemo+effect cleanup。
4. **搜索使用 debounce 代替 IME 处理**：中文组合输入的行为需要专门验证，不能让未提交的组合态直接请求远端。
5. **盲目导入 lodash 全部 API**：观察 bundler 最终包和 side effects；tree-shaking 由构建器决定，不凭 package 名声称具体体积。

## 组合与替代
与 D01 es-toolkit 比较兼容 API、类型体验、实际构建体积；与 D19 Fuse.js 组合时，先限定数据范围再做模糊匹配。与 D03 p-limit 配合批处理时，chunk 只是划分输入，真正并发控制仍由 limiter 管理。建议先按项目实际需求使用原生方法，再引入高价值函数。

## 验收
Node SDK 测试直接导入 `lodash-es`，验证首次去重、组内排序、debounce flush/cancel。浏览器还需验证 IME、离开 Tab 清理和异步请求取消；Node 测试不证明这些。未实测标 NOT_RUN。

## 官方一手资料
- [Lodash 官网与 API](https://lodash.com/docs/4.17.15)
- [lodash-es npm 版本与许可](https://www.npmjs.com/package/lodash-es)
- [Lodash 代码仓库](https://github.com/lodash/lodash)

MIT。
