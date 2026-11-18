# B16 非作者独立六项复核

复核者 `/root/quality_e05`；UTC **2026-11-10T14:16:23.644534+00:00**；实际cwd `/home/lambert/githubRepos/lambert/ReactLoom`，Git HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`。对象为作者最终STABLE的B16。只读实现/安装源码/原文/日志，唯一写入本报告；不改产品、测试、正式状态或公共文件，不重跑有效SDK/类型/metadata/格式，不运行浏览器或共享生成构建。

**结论：没有发现阻断P1/P2；静态复核通过，三目标实际浏览器仍NOT_RUN。** 重点核对的单位、轴、初始化回调和资源所有权均与4.14.1匹配源码一致；没有以SSR替代真实尺寸求解。

## 六项独立结论

| 维度 | 状态/证据层级 | 独立依据 |
| --- | --- | --- |
| 技术准确 | PASS（匹配安装类型/源码，静态） | 实装4.14.1/MIT、React/DOM peer ^18\|\|^19，宿主19.3满足。Panel prop数字px、Layout映射数字百分比、Separator相反ARIA轴、5pp/Home/End/F6、挂载meta false和按Group清理均已独立读当前source-map核实。 |
| 解释清楚 | PASS（静态） | 用线性工作台解释双栏→三栏→纵向/重挂复位，输入/处理/结果与实际控件对应；初始化/程序变化与用户输入分开，持久化、折叠、Grid/网络明确未接入。 |
| Demo有用 | NOT_RUN（真实浏览器） | 3目标代码与完整3case提案齐，既有类型有效；真实指针、键盘轴/焦点、约束几何、窄屏和动态清理由主控匹配候选运行。 |
| 源码可迁移 | PASS（静态/已有局部类型证据） | 3必要sourceFiles含局部CSS，useId稳定业务后缀、真实Group/Panel/Separator、320px轴空间、内容滚动无Lab alias/外部资产。key重挂主动丢弃状态，未伪称存储恢复或完整SSR hydration。 |
| 官方来源可靠 | PASS（固定原文/实际HTTP证据） | registry gitHead与annotated4.14.1 tag→0cd376c...、固定manifest一致；README27652B/sha重算吻合，完整tree四候选无中文。官网GET200全头无XFO/CSP，真实iframe未测→unknown。unsigned tag没有被说成签名已验。 |
| 结果可复核 | NOT_RUN（整体客户端运行）；限定日志一致 | SDK2只真实SSR、0skip自然退出；入口/提案类型、格式/metadata日志有真实cwd/argv/exit0。作者未造纯函数求解器冒充SDK，无fake DOM/事件。formal四项均NOT_RUN，13关键输入sha绑定如下。 |

## 单位与轴的实际源码依据

安装`dist/react-resizable-panels.js.map`的`../lib/global/styles/parseSizeAndUnit.ts`明确number返回px，字符串尾缀识别%，无单位string回退%。Panel实际props都写'35%'/'25%'/'16%'等，不把数字35误当35%。Layout是以panel id为键的百分比number映射，与Group defaultLayout/getLayout/setLayout及回调契约一致；本文只是回调观察，没有调用未实现的命令式保存。

`calculateAvailableAxisSize.ts`无自定义策略时累计各item的offsetWidth/Height；separator不在items中，比例基于扣除分割条后的面板轴空间。提案按实际面板像素之和计算比例，与源码对应，没有把外框边框/分割条计入分母。

`onDocumentKeyDown.ts`按axis.orientation决定有效方向键：horizontal接受Left/Right±5，vertical接受Up/Down±5；Home/End走约束极限，F6按组separator顺序循环，Shift反向。Separator的aria-orientation描述的是分割线自身方向，因此水平Group是vertical separator、垂直Group是horizontal separator。提案对应这两个轴，没有手写键盘求解器。

## 初始化回调、快照与复位

`Group.tsx:304–313`在布局已验证且约束非空后主动`onLayoutChangedStable(layout,false,requestedLayout)`；不是只有用户拖完才触发。`:330–346`订阅后按interactionState判断当前轴交互完成，完成才发onLayoutChanged，并透传event.isUserInteraction。onLayoutChange是高频路径，作者没有订阅它假报提交。

`example.tsx:26–29`复制SDK layout并保存真实meta.isUserInteraction；HTML尺寸表与JSON都读同一snapshot。不存在第二份预设35/65输出冒充回调。初始化先null，SDK挂载后显示初始化/程序变化，纠正了旧文“直到再次拖动都为空”。

方向切换和复位先清snapshot，Group key含level/orientation/generation，真实重挂后重新发布默认值；复位保留当前轴，停止再运行则组件状态回水平。useId+业务后缀让同组id稳定，重挂同业务身份不意味着保留内部尺寸。Panel data-testid由SDK采用id，提案使用[data-b16-panel]读取实际外层id，避免传自定义testid被覆盖。className作用在内层内容div，CSS未覆盖SDK外层flex求解。

## 清理与资源边界

独立读取当前安装map中`mountAxis.ts`：每个轴有ResizeObserver和分割条keydown监听，unmount删除该轴状态、移出interaction、移除自身separator键盘监听并disconnect自身RO。ownerDocumentReferenceCounts减一，最后一个同document Group才移除共享contextmenu/dblclick/pointer监听。`Group.tsx`cleanup同时unmountGroup并移除自己的change订阅。

作者应用没有额外observer/timer/网络/存储；只卸载自己的React子树，没有全局删监听、清SDK状态或假dispose。guide/agent明确这是安装源码证据，不是动态资源普查PASS。提案旧Group DOM断开/回调默认重建和卸载后原生指针事件的检查有价值，但不声称完整监听计数已测。

## 官方来源与有效日志

四个安装文件（package.json/d.ts/JS/source-map）的sha已在本复核独立重算，与sdk-source-audit.json全部匹配；该审计保存的源码与当前安装内容一致。没有把研究稿中的补丁当作当前能力。

原README完整27652B，SHA-256 **d27812bc8cf8a5e07f0a58bcf68a8f48cc3cac4d22f917777e62662ab61c231c**，与library/source-evidence一致。精确commit **0cd376c57a19900d22f33aa8eb46f417a7437c12**、tag4.14.1/对象b449f4176f61435729b194c595abfbe287997121、npm gitHead/manifest4.14.1匹配。tree未截断，README候选为根及next/vike/vite三个集成文件，无中文。来源为英文，日期/路径/repo/hash齐，未把中文讲解混入原文。

source-evidence保存7个实际匿名GET的最终URL/完整headers/字节/sha；官网https://react-resizable-panels.vercel.app/的200头没有XFO/CSP，不能仅据缺头说allowed，unknown与Lab-origin NOT_RUN准确。tag签名状态unsigned，未作密码学验证承诺。

复用local-runs.json及sdk/typecheck/biome/metadata/proposal-typecheck/proposal-format/diff-check原始日志，不重跑。SDK2第1项仅服务器环境下真实组件结构、显式百分比样式、可聚焦ARIA及无服务端挂载回调；第2项数字80→80px与纵向三栏静态结构。公开SSR输出不能证明客户端约束、键盘或RO。没有额外policy套件来伪造布局求解PASS。

浏览器提案覆盖全部三个目标：basic真实pointer down/move/up且释放后才观察提交、Home/End/方向约束；business两个边界/F6/ShiftF6与DOM身份；advanced纵向无效Right/有效Down、默认复位来源、旧Group离开DOM、390px几何、停止/重跑与默认恢复。无mock、合成SDK事件或伪boundingBox。运行由主控进行；触摸/读屏/OS差异/SSR hydration/完整资源计数仍NOT_RUN。

## 绑定的13项独立复核输入

- `library.json`：`a7d7546bc522f342da607661ad62e74e3ce3f450411d0ee08780e4a3e4ffb3c9`
- `guide.md`：`54ec409e06999e328c16ed7d91b290d618f52471d502e9d801090906b4abe5f8`
- `agent.md`：`1afc4d1efa7adf271d2df4cf14235c7c711752523b0710f4b09295ef096d03a2`
- `verification.json`：`cc628b32c23cd145506f06c4247ca643de49475e337aa8eca60134208e198401`
- `local-validation.md`：`04e6c7d011bf5dabbe75abb5c973957ee78fd9d13bc3ced4c474746f93adcff4`
- `examples/example.tsx`：`f682674564e1b62b11114fe6c01186b80bc103ef3abc7bad40abf9ac077a0c15`
- `examples/demo.tsx`：`f2284fc30009ceaaf34ecc200ff988948d95eba2717c8cf3ec70a978a2dc4038`
- `examples/panels.css`：`c341bea5c1c9e8dcae0bcb5dec914583f5c942d69ddca8dfe614abfc4bb7aca5`
- `tests/sdk.test.mjs`：`e46cb12a2df3435adb3ef4ad0794910d7d6bb297197e2dcdf681f98cfcbfad20`
- `official/readme.md`：`d27812bc8cf8a5e07f0a58bcf68a8f48cc3cac4d22f917777e62662ab61c231c`
- `official/source-evidence.json`：`4967ced0a9f2a3750e9345feca195c8ca1abf660c58b398c60d4e6276e723eae`
- `validation/browser-proposal.txt`：`da780e979c75349082830e1f8f2a97e1c15e645adbdbf7f0ce5ba14ea72a0d9f`
- `validation/sdk-source-audit.json`：`95c25fd421552b928d731c6fd79b0bc7b39f7057f354baa0c7afb93f3d757bc7`
