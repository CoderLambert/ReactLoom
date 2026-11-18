# B15 react-grid-layout 本地质量整改

实际仓库cwd `/home/lambert/githubRepos/lambert/ReactLoom`；定向命令cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`，diff在仓库根。Git HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`，原9文件/各自sha见[baseline](validation/baseline.json)；条目内容摘要不等于Git提交。

只拥有B15，保留其他工作者所有修改；没有改公共src/scripts/e2e/依赖锁/索引/queue/results，未提交/推送/发布，未跑全目录generate/typecheck/build或隐式build浏览器。多次按主控请求冻结在可编译中间点，处理获单独授权的B12回修/非作者报告后才在明确release时续写；没有把中间点或共享构建冒充B15完成。

正式[verification](verification.json) sdk/build/browser全部 **NOT_RUN**。本地真实SDK数值/Hook SSR、pure policy、类型/metadata与真实DOM验收分开，完整浏览器由主控匹配候选执行；整体客户端运行NOT_RUN。

## 六项独立结论

| 项目 | 状态/证据层级 | 依据与边界 |
| --- | --- | --- |
| 技术准确 | PASS（匹配安装源码/类型与限定SDK） | 实装RGL2.3.0/resizable4.0.2/MIT；v2配置与回调真实。修正measureBeforeMount默认false时mounted初值true，不再将1280初值当实测。SDK3仅实际core几何/压缩与Hook SSR，不证明浏览器RO/指针。 |
| 解释清楚 | PASS（静态） | RSS二维仪表盘主线，格子/像素/容器/断点→指针回写→两份草稿/锁/键盘替代；输入/处理/结果、SDK/业务所有权与持久化未实现明确。移除重复反例、未挂载后端和历史CI堆砌。 |
| Demo有用 | NOT_RUN（真实浏览器） | 3独立目标、实际控件、真实SDK stop观察和当前几何/双模型同源；完整3case真实提案已给。只读测量、拖/缩放、锁/键盘/宽窄恢复与卸载均需主控运行。 |
| 源码可迁移 | PASS（静态/有效入口类型） | 4必要sourceFiles含独立CSS，官方两样式入口保留、正常排版、无Lab alias/资产/网络。稳定i/key、handle分离、两份model/static防御/纯键盘原规则保留。SSR hydration/目标应用集成未测。 |
| 官方来源可靠 | PASS（固定原文/真实HTTP） | npm gitHead=tag解引用=固定manifest2.3.0，完整tree唯一README无中文；42045B原文/sha且安装README同sha。官方Pages200全头无XFO/CSP，未Lab-origin实测→unknown。 |
| 结果可复核 | NOT_RUN（整体运行）；限定日志可复核 | SDK3/policy6、入口类型、最终格式/提案类型/metadata均exit0；精确cwd/argv/时间/原始输出齐。13实现/内容/来源/提案输入sha绑定，不把源码/数值、类型或共享构建抵消真实运行未测。 |

## 实际实现与保留边界

原wide12/narrow6独立文档、<640真实容器断点、GridLayout key=breakpoint、projectCells边界、sameGeometry去重、稳定i/key、标题handle与按钮分离、se缩放、verticalCompactor保留。advanced static+回调上一帧坐标防御、frozen键盘拒绝、窄屏不交换锁定邻居均沿用；原policy6只正常排版，无算法重写。

必要修正：useContainerWidth显式measureBeforeMount:true；原默认false/mounted初值true/initialWidth1280说明会错误宣称已实测。未测时网格占位，读数带mounted状态；被观测容器不额外padding，gridConfig内边距沿margin10，减少首测/RO content-box口径差异。原生“容器宽度”select只是切实际CSS maxWidth580，Hook仍真实测量，没有把state直接设成假width。

增加真实onDragStop/onResizeStop计数和末次item复制快照，只有目标SDK回调递增；不在自建键盘按钮里伪造SDK stop。changes为接受的几何变化次数，不假称一次用户动作/保存次数；onLayoutChange也可因挂载/prop/列数触发。重置两份布局/锁/本轮SDK计数，不改变容器宽度，changes继续累计。

必要styles.css包含卡片/手柄/控件/焦点、滚动与reduced-motion关闭transition。坐标/状态从同一个visibleLayout/model输出；无额外resize求解器、网络、持久化、下载导出、全局监听或timer。SDK负责碰撞/压缩与指针/RO资源，纯按钮仅键盘替代，不冒充完整SDK无障碍拖放。

## 匹配安装与源码

RGL2.3.0和react-resizable4.0.2均MIT，React19.3；实际React/DOM peer分别>=16.3.0和>=16.3，不表示所有组合验收。v2组件默认导出GridLayout，width必需、layout/配置对象/只读回调匹配安装d.mts；未用legacy WidthProvider/data-grid/top-level isDraggable。

安装`dist/chunk-TW4BCTKD.mjs`真实useContainerWidth默认measureBeforeMount=false、initialWidth1280、mounted=!measureBeforeMount；true时等measureWidth再mounted。RO返回contentRect宽度、RAF或可选debounce更新；cleanup cancelAnimationFrame/clearTimeout/disconnect。`GridLayout`默认containerPadding=null，effectiveContainerPadding=margin。verticalCompactor先保留静态项，再克隆布局解决重叠并压缩，不改调用者输入。

本轮实际SDK3：1210px/12列/78行高/margin/padding10时，feed(x4,y0,w4,h2)映射left410/top10/width390/height166，并真实calcXY回到4/0；静态项周围压缩不碰撞且不改原数组；Hook SSR显式true→mountedfalse/默认false→mountedtrue，两者width均初值1280。没有制造DOM/RO/Canvas，不能当客户端网格PASS。

## 真实命令 / cwd / exit / 原始日志

除diff在仓库根，以下均在Lab cwd。日志有完整argv、UTC起止/退出码、stdout/stderr；表内长tsc参数省略仅为阅读，原始记录完整。没有force-exit、SKIP占位或mock SDK。

| 命令 | exit / 范围 | 原始日志 |
| --- | --- | --- |
| `pnpm exec -- biome check --write entries/B15-react-grid-layout/examples entries/B15-react-grid-layout/tests` | 0；6文件，原2个模板字符串info保留后等价修正 | [format-code.txt](validation/format-code.txt) |
| `pnpm exec -- tsc --ignoreConfig --noEmit … entries/B15-react-grid-layout/examples/demo.tsx` | 0；局部strict入口与实际imports | [types.txt](validation/types.txt) |
| `pnpm test:sdk --entry=B15` | 0；真实SDK3 PASS / 0 SKIP，自然退出 | [sdk.txt](validation/sdk.txt) |
| `pnpm test:policy --entry=B15` | 0；纯策略6 PASS / 0 SKIP | [policy.txt](validation/policy.txt) |
| `python3 entries/B15-react-grid-layout/validation/fetch-official.py` | 0；8个实际200请求 | [source-fetch.txt](validation/source-fetch.txt) |
| `pnpm exec -- biome check --write`（example/styles/library/verification/validator/临时提案6文件，完整argv见日志） | 0；无剩余info | [format-final.txt](validation/format-final.txt) |
| `pnpm exec -- tsc --ignoreConfig --noEmit … entries/B15-react-grid-layout/validation/browser-proposal.check.ts` | 0；完整提案strict类型，不跑browser | [proposal-types.txt](validation/proposal-types.txt) |
| `node entries/B15-react-grid-layout/validation/metadata-check.mjs` | 0；schema/completeness、3目标/4源码、双版本/许可/CSS、原文与安装README同hash、unknown/正式状态和13输入 | [metadata.txt](validation/metadata.txt)、[input-hashes.json](validation/input-hashes.json) |
| `git diff --check -- packages/library-lab/entries/B15-react-grid-layout` | 0；仅本条目 | [diff-check.txt](validation/diff-check.txt) |

入口/SDK/policy通过后仅等价模板字符串、标题文案、非类型CSS排版和本轮提案/metadata/文档收尾，没有改对应算法或组件API，不重复有效结果。主控candidate13/14共享类型构建是主控外部证据，未套正式B15 build。临时browser-proposal.check.ts由txt复制、格式整理后同步回txt，类型通过后删除，不维护第二套Demo。

## 官方原文和官网响应

实际官方npm2.3.0 gitHead与annotated tag2.3.0（对象 **99f88f92470eb8a9fa51d0c1b997cc542deda270**）解引用均为 **9b01a614bcdd13e7e921cf3f4b1c7e77942421c1**，固定package.json version2.3.0。resizable4.0.2 npm gitHead **8ca079f91ba0d7002568a4154cc3b2c1f554e274**，版本/许可/peer另存。

完整未截断tree只有README.md，无官方中文。选[官方固定根原文](https://github.com/react-grid-layout/react-grid-layout/blob/9b01a614bcdd13e7e921cf3f4b1c7e77942421c1/README.md)，英文 **42045B**，SHA-256 **10e8e14f3e5cbcf6f8d8f27381e122d17f8d2312b3208e3a2528c5b62b7c6ca1**，同步UTC **2026-11-10T14:02:32.195608+00:00**。完整[原文](official/readme.md)未格式化/拼接/翻译覆盖，安装包README独立重算同sha；具体repo/ref/path/version/lang/date/hash在library和[source-evidence](official/source-evidence.json)。

fetch脚本实际完成registry2、tag/ref及tag对象2、tree、rawREADME、rawmanifest、官网共8个GET，各保留最终URL/status/完整headers；前七正文有bytes/sha，官网明确未读body，不捏造正文hash。固定源码引用useContainerWidth.ts也已只读确认可达。

官方README所链[GitHub Pages演示站](https://react-grid-layout.github.io/react-grid-layout/)实际200，完整头未见XFO/CSP；不能据此推定allowed，Lab-origin iframe未实测所以unknown，并保留直达。没有用GitHub/raw头冒充官网或放宽公共frame-src。

## 三目标真实浏览器提案与剩余

完整[Playwright源码](validation/browser-proposal.txt)已准备3case，root统一接公共e2e。没有SDK/RO/指针mock、假DOM、合成自定义拖动事件或截图代替断言：

- basic：实际mounted/容器width与SDK投影的真实卡片DOM；只读指针/按钮不变；原生宽度select经真实RO切6列堆叠再回12列、初始几何/changes不丢。
- business：真实page.mouse标题拖动超过门槛、SDK drag stop和实际几何改变；原生键盘按钮改宽但不触发drag计数；真实se缩放及同key DOM复用。用SDK公开calcGridItemPosition预测，再与真实boundingBox比较，等待真实布局settle而不是假时钟。
- advanced：宽屏改宽→窄布局锁定/指针不动/键盘拒绝跨锁邻居→其他行原生Enter交换→wide原草稿保留→重置；390px真实容器/几何；停止旧网格DOM断开、窗口/指针后重新运行默认。

实际控件：region“React Grid Layout 实际看板”，select“容器宽度”auto/narrow，“重置宽窄布局”“锁定新闻总览”，方向/加宽/缩窄+卡片中文名。观察b15-workshop data-mounted/breakpoint/cols；b15-container、b15-card-headline/feed/queue；b15-layout当前几何、b15-state实际两份模型/width/changes及SDK stop快照。getByTestId读JSON不是伪造SDK getter；SDK回调计数只来自真实目标API。

仍NOT_RUN：以上全部真实DOM/拖动/缩放/RO/宽窄/锁与卸载；完整SDK监听/observer资源普查；触摸/OS设备/读屏拖放公告；SSR hydration；大网格性能；后端持久化/权限/取消。现有SDK3/policy6只能支持对应数值/规则，不能抵消这些缺口；formal全部NOT_RUN，内容完成由root独立复核决定。

## 文件与交付

原example/demo/layout-policy/原policy测试正常排版，按上述必要接口/观察修正example，新增必要styles与真实SDK测试；精简guide/agent、更新library/verification并保留正式NOT_RUN；新增固定官方原文/完整头、fetch/metadata、完整提案/13输入摘要/原始日志和本记录。AGENTS未改，无公共依赖请求。完整文件见[final-files.txt](validation/final-files.txt)，日志sha见[log-hashes.json](validation/log-hashes.json)。最后稳定时间见文末，交付后停止全部B15写入（含文档/日志/metadata）。

FINAL STABLE：`2026-11-10T14:47:52.317695+00:00`。13输入sha复读一致，scope diff exit0。停止B15所有写入（含文档/日志/metadata）；正式verification均NOT_RUN，真实browser交root匹配候选。

## 独立复核修正

卡片局部border-box已修。真实active-drag scrollable host卸载复现上游2.3.0 RAF残留：candidate14/b15-active-unmount-probe.txt exit1，卸载后pending1且ticks56→80→89；补丁为ESM/CJS自有edgeScroll实例stop+null，独立审查通过，运行包必须记2.3.0+local patch。新增第五必要源码及迁移pnpm映射。安装/共享候选/修后browser尚待，不能提前content_done。

## candidate15 主控本地质量闭环

本条目适用六项均已通过。candidate15输入f76964af6e3bfa520b3e9e1d78c67a00b09713e1987c8adcce994b46c3e53857，公共/e2e lint/type/build/catalog0且changed=[]；固定dist真实browser29项26PASS/3FAIL，三个失败只属于尚未完成B22。本条目实际通过范围和独立处置见路线图results/B15.md；旧作者摘要为各自阶段历史，新主控输入摘要见validation/controller-input-hashes.json。正式三收据仍NOT_RUN，不是生产/真人最终验收。
