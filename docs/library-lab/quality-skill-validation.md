# library-lab-quality 安装与试用记录

日期：2026-11-10。此次交付为质量规范 Skill 与审查材料；应用平台和条目源码均未整改。

## 创建与安装

- 通过系统 skill-creator 初始化 `library-lab-quality`，包含 SKILL.md、agents/openai.yaml 和三份按需读取的参考。
- 精简入口负责范围、材料核实、内容设计、官方来源、验证与交付；参考分别定义讲解/Demo、官方资料、复核记录。
- 正式目录为 `~/.codex/skills/library-lab-quality`；`~/.agents/skills/library-lab-quality` 链接同一目录，供当前官方发现路径使用。只安装一份正文。
- 默认允许自动发现，也支持显式 `$library-lab-quality`。未修改 Codex 配置。

## 基线与试用方法

使用六个独立上下文的只读任务：每个案例先运行一次无新 Skill 的基线，再运行一次带 Skill 的试用。三个任务均要求实际草稿/设计而非复述原则，允许查询必要官方资料，禁止修改仓库及执行 SDK、构建或浏览器。带 Skill 的产出仅写入独立临时目录。

任务分别为：C20 为有经验工程师给出约 800 中文字讲解与 Demo 建议；D15 审查准确性、教学价值并写修订示范；F18 设计教程、Demo、官方 README 和官网处理方式。预先关注内容是否膨胀、技术结论是否核实、输出是否来自真实执行。

| 案例 | 无 Skill 基线 | 带 Skill 产出观察 |
| --- | --- | --- |
| C20 clsx | 已能给出精炼代码、区分 DOM 语义与类名、纠正“打断属性”的说法；沿用三层示例 | 给出具体讲解、同输入 full/lite 对照设计；发现样式/类型声明迁移缺口；核对现有三层门禁后记录公共依赖；官方英文 README 与 GitHub 禁止嵌入有来源 |
| D15 Dexie | 已独立核实排序、旧 schema、许可和事务说明问题，且记录未运行 | 核对匹配版本源码与官方资料冲突；交付可定位的缺陷和修订示范；说明静态设计与实际运行的边界、README/宿主前置依赖 |
| F18 visualizer | 已区分报告格式与学习目标，提出实际构建对照，并保留 NOT_RUN | 交付报告归因、加载时机、预算三个工程目标；发现 sourceFiles 迁移遗漏和 CLI 收据映射缺口；定位固定 README 提交、英文与摘要，记录 GitHub 禁止嵌入 |

基线本身已表现较好。本试用证明三种代表任务可以使用该 Skill 产出具体材料；不能把基线已经发现的技术问题归因为新 Skill 的增益。每例一次，不构成统计上的稳定性或全库质量保证。

## 反馈与修订

1. 轻量审查可能扩大范围：入口增加单库范围、复用当次已核实基线及足够证据后收尾；只读官方资料核对交付来源与保存待办即可。
2. 静态 PASS 容易被误读：复核规范要求明确证据层级，Demo 未实际运行时为 NOT_RUN，报告有链接不等于运行 PASS。
3. 官方页面表述冲突：增加匹配版本源码/类型、明确版本规则和保留冲突记录的处理方式。
4. CLI 与正式收据配方可能不一致：增加 recorder 的 kind/entry 映射与条目实际配方逐项比对。

D15 试用者只读取以上相关增量再次复核，确认前三项反馈得到回应，并将 Demo 与运行结果一致性保留为 NOT_RUN；未重复整轮检索。

## 验证记录

- Skill 格式校验：`uv run --with pyyaml --no-project python /home/lambert/.codex/skills/.system/skill-creator/scripts/quick_validate.py <skill-dir>`，退出 0，输出 `Skill is valid!`。
- 首次系统 python 校验因缺 PyYAML 退出 1；改为 uv 临时依赖环境后通过，未修改系统 Python 或项目依赖。
- 本地 Markdown 引用与未完成占位检查通过；UI short_description 长度、默认调用中的 Skill 名称、自动发现默认值通过。
- 正式安装后的格式、参考链接、发现入口与正文一致性再次核对；具体完成状态以本次安装命令输出为准。
- 应用 SDK、构建、浏览器、目录重新生成：NOT_RUN；本次新增材料与 Skill 不需要运行这些验证，不能据此填逐库 PASS。
- Skill 选择菜单的 UI 展示未自动操作验证；已检查文件系统发现入口，必要时按官方说明重新加载 Codex。

官方安装路径及符号链接依据：[Build skills / Where Codex loads local skills](https://learn.chatgpt.com/docs/build-skills#where-codex-loads-local-skills)。报告与修改方案分别见 [质量审查](quality-audit.md)、[修改方案](quality-upgrade-plan.md)。
