# C21 tailwind-merge工程复用

适合组件明确允许调用者用Tailwind类覆盖默认值。只做条件拼接用clsx；非Tailwind类、任意插件和未知CSS含义不要按前缀猜冲突。实装tailwind-merge3.7.0、clsx2.1.1，MIT；官方支持Tailwind4.0–4.3，Lab实际4.3.3。

## 单实验与迁移

原合格cn、px/pr方向、modifier例子合并成一个basic完整实验：基础→clsx条件变体→调用者最后→真实merge→article.className。八预设是同一目标的输入样本，不再重复三层界面。必要5源为example/demo、merge-model.mjs+d.mts、styles.css。cn保持twMerge(clsx(...))，不先分别merge再拼接。

真实Tailwind CSS由目标应用构建提供；Lab已有@tailwindcss/vite4.3.3及@import。预设完整token在源码中，运行时新输入不自动有CSS。两条c21-pad-*样式随源码提供并实际设置padding-inline，扩展器模块级放入真实px组，配置开关不生成CSS。非Tailwind项目只迁移字符串模型，无需为merge安装CSS编译器。

## 不可误解的规则

- SDK从右往左扫描已识别group/modifier/important通道，不是删除所有前置同前缀类。px可覆盖早先pr，后置pr仍保留前置px的左侧。UI方向组来自公开getDefaultConfig真实配置，不是内部逐token追踪。
- 普通modifier组合会排序，order-sensitive/任意变体不能任意交换；important单独通道。不要笼统“文字相同前缀才冲突”。
- 未知my-widget不保证去重；c21-pad-*默认未知，但bg-brand/bg-accent等可能被宽泛validator识别。识别不代表项目已生成CSS，更不等于安全净化。
- 自定义规则必须和自己的CSS语义对应，例子把padding-inline加入px，不是加一个随意互斥名字；未来改样式要同步配置/真实SDK测试与DOM断言。

## 状态与证据

React只持输入/选中/尺寸/配置，计算同步；重置恢复全部控制项，卸载重开清本轮状态。SDK缓存/配置模块级复用，无监听/timer/请求/Worker/存储和可变实例需destroy；不清SDK全局缓存。预览contain只是布局限制，不是任意CSS安全沙箱。

真实SDK5直接导入共享模型和target SDK，涵盖cn、条件优先级、方向、modifier/important、扩展与未知。无独立policy-only套件；不把自制正则结果计SDK。严格入口/格式/metadata和完整浏览器提案另留实际日志；computed style/hover/断点/真实卸载由root匹配构建验收，不拿字符串测试当像素通过。formal状态保持NOT_RUN。

官方fixed repo dcastil/tailwind-merge commit511d68a65d8fa11ae8a549b5a1d5cf4dced41101的packages/tailwind-merge/README.md，版本3.7.0、英文2549B/SHAb7686c3623d44ff744eebef1bc9a2b8ab36cee4e491d1c609fc8131e67d2f2b3；registry无gitHead，用实际标签及manifest交叉匹配，匹配包目录无中文README。homepage是GitHub仓库，实际frame-ancestors none与XFO deny→blocked。原始HTTP、抓取失败保护、同步UTC、六项/命令/未测在local-validation；维护链接不要求公共发布。
