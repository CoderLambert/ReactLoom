# B13 dnd-kit 本地整改与稳定交接

日期2026-11-10，owner `/root/quality_e11`。实际仓库cwd `/home/lambert/githubRepos/lambert/ReactLoom`，HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。进入时11文件、无本条目dirty；认领摘要 `87d2addef506e3cc5ccb69f547b54549848ca0a729a229d085e165254ce73b8d`。适用根/本包/条目AGENTS、协调/实施/整改事实、质量路线图与quality Skill三references已读取。冻结期只读，主控释放后才写入。

只改B13，保留他人工作；没有改公共src/scripts/tests/e2e/runners、依赖锁、索引、队列/results；没有全目录生成/类型/构建、浏览器、提交或推送。正式verification sdk/build/browser均NOT_RUN，本地日志不是verify:record收据。

## 本次价值与保留

现有Pointer/Keyboard Sensor、稳定ID、区间锁定、可见前缀、单层撤销与revision会话具有独立教学价值，保留。旧讲解重复反例和未实施选型内容较多、源码密集排版，隐藏后缀与数据轮次不可观察；纯reorderVisible只验证可见前缀的唯一ID，隐藏后缀重复可以放行。

本轮保持三个目标：basic从指针/键盘预览到数组/DOM提交；business在数据层拒绝跨固定频道的移动；advanced单层撤销与过期drop。补完整数组/数据轮次/拖动状态、稳定DOM标识、作用域样式、中文传感器操作说明；保持原按钮名字和传感器配置。

reorderVisible现对整数组检查唯一ID，隐藏项与可见项重复、两个隐藏项互相重复均返回null，新策略断言覆盖此缺口。锁定仍检查源到目标整个区间，不只disabled手柄。basic重排仍保留隐藏后缀；取消或拒绝不写items。

新增状态展示来自实际items/dataRevision/drag事件，没有另存一份模拟数组。transform仍由useSortable提供，松手才提交业务顺序；不把提交约束声称屏幕物理障碍。取消/level变化/卸载丢弃会话引用，应用不遍历清理其他监听。SDK监听和其延迟detach行为与浏览器验收分别说明。

## 六项复核

| 维度 | 状态 | 层级、证据与限制 |
| --- | --- | --- |
| 技术准确 | PASS | 已装core6.3.1/sortable10.0.0与匹配固定源码/类型核对；3真实SDK检查及17纯策略通过；说明预览/提交、ID/下标、SDK/应用约束和单层撤销边界。 |
| 解释清楚 | PASS | 静态内容复核：从RSS问题到ID/数组/DOM/传感器，再三个实验及迁移；精简重复反例，删未核实新版0.x推荐，当前两包与新API分开。 |
| Demo有用 | NOT_RUN | 三个目标实际代码与观察点齐全；Node/SSR已执行，真实指针、键盘、碰撞、锁定/撤销与离开仍待主控browser。 |
| 源码可迁移 | PASS | 正常排版，8份必要源码/样式/测试列sourceFiles；相对导入、声明依赖、容器尺寸与监听所有权明确，入口类型通过；运行生命周期仍待真实browser。 |
| 官方来源可靠 | PASS | 经典包对应固定commit的英文包README，完整候选无中文；版本/日期/摘要/原文齐全，官网完整头+unknown准确。 |
| 结果可复核 | NOT_RUN | SDK/纯策略/类型/格式/metadata日志有cwd命令exit；核心DOM交互未由本工作者执行，不晋级content_done或正式PASS。 |

## 官方版本和来源

实际已安装 `@dnd-kit/core`6.3.1、`@dnd-kit/sortable`10.0.0；sortable声明peer core^6.3.0，匹配本例。核对core的Pointer/Keyboard sensor类型和dist/core.esm.js的useSensor/监听detach；sortable的useSortable.d.ts/dist逻辑核对id、disabled、attributes/listeners及节点refs。

实际远端tag列表：core6.3.1 annotated tag `34781e0d9d757d35d8e44177fc7003286d562484`解引用 `e9215e820798459ae036896fce7fd9a6fe855772`；sortable10.0.0 tag `c31d5d18ff8d320d67b96f6d9ab9684923df8f1d`解引用较早的 `2d862922975e5fa73e1a11845f8c781296f21d4b`。并未假称两个tag同commit：本例快照固定core提交，该commit实际packages/core和packages/sortable的package.json分别仍为6.3.1/10.0.0。

只读阶段实际列完整tree，README候选为根、.changeset、accessibility/core/modifiers/sortable/utilities各包的README，没有中文版本。选择排序预设的 `packages/sortable/README.md`，保留1017原始字节，SHA-256 `f154b4be7cce8d6dc435c7b42d81f7ca4cd9c88ff77b85237dbbbc341c7b2c38`，时间 `2026-11-10T10:07:37.612386+00:00`；来源/候选/版本在official/source-audit.json。

当前[经典Sortable文档](https://dndkit.com/legacy/presets/sortable/overview/)、[经典KeyboardSensor](https://dndkit.com/legacy/api-documentation/sensors/keyboard/)与固定源码一起核对。现代新包API不作为本例实现依据。

只读首次官网请求403，后续保存的本次GET `https://dndkit.com`返回200且最终URL相同；official/homepage-response.json保留完整响应头和XFO/CSP null。没有从Lab originiframe实测，unknown且有直达，不从200/缺限制头推定allowed。

## 实际命令与原始日志

以下实际cwd均为 `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`；validation/*.txt明确记录子进程command/cwd/exit/输出，未用被根ignore的*.log。

| 命令 | exit | 结果与日志 |
| --- | --- | --- |
| `node --test entries/B13-dnd-kit/tests/sdk.test.mjs` | 0 | 真core/sortable SSR hooks、传感器描述、禁用语义及给定矩形closestCenter，3/3；validation/sdk.txt |
| `node --test entries/B13-dnd-kit/tests/reorder-policy.test.mts entries/B13-dnd-kit/tests/drag-session.test.mts entries/B13-dnd-kit/tests/pinned-order.test.mjs` | 0 | 17/17纯策略，含新隐藏重复身份；validation/policy.txt |
| `pnpm exec tsc --ignoreConfig --noEmit --target es2022 --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --esModuleInterop --types vite/client,node entries/B13-dnd-kit/examples/demo.tsx` | 0 | 本例入口/直接依赖，无诊断、不生成目录；validation/typecheck.txt |
| `pnpm exec biome check --write entries/B13-dnd-kit/examples entries/B13-dnd-kit/tests entries/B13-dnd-kit/validation/check-entry.mjs entries/B13-dnd-kit/library.json entries/B13-dnd-kit/verification.json entries/B13-dnd-kit/official/source-audit.json entries/B13-dnd-kit/official/homepage-response.json` | 0 | 最终13文件；validation/biome.txt |
| `node entries/B13-dnd-kit/validation/check-entry.mjs` | 0 | 当前validateEntry/completeness、3场景8源文件、README摘要与core版本；validation/metadata.txt |
| `git diff --check -- entries/B13-dnd-kit` | 0 | 无空白问题；validation/diff-check.txt |

SDK测试使用局部fixture真调用DndContext、SortableContext、useSortable/useSensor等SSR及closestCenter；不加载应用DOM、不构造真实PointerSensor事件或测量浏览器几何，不能据此证明拖动交互。纯策略没有导入目标SDK，不能计SDK通过。

首次Biome exit1保存validation/biome-initial.txt：旧span aria-label缺受支持role、旧effect仅为level失效却未读取level。改成锁标记role=img，effect明确核对session.level并在卸载丢弃引用；原字符串也正常模板排版。随后新SDK fixture漏type=button的Biome失败在validation/biome-sdk-initial-failure.txt，修正后只重跑直接受影响SDK文件与最终格式；17项策略和入口tsc有效结果没有重跑。

## 主控真实浏览器操作与断言（本工作者NOT_RUN）

根 `b13-workshop[data-level]`；每个li为`b13-item-<id>`且有data-item-id/data-locked。原手柄/方向按钮名字保留：拖动/上移/下移 + 技术快讯、AI 新模型、开源趋势、国际资讯、深度阅读、稍后阅读。状态用b13-status，避免和SDK自身live区域混淆。

1. basic初始b13-visible-order=`tech → ai → oss`，DOM li data-item-id同序。真实鼠标在“拖动 技术快讯”手柄按下，移动超过6px，到第二项中心附近放下，应更新数组/DOM与output；小移动未激活。展开“查看完整数据与提交轮次”，b13-all-order后缀news/read/later仍保留。
2. basic键盘focus同手柄，Space→ArrowDown→Space（必要时等坐标变化）完成一次真实KeyboardSensor排序，DOM/output一致；另一轮Space→ArrowDown→Escape取消，顺序和revision不变；上下按钮仅作为另一独立输入路径，不能当拖动传感器验收。
3. business的news位于第4位且锁手柄disabled。上方组内移动与下方later/read交换可以成功；tech→read跨news的drop拒绝，最终数组/DOM不变、b13-status提示不能变更顺序，revision不增。临时transform视觉变化不等于已提交。顶/底及跨锁的方向按钮disabled。
4. advanced合法移动后点“撤销”恢复上次DOM/完整数组，撤销按钮失效。再排序点“恢复默认”回初始并增加revision；恢复本身可撤销。拖动中通过恢复/其他操作改变revision，迟到drop不得覆盖当前数组；b13-drag-state结束回“当前没有拖动”。
5. 拖动过程中离开/停止，再释放指针，不得再提交旧数组；重进不残留本例会话。SDK传感器有延迟detach，不以同一同步瞬间全局监听计数判断。真实触控/屏幕阅读器/设备IME不从鼠标或SSR推断。
6. 窄屏行/按钮换行、完整顺序输出不溢出、键盘焦点可见；README包/版本/英文来源、官网unknown和直达对应。

## 文件与剩余

修改guide/agent/library/verification，example和pinned-order，原demo及3个policy suite正常排版。新增workshop.css、tests/sdk.test.mjs、official原文/来源/完整头、本记录和validation日志/核对器；AGENTS维护规则保留。没有更换传感器、没有引入新依赖，没有改共享测试或宿主。

待主控独立复核、真实指针/键盘/锁定/撤销浏览器，以及下批输入稳定后的共享构建。当前交review_pending候选，不标content_done；正式收据仍需未来获准且干净提交输入。无新增公共能力需求。
