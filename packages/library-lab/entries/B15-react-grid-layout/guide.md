# react-grid-layout：把仪表盘状态投影到格子

新闻总览、订阅趋势和待审列表需要可调整的位置与大小；窗口变窄时又希望保留另一份布局。react-grid-layout负责格子坐标、指针拖动/缩放、碰撞与压缩；应用保存布局文档和业务身份。适合二维仪表盘，固定排版用CSS Grid，相邻分栏用B16，普通列表排序看B13。本库不获取新闻、不画图表，也不提供完整键盘拖放公告模型。

固定 **react-grid-layout2.3.0 / react-resizable4.0.2**，两者MIT，React19.3.0。实际peer分别为React/DOM>=16.3.0与>=16.3，不表示所有旧版本已验收。v2自带类型；新入口使用width/layout/gridConfig/dragConfig/resizeConfig，旧WidthProvider/data-grid等平铺接口只在legacy迁移入口，不把v1教程直接混进当前代码。

## 核心模型

```text
真实容器像素宽度 → wide12列 / narrow6列
  → 该断点保存的格子布局 → projectCells边界投影
  → GridLayout实际绝对定位/transform
  → SDK碰撞与verticalCompactor压缩 → onLayoutChange回写同一断点
```

每项的 `i` 与React子节点key相同，长期不随标题变化。x/y/w/h的单位是格子；DOM的left/top/width/height才是像素。行高78px，margin10px，默认containerPadding沿用margin。四格宽不等于四倍单列宽，还包括格子之间的间距。

`projectCells`是本例边界规则，不是SDK碰撞求解器；它把w限制在minW/maxW/列数之间，再限制x。`verticalCompactor`才处理同列范围的重叠和向上收紧。因此按钮改变一个坐标后，SDK可能连带移动其他卡片；以回调后的实际JSON和画面为准。

## 目标一：实测宽度与只读网格

打开“容器测量与只读网格”。默认三张卡在12列中各占4×2，关闭拖动与缩放。把“容器宽度”选成“窄容器（最多580px）”，真正改变父容器CSS，SDK的ResizeObserver测量后切到6列独立堆叠；恢复“跟随可用空间”回到宽布局。窄视口自身也会使容器变窄，不是单看window.innerWidth决定断点。

```tsx
const {width, containerRef, mounted} = useContainerWidth({measureBeforeMount: true});
<div ref={containerRef}>
  {mounted && width > 0 && <GridLayout width={width} layout={layout}
    gridConfig={{cols, rowHeight: 78, margin: [10, 10]}}
    dragConfig={{enabled: false}} resizeConfig={{enabled: false}} />}
</div>
```

匹配2.3.0源码的默认measureBeforeMount=false、initialWidth=1280、mounted初值true，所以**只检查mounted不等于已实测**。本例显式true，未测量时显示等待，不把1280初值宣称成容器读数。被观察容器不再额外加padding，网格内边距由gridConfig负责，避免首测与content-box宽度口径不同。

展开“查看断点模型与实际SDK回调”，width/mounted/cols来自真实Hook，wide/narrow是两份内存文档。下方当前布局JSON与卡片位置使用同一visibleLayout。只读拖不动、键盘按钮禁用；纯测量若未改几何不会累计changes。

## 目标二：句柄拖动、缩放和回写

business在标题句柄拖动卡片，或拖右下se缩放手柄。dragConfig只允许`.lab-grid-handle`，按钮是同级内容，不会因点按钮开始拖动；bounded限制指针在当前容器内，尺寸还受minW/maxW与列边界约束。

```tsx
<GridLayout width={width} layout={visibleLayout}
  gridConfig={{cols, rowHeight: 78, margin: [10, 10]}}
  dragConfig={{enabled: true, handle: '.lab-grid-handle', bounded: true}}
  resizeConfig={{enabled: true, handles: ['se']}}
  compactor={verticalCompactor} onLayoutChange={onChange} />
```

onLayoutChange按只读参数映射出新对象，写回当前breakpoint；相同几何不重复setState/增加changes。这个回调也可因挂载、布局prop或列数变化触发，不等于“用户保存一次”，更不能每次自动发POST。

观察真实onDragStop/onResizeStop计数与末次item快照：只有SDK实际结束这些指针交互才递增，按钮是自建键盘替代，不会伪造该计数。changes是接受的几何更新次数，两者不承诺一一对应。点击/键盘激活“缩窄订阅趋势”等原生按钮也可改变布局；碰撞后的位置仍交SDK规范化，不能把按钮叫作SDK原生键盘拖放。

## 目标三：宽窄两份草稿、锁定与恢复

advanced先在宽屏改宽，再切窄容器调整上下次序，恢复宽容器应保留原宽屏草稿。初始窄布局单独创建：x=0、w=6、y按高度累积，不从宽屏x硬截。GridLayout key随断点变化，内部拖动状态不跨档；应用两份文档不被覆盖。

勾选“锁定新闻总览”，该项向SDK声明static，回调还用上一份坐标/尺寸覆盖锁定项位移。键盘规则拒绝直接修改frozen项；窄屏与相邻项交换y时也拒绝锁定邻居。其他卡片仍可编辑，SDK处理与静态项的碰撞；不承诺横向按钮实现业务换位协议。

宽屏方向按钮左右改x，窄屏上下按钮交换相邻y，加减宽度受minW/maxW/剩余列数限制。原生button可Tab/Enter操作并带方向和频道名；这仍不是拿起/放下及读屏公告的完整拖放方案。

“重置宽窄布局”同时恢复两份初始文档、解除锁定并清本轮SDK回调记录，几何changes计数继续累计；容器宽度设置不变。没有localStorage、下载导出、后端保存、revision或撤销栈；JSON只是可序列化观察，不把它写成已持久化。

## 迁移和清理

复制五个sourceFiles（含下文必需的清理补丁）：example.tsx、layout-policy.ts、styles.css和demo.tsx（仅重导出）。保留两个官方样式入口：

```ts
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
```

必要CSS包含卡片/手柄/控件/状态排版、焦点以及prefers-reduced-motion时关闭网格transition；少量动态样式只设置实际容器maxWidth。没有Lab alias、远程资产或网络。卡片内容可以滚动，避免窄卡把替代按钮裁掉；不要让手柄包住输入/操作区。

应用拥有两份model、锁定/容器选择及观察状态，没有自建timer/全局监听。SDK Hook拥有RO、RAF与可选debounce timer，安装源码cleanup会cancel/clear/disconnect；指针资源由SDK子树卸载（其中2.3.0 edge-scroll需要下面的本地补丁）。离开只卸载自己的网格，不全局destroy或删除样式。真实卸载行为仍须浏览器，Node几何断言不能证明它。

SSR可先输出测量占位；完整hydration/设备拖动/读屏未测，不能从measureBeforeMount选项推断已验收。接真实后端时另定保存时机/约束/取消与冲突；本例内存模型不是服务器事务。

## 官方原文与验收边界

官方2.3.0 annotated tag解引用到 [`9b01a614`](https://github.com/react-grid-layout/react-grid-layout/blob/9b01a614bcdd13e7e921cf3f4b1c7e77942421c1/README.md)，与npm gitHead、固定manifest一致。完整未截断tree只有README.md，无官方中文；保存英文完整42045B原文，未格式化或拼接，repo/ref/path/version/lang/date/sha和8个实际请求完整头在official与library.json。

官方GitHub Pages GET200，响应无XFO/CSP；没有从真实Lab origin确认iframe，所以unknown并保留直达，不从200推断allowed。

本地真实SDK3仅验证core格子/像素换算、压缩/静态碰撞与Hook SSR初值；pure policy6是应用规则。它们不证明DOM排版、拖动、缩放、RO或资源清理。完整三case真实Playwright提案见validation/browser-proposal.txt，主控匹配构建运行；正式verification全NOT_RUN，实际命令、六项和剩余见local-validation.md。

迁移时保留 `.b15-card` 的局部 `box-sizing: border-box`，让 SDK 给出的宽高包含卡片 padding 和 border，避免依赖宿主全局 reset 而改变网格碰撞尺寸。


## 2.3.0 的卸载清理补丁

真实浏览器中，给网格一个可滚动祖先，按住鼠标拖动后直接卸载：上游2.3.0的edge-scroll仍每帧继续调度，之后松开鼠标也不会停止。正常拖动结束才调用stop不足以覆盖卸载。这里运行的是 **上游2.3.0 + 本地清理补丁**，不是声称上游版本已修复。

迁移五个源文件时，必须带走 [`react-grid-layout@2.3.0.patch`](examples/react-grid-layout@2.3.0.patch)。它只为发行包的ESM/CJS GridItem同时增加卸载effect：停止该实例的edge-scroll并清空自己的ref；不伪造mouseup、不取消全站RAF。

将补丁复制到新项目 `patches/react-grid-layout@2.3.0.patch`，在该项目的 `pnpm-workspace.yaml` 保留精确映射，再运行 `pnpm install`：

```yaml
patchedDependencies:
  react-grid-layout@2.3.0: patches/react-grid-layout@2.3.0.patch
```

Lab 的映射指向本条目的同一源文件，锁文件记录patch hash。升级SDK时应重新确认上游是否修复，再决定移除补丁；不要把2.3.0的分发文件名套到其它版本。原官方README仍是未经改写的上游原文。本地红probe、独立补丁审查、修后真实回归分别记录在local-validation.md。
