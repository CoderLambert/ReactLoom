# B09 shadcn/ui — 组件源码归属与可维护的设计系统

## 不是一个普通npm运行时
shadcn/ui的主要交付方式是使用CLI从registry将UI组件**源码**安装到自己的项目，并不是把“shadcn/ui”当成一个通用React Button runtime来import。2026官方提供Base UI和Radix两种基础原语选择，本案例特意使用Radix Slot路径，便于对比现有B10 Base UI、B11 Radix Primitives。

**该页面真实运行的是本条目`examples/ui/button.tsx`，它是基于公开接口重新编写的组件，并非CLI原样生成的组件快照**。不可宣称官网所有样式、注册表更新和未来命令已由此一份实验覆盖。

## 从项目中正式安装
```bash
# 在自己的项目初始化shadcn registry配置（交互式，先确认设计系统和CSS变量）
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button
```
成功后根据components.json检查导入路径、基础原语选择、Tailwind配置。若只迁移此教学实现，显式安装：
```bash
pnpm add class-variance-authority@0.7.1 @radix-ui/react-slot@1.5.0 clsx@2.1.1 tailwind-merge@3.7.0
```
```tsx
import {Button} from './ui/button';
<Button variant="outline" type="button">保存</Button>;
```
这些依赖的确切版本由PLATFORM核实、生成锁文件后，才可标识构建通过。

## 三层业务示例
**basic**：CVA variant+size的真实Button，Radix Slot可选择渲染child；**business**：RSS多选操作，按钮正确继承disabled、aria及loading态；**advanced**：asChild的链接不会自动拥有原生button的disabled行为，展示带rel安全属性的官网链接和本地操作恢复，强调权限语义。

## 源码事实与生命周期
`examples/ui/button.tsx`维护`buttonVariants`和`cn`，项目可以按实际设计token修改这些源文件。`examples/example.tsx`是可交互使用例；`examples/demo.tsx`只是Lab的懒加载出口。不要为每个业务页面复制一份Button，需集中维护组件设计系统。示例业务的250ms延迟明确是本地数据演练，没有向服务端提交；生产代码应使用AbortSignal和正确错误回滚。

## 常见错误
1. 认为`shadcn/ui`是可直接import的React库：它是可复制源码的组件体系；应从本地`components/ui/button`引入。2. 替换类名后忘记变体、专用设计tokens，Tailwind JIT没有扫描源码时界面看似空白。3. 将`asChild`当成任意HTML标签替换，忽略子元素自身语义、focus、disabled。4. 不区分Radix和Base UI组件版本，混用不同Slot/trigger上下文。5. 组件更新后直接覆盖本地改造，未检查registry diff和回归。6. 纯样式disabled而没有真实disabled属性或onClick权限校验。

## 组合练习
将此原子Button接入React Hook Form提交状态，检查loading/重复提交/错误反馈；将CVA变体用于统一NewsHub管理员按钮，在少量组件文件集中维护变体，而非业务页面散落大量Tailwind字符串。

## 来源与许可
- [官方Button](https://ui.shadcn.com/docs/components/radix/button)
- [官方Vite安装](https://ui.shadcn.com/docs/installation/vite)
- [2026 Radix包迁移说明](https://ui.shadcn.com/docs/changelog/2026-02-radix-ui)

当前源码已编写但SDK/tsc/生产构建/浏览器均NOT_RUN。


## 归档事务快照与异步取消补丁（2026-10-27）
归档时提取仍待归档ID快照，期间禁用checkbox与提交，不依赖250ms后可变`selected`。重置、切换demo级别和卸载均递增operationEpoch并取消本地定时器；过期回调不得写回新场景。已归档ID不重复计算成功量；模拟延迟不是实际HTTP请求或持久化。`archive-policy.ts`提供规则测试，真实Slot/CVA和浏览器交互仍待验收。
