# tailwind-merge：为可覆盖组件正确合并 Tailwind 工具类

> C21 · 示例固定 `tailwind-merge@3.7.0`、`clsx@2.1.1`，与 ReactLoom 的 Tailwind CSS v4 工具链对齐。MIT，真实 SDK、打包和浏览器验证待执行。

## 推荐与不推荐

当通用组件暴露 `className` 允许调用方覆写内边距、颜色等 Tailwind 类时，`twMerge` 可以删除已被后继类完整覆盖的冲突分组。它不是 CSS 编译器、HTML 净化工具，也不能凭空生成不存在的 Tailwind token。

仅拼接类名可用 C20 clsx；纯 CSS Modules、不允许外部覆盖或固定样式的场景无需额外依赖。

## 安装与引入

```bash
pnpm add tailwind-merge@3.7.0 clsx@2.1.1
```

```tsx
import clsx from 'clsx';
import {twMerge} from 'tailwind-merge';
const cn = (...values: Parameters<typeof clsx>) => twMerge(clsx(...values));
const card = cn('p-2 rounded', active && 'p-4');
```

完整运行与展示源码均来自 `examples/example.tsx`，`examples/demo.tsx` 是 Lab 适配导出。安装命令中的两包都在此业务组合中被实际 import。

## 三层任务

### 入门：拼接与冲突的区别

编辑 base 和 override 的输入。对比 `twJoin('px-3 pr-4','pr-8')` 与 `twMerge(...)`。后者知道 `pr` 分组冲突，只保留最终右内边距。注意 `twJoin` 不接受 clsx 式的对象映射。

### 业务：可覆盖的卡片组件

状态组合由 clsx 执行，Tailwind 冲突解析由 twMerge 执行。示例展示真实 `className` 输出，允许调整紧凑/舒适密度与已选中状态。公开 className 本身是组件 API：调用方可改变布局，产品侧应声明哪些覆盖被允许。

### 进阶：非对称覆盖和 modifier

`twMerge('pr-4', 'px-3')` 应只保留 `px-3`，因为后者已覆盖水平两侧。

`twMerge('px-3', 'pr-4')` 应保留两个类，因为前者的左侧仍有效。这不是简单“从左到右删除相似字符串”，冲突关系具有方向性。响应式 `md:p-2` 与普通 `p-4` 属于不同 modifier，上下文不同不能混合删除。

## 生产最佳实践

- 把 `cn` 放在组件库可复用工具模块级，没必要每次 render 创建合并器配置。
- `tailwind-merge` 的配置与 Tailwind 构建配置不是自动同步的；自定义 token 需要显式 `extendTailwindMerge` 并写回归用例。
- CSS 规则是否真的存在由 Tailwind 编译器决定；`twMerge` 只能处理字符串上的冲突语义。
- 服务端传来的任意类名不应直接注入 UI 皮肤；`twMerge` 不负责过滤恶意业务配置。
- 组合 `clsx + twMerge` 和仅用 `twJoin` 不是等价替换，后者既不处理冲突也不支持对象条件。
- Tailwind v3 项目不要直接安装 v3 的 tailwind-merge；按官方支持矩阵选择对应大版本。

## 反模式与可复现实例

1. 用 `Set(classes.split(' '))` 去重：`px-3` 与 `pr-4` 不相等却存在方向性的冲突。
2. 认为后面任何包含 `p` 的类都会删除所有 padding 类：会误删仍生效的一侧。
3. 每个渲染周期构造 `extendTailwindMerge`：缓存和配置反复创建，开销不必要。
4. 用合并字符串的结果断言实际 CSS 优先级：最终视觉还受生成的样式、层、specificity 影响。
5. 对业务开放任意 `className` 却没有覆盖策略：无意中使布局、隐藏甚至可访问性不可控。

## 相关库和迁移练习

C20 clsx 是互补组合，B09 shadcn/ui 的常见组件风格可用该模式（不是必须依赖）。练习：将 NewsHub 卡片组件的默认/选中/警告覆盖分开声明，针对 px/pr、hover、responsive 做真实用例；在 Tailwind 更换版本时重新校验规则。

## 验证状态

示例代码采用真实导入 `twMerge`、`twJoin`，但当前还未安装/运行新目标包。SDK、typecheck、build、浏览器保持 NOT_RUN，不能引用其他环境旧研究的 PASS。参见 `verification.json`。

## 官方资料

- [官方仓库](https://github.com/dcastil/tailwind-merge)
- [API reference](https://github.com/dcastil/tailwind-merge/blob/main/docs/api-reference.md)
- [适用与限制](https://github.com/dcastil/tailwind-merge/blob/main/docs/when-and-how-to-use-it.md)
