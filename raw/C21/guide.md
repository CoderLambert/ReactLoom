# tailwind-merge：组件的 className 怎样真正允许覆盖

组件默认有间距和背景，选中状态追加一组类，调用者又传来 className。clsx 可以把这些条件拼成字符串，但两个 px 类仍然可能同时存在；CSS 谁赢不由 class 属性中的先后位置决定。tailwind-merge 根据它支持的 Tailwind 分组与冲突方向删除被覆盖的 token，让组件的覆盖接口有明确顺序。

本例使用 **tailwind-merge 3.7.0 + clsx 2.1.1**，MIT。一个完整实验足以把旧三层的基础合并、组件变体与方向/modifier例子串起来，保留八个预设供同一表单切换。所有结果真实调用 SDK，没有手填输出表。DOM预览使用现有 Tailwind **4.3.3** 构建生成的工具类，两条自定义CSS随例子提供；merge本身不生成任何CSS。

## 从输入到真实 DOM

| 环节 | 本例输入/动作 | 真实调用与观察 |
| --- | --- | --- |
| 基础类 | rounded-lg border px-3 py-2 bg-slate-100 | 组件默认值 |
| 条件变体 | 选中、舒适尺寸 | clsx输出 bg-green-100、px-7 py-5 |
| 调用者 | 默认 pr-8，可改 px-1 bg-blue-100 | 最后参与合并 |
| 合并规则 | 默认或扩展px组 | twMerge或模块级extendTailwindMerge |
| 输出 | twJoin、默认merge、当前merge | 最终字符串直接用于预览article.className |

### 先运行默认组件覆盖

1. 默认右侧由 pr-8 提供，左侧仍由 px-3 提供。界面显示完整真实输出；展开DOM可核class与最终字符串相同。
2. 勾“选中变体”，默认背景被 bg-green-100替换；选择“舒适”，默认水平/垂直间距改为 px-7 py-5，调用者pr-8仍能单独覆盖右侧。
3. 把调用者改为 px-1 bg-blue-100。最终结果为 rounded-lg border py-5 px-1 bg-blue-100，旧默认、选中背景和px-7不再保留。
4. 点击卡片里的选择按钮，aria-pressed表达状态。它与外部“选中变体”是同一React状态，不能靠class存在与否推断业务状态。
5. “重置合并实验”恢复预设/输入/尺寸/开关；停止并卸载后重开也从默认状态开始。

预设中的间距在默认16px根字号下可读为：初始左12/右32，上下8；舒适左28/右32，上下20；调用者px-1后左右4。这里是浏览器应核对的CSS结果，Node字符串通过本身不证明样式加载。

[共享模型](examples/merge-model.mjs)中保留可迁移的cn：

~~~ts
function cn(...values) {
  return twMerge(clsx(...values))
}
~~~

条件判断在clsx，Tailwind冲突在merge。先分别merge再用clsx拼起来，会让两段之间的冲突重新出现。twJoin只做字符串/数组真值连接，不提供clsx的对象条件API，更不消解冲突。

## token怎样被识别，为什么不是简单“最后一个类赢”

3.7.0先解析modifier、important和基础类名，再按已配置class group识别；合并从右往左扫描，用“modifier组合 + important + group”记录已覆盖范围。未知类直接保留，未冲突的token保持相对顺序。它没有读取浏览器CSS或你的Tailwind项目配置，也没有公开这个示例所依赖的逐token内部追踪接口。

“查看 SDK 默认方向冲突组”用公开getDefaultConfig的真实配置摘录说明方向，未手写分组结果：

| 预设 | 真实merge结果 | 原因 |
| --- | --- | --- |
| 同组 px：px-2 + px-6 | px-6 | 相同组后者覆盖 |
| 先水平：px-3 + pr-4 | px-3 pr-4 | px还需要提供左侧 |
| 先右侧：pr-4 + px-3 | px-3 | 后面的水平组同时覆盖早先右侧 |
| 断点：md:p-2 p-4 + md:p-6 | p-4 md:p-6 | 默认与md是不同通道 |
| hover：静止背景+两个hover背景 | bg-slate-100 hover:bg-green-500 | 静止背景不被hover删除 |

方向是配置中的冲突边，不能用正则把前面所有px或pr删掉。3.7.0的px还覆盖ps/pe等逻辑侧；实际配置详情由SDK输出。

modifier也不只是比较原字符串：普通hover/focus顺序可被规范化，任意变体与order-sensitive modifier保留自己的顺序。important是另一个通道，普通p-2与p-4!可同时保留，两个important padding才相互覆盖。本实验主表单不展示所有语法，SDK测试保留这些关键边界。

## 未知类与自定义CSS：配置必须对应真实含义

选择“未知类与自定义 px 规则”。默认配置保留 c21-pad-compact c21-pad-roomy，因为它们不是默认认识的类；即使两个CSS规则当前看起来有一条赢了，也不能据像素推断合并器理解了它们。未知的my-widget重复两次也不保证去重。

勾“启用自定义 px 规则”，本例用真正的扩展：

~~~ts
const mergeWithWorkspacePadding = extendTailwindMerge({
  extend: {
    classGroups: {
      px: ['c21-pad-compact', 'c21-pad-roomy'],
    },
  },
})
~~~

[styles.css](examples/styles.css)中两类实际设置padding-inline，因此把它们放到px组有语义依据。结果只留 c21-pad-roomy；再将调用者改成 px-6，扩展后的结果只留px-6。开关只换识别配置，没有替SDK生成CSS。

不能笼统说“自定义token都不认识”。默认color等规则有较宽validator，bg-brand与bg-accent可被识别为背景色组并合并，即使项目根本没有生成这两个类。**认识冲突组、CSS存在、浏览器生效是三件事。** 含义不明的任意值和插件类也要按自己的配置与CSS验证。

## 迁移与选择边界

携带五个实际文件：[example.tsx](examples/example.tsx)、[merge-model.mjs](examples/merge-model.mjs)、[类型声明](examples/merge-model.d.mts)、[styles.css](examples/styles.css)、[demo.tsx](examples/demo.tsx)。没有Lab别名、服务端数据、网络或异步fixture。仅需字符串辅助函数时，带走模型中的cn和对应依赖即可。

~~~sh
pnpm add tailwind-merge@3.7.0 clsx@2.1.1
~~~

DOM预览假设目标应用已有Tailwind v4构建。Lab现有Vite插件@tailwindcss/vite4.3.3与入口CSS的@import "tailwindcss"生成预设工具类；迁入别的框架时使用该框架自己的Tailwind接线，不复制Lab。动态输入新类时，构建不会在浏览器现场补CSS，生产应用需要让编译器扫描到完整类名或明确注册它们。

如果只是条件拼接、没有Tailwind覆盖接口，用C20 clsx即可。CSS Modules哈希名等未知类不能靠名称相似自动消冲突。3.7.0官方支持Tailwind4.0–4.3，旧Tailwind3应核对应主版；不要把当前分组无条件套到另一版或项目插件。

扩展合并器在模块级创建以复用其配置与缓存，不在每次render里创建。没有订阅、timer、Worker、存储或需要应用destroy的实例；停止只卸载React本轮状态，模块SDK缓存属于库，不为演示清全局缓存。

输入是开发者className实验，JSX不会把class字符串当HTML执行；这也不等于类名是权限或安全边界。预览的contain/overflow用于约束实验布局，不是任意CSS沙箱。不要把任意终端用户文本直接开放为生产主题系统。

## 官方原文与当前验证

npm3.7.0元数据无gitHead；实际release标签 tailwind-merge@3.7.0解引用到 **511d68a65d8fa11ae8a549b5a1d5cf4dced41101**，对应packages/tailwind-merge/package.json确为3.7.0。按monorepo目标包选[官方原README](https://github.com/dcastil/tailwind-merge/blob/511d68a65d8fa11ae8a549b5a1d5cf4dced41101/packages/tailwind-merge/README.md)，匹配目录没有中文候选；保留英文2549B，SHA256 b7686c3623d44ff744eebef1bc9a2b8ab36cee4e491d1c609fc8131e67d2f2b3。精确同步UTC、tag对象/manifest、原文与响应证据在本地维护记录。

官方包homepage指向[GitHub仓库](https://github.com/dcastil/tailwind-merge)。实际最终GET响应CSP frame-ancestors 'none'，另有X-Frame-Options deny，因此预览blocked并提供直达；没有独立网站被此处验证为可嵌入。保留原文与本地讲解分离，不用摘要替代README。

本例已用真实SDK检查模型、方向、修饰符、自定义与未知类边界，并在本地浏览器核对实际class、已加载CSS、hover、响应断点、自定义DOM及重置卸载。官方原文与禁止嵌入时的直达展示也已检查。触屏、读屏、其他浏览器、非默认主题与插件、SSR hydration和性能仍未验证。
