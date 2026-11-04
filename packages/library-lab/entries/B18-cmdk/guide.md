# B18 cmdk：命令菜单、输入法和焦点管理

## 使用范围

cmdk 是可组合、无内置设计风格的 React command menu，不是全局键盘管理服务、路由器、模糊搜索引擎或业务权限组件。适合操作数几十到数百的仪表盘命令面板，也可配合其他组件构建 combobox。

## 安装与真实引入

    pnpm add cmdk@1.1.1
    import {Command} from 'cmdk';

v1.1.1 版本包含输入法键盘修复；ReactLoom 使用 React 19，请通过真实 pnpm 解析其 peerDependencies 后再宣告兼容。

真实源码 examples/example.tsx 包含 Command.Input/Group/List/Item/Empty/Dialog，主站仅在用户启动时加载。

## 三层示例

**basic**：用内联 Command 选择三个阅读命令。默认过滤基于 Command.Item 的 value 和 keywords；Command.List 是 v1 必需父节点，缺失可能报错。

**business**：展示阅读、管理双分组；禁用删除所有订阅；描述、关键词与业务选择分离。不做远端请求或破坏性写操作。

**advanced**：局部 Ctrl/Cmd+K 打开 Command.Dialog，Escape 关闭。快捷键仅在示例挂载后监听；从文本输入框不抢夺快捷键；中文输入候选期间的 Enter 不误选择。

## 生产最佳实践

- 唯一键：每个 Command.Item 都有稳定的 key 和唯一 value；不要将多个命令映射为同一文本。
- 输入法：中文/日文候选状态必须考虑 nativeEvent.isComposing，keydown Enter 先完成输入法候选，再提交命令。
- 可访问性：Command.Dialog 的 label 必须清楚；选项禁用不仅靠颜色，还要使用 disabled；快捷键不能成为唯一入口。
- 生命周期：document 的 keydown 在 effect 安装，在 cleanup 移除；不要全站重复绑定多个热键，也别阻断用户在其他输入控件中的编辑。
- 筛选：内建筛选已覆盖小规模场景；若接入 Fuse.js 大数据自定义搜索，使用 shouldFilter=false，防止再次排序。
- 权限：Command.Item disabled 仅是 UI 提示，业务 API 端仍须验证授权；本演示不会删除真实数据。
- 样式：cmdk 通过 data-* 属性提供状态，CSS 必须局部作用于示例容器。全局 [cmdk-item] 选择器可能污染宿主应用。
- 长列表：cmdk 不是虚拟列表，海量命令需要服务端或索引过滤、虚拟化及焦点方案单独测试。

## 典型错误与修复

1. v1 Item 缺 Command.List：改为标准 Input → List → Group → Item 结构。
2. Item 的 value 重复或动态从 DOM 计算：提供稳定唯一值和 React key。
3. 在 IME composing 期间处理 Enter：使用组合事件与 isComposing 判断，避免误操作。
4. 全局 Ctrl+K 监听没有 cleanup：切换页面出现多个弹窗，须在 effect 清理。
5. 把 enabled=false 仅写成样式：必须将权限作为独立业务校验，Item 要 disabled。

## 与其他库组合

Floating UI 为锚点弹层定位，cmdk 负责命令语义/选择；两者不要同时做同一 Focus Trap。Fuse.js 可在大规模搜索前处理相关性，之后 cmdk 使用手动过滤；不要双重过滤造成键盘项顺序跳变。

## 练习与验证

练习 1：将工作台命令连接到受控路由动作，关闭后焦点回触发器；练习 2：模拟拼音候选完成按 Enter，确保只触发一次。还需测试 disabled、Escape、Ctrl+K 事件作用域、StrictMode 反复挂载、移动端屏幕键盘。

本轮源码已写，SDK/生产构建/真实 Chromium NOT_RUN，禁止将结构检查说成库测试通过。官网 https://github.com/pacocoursey/cmdk ，许可证 MIT。

## AB wave9：输入法尾随回车与快捷键所有权

`examples/keyboard-policy.ts` 将 Ctrl/Cmd+K 和 Enter 规则作为可独立测试的纯函数。只有面板关闭时，普通输入框的快捷键不被示例抢走；面板打开后焦点处于其输入框时，再次 Ctrl/Cmd+K 可以关闭。Shift/Alt/IME Processing/229 不触发全局快捷键。

中文/日文候选的 `compositionend` 可能先于尾随 `keydown Enter`，所以仅检查 `isComposing` 仍可能误选命令。本例保留“等待提交 Enter keyup”的标记；在捕获阶段阻止尾随回车冒泡给 cmdk，keyup/后续新按键/失焦会清除标记。鼠标操作与正常第二次 Enter 仍应可用，后续必须用真实 fcitx5/Rime/Chromium 验证事件顺序。定向规则测试：`node --experimental-strip-types --test entries/B18-cmdk/tests/keyboard-policy.test.mts`。


## AB wave19：命令要有真实本地数据副作用

旧示例只更新“演示已完成”的提示，未实际修改任何业务状态。现在 `examples/command-state.ts` 维护原创本地 NewsHub 文章 fixture，cmdk 的 Command.Item onSelect 驱动可观察的行为：稍后阅读切换收藏，已读标记幂等，生成引用填充字符串，模拟刷新增加本地计数。DOM 可访问区域显示同一业务状态，没有隐藏的第二套假演示。删除所有订阅仍 disabled 且 select 函数拒绝执行。

切换层级重置本地数据和查询，不写用户账户、不操作远端订阅、不宣称已经写入系统剪贴板。输入法和 Ctrl/Cmd+K 继续由 keyboard-policy 和真实 cmdk 管理。新增 Node 测试只验证纯业务状态；SDK 的 Dialog/Portal、IME、焦点、键盘需 Chromium 运行。

