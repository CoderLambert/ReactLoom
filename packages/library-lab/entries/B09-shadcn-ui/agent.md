# B09 shadcn/ui 工程复用指南

适用于愿意拥有和维护组件源码的 React 团队。运行时从应用自己的 Button 文件导入；CLI / Registry 是分发工具。本条目 `examples/ui/button.tsx` 是原创教学实现，未执行 CLI，不作为官方 Registry 原文字节使用。

## 读取与迁移

先读 library.json、guide.md、实际 button.tsx、example.tsx、archive-policy.ts 与 verification.json。核心依赖是 CVA 0.7.1、Radix Slot 1.5.0、clsx 2.1.1、tailwind-merge 3.7.0。基础接入复制 Button，完整实验复制 example / archive-policy / workshop.css，保留相对目录；React 19 + Tailwind v4 扫描组件源码。CSS 内 revert-layer 是 Lab 宿主适配，目标只有 preflight 时可去掉。

CVA 选变体与尺寸，cn=twMerge(clsx())，调用方覆盖在后。保留明确 type=button 默认值和原生 disabled。asChild 只接一个传递 props/ref 的元素；链接仍有原生导航语义，aria-disabled 不会拦截导航。本例无权限时改为无href的span，不把 disabled 传给a冒充禁用。

## 三个目标与断言

- basic：改variant/size，勾选px-8覆盖后实际class有px-8、无原px-3；预览DOM与输出对应。Enter/Space激活原生按钮增加计数，disabled不激活，键盘焦点环可见。
- business：未归档ID快照→250ms本地fixture→成功或失败。失败保留文章/选择、解除busy；关闭失败开关后重试成功。取消保留状态，恢复示例回初始；旧epoch的回调不回写，卸载清自己的timer。生产接入需另接AbortSignal、后端幂等和权限。
- advanced：Slot输出唯一a，无嵌套button，Tab/Enter保留导航；无权限改为无href的aria-disabled span，不进Tab；原生disabled按钮独立验证。

## 上游与更新

官方资料固定 `8ab27715521cbd4f87ae6886cd989cbb678f6de7`，CLI package README 对应4.23.0，仅是资料快照。固定上游Button用radix-ui/cn包、6变体/8尺寸；本例用单包Slot/本地cn、4变体/3尺寸、原创配色和明确type默认值。不要据此推断全部Registry或未来默认基座；升级时按来源/依赖/语义/样式逐份diff，保留本地定制。

Node SDK suite真实执行经过内存语法转换的当前Button及其npm依赖，不能当CLI执行或浏览器证明；archive-policy是纯业务策略。typecheck、原文hash和局部日志见local-validation，正式sdk/build/browser以verification及匹配收据为准。
