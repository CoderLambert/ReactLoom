# Radix DropdownMenu：让菜单交互与业务数据各自有主人

频道操作菜单不仅是一个可见的浮层：它需要键盘导航、可访问名称、复选/单选状态、子菜单和关闭后回焦。Radix Primitives提供无样式交互，应用提供皮肤和实际频道数据。本条目只使用 **@radix-ui/react-dropdown-menu2.1.25**，MIT，宿主React19.3.0符合实际peer；没有Dialog、AlertDialog、Tooltip或远端服务。

适合需要自有视觉的操作菜单；成套后台皮肤看B06/B08。一个简单表单枚举值可用原生select，不必把DropdownMenu当Select。在线文档示例已可能用统一radix-ui入口，本例锁定独立包，不为了复制文档额外换依赖。

## 三个可操作目标

### ① 原生触发器、选择与回焦

basic的“更多操作”是真实button，Trigger asChild把Radix属性/ref/事件合并到这一个节点，避免button套button。用Enter、Space或ArrowDown打开，方向键导航，Enter执行普通Item后关闭，Esc取消并回到持续存在的触发器。

```tsx
<DropdownMenu.Root open={open} onOpenChange={setOpen}>
  <DropdownMenu.Trigger asChild><button type="button">更多操作</button></DropdownMenu.Trigger>
  <DropdownMenu.Portal>
    <DropdownMenu.Content>
      <DropdownMenu.Item onSelect={showDetails}>查看详情</DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>
```

“查看详情”把当前真实频道标题/未读/收藏写到HTML status，不假装打开另一个窗口；“重命名（本地）”真正改当前行标题，但ID和选中身份保持。Item设置textValue=details/rename，菜单中的R提示是SDK typeahead定位别名：打开后按R定位重命名，再Enter执行；不是全局快捷键或自行监听keydown。

asChild子组件若被封装，必须把props和ref传到可聚焦DOM；本例直接使用原生button。Portal将DOM挂到body，不改变React上下文，因此样式使用有命名空间的dropdown.css，不能只依靠工作区祖先选择器。菜单沿用SDK的aria-labelledby关联触发器：主菜单名为“更多操作”，子菜单名为“更多筛选”，不再叠加会被该关联优先覆盖的aria-label。

### ② 复选置顶、单选排序与菜单保持

business选择频道后打开菜单，“收藏置顶”由CheckboxItem checked/onCheckedChange控制；星号和真实数组排序同时变化。最新优先按updated，热度优先按heat，置顶优先于两者，最后以id稳定打破并列。

CheckboxItem与两个RadioItem都显式onSelect.preventDefault，以便连续调整后再Esc关闭。默认选择行为会关闭菜单，不能只在讲解里声称RadioItem自动保持。当前安装Menu内部仍会调用onCheckedChange/onValueChange，即使选择事件被preventDefault；它阻止的是关闭，不是受控值更新。

```tsx
<DropdownMenu.RadioItem value="popular" onSelect={event => event.preventDefault()}>
  热度优先
</DropdownMenu.RadioItem>
```

RadioGroup的value是React sort，SDK提供menuitemradio/aria-checked和键盘语义，不自己画一个可点圆圈替代。Indicator只是视觉，状态还通过真实ARIA和HTML status表达。不要把取消菜单选择的默认动作当作取消业务更新。

### ③ 子菜单、禁用与可见身份

advanced打开“更多筛选”，ArrowRight进入真实SubContent，ArrowLeft返回SubTrigger；“只看未读”和“有收藏的频道”改变实际显示数组。主菜单“显示全部频道”清除筛选。两个层级都保留真实Portal，collisionPadding与可用高度/滚动CSS控制窄视口，实际布局仍需浏览器验收。

锁定删除时，菜单项disabled，应用removeCurrent和纯deleteFeed也拒绝。它是本地fixture约束，不是服务器授权；更改DOM或前端state不能获得真实业务权限。本例没有异步删除确认或请求。

删除之后选择必须来自**当前scope过滤与排序后的集合**。旧逻辑从未过滤数组挑下一条，可能指向不可见频道；现在chooseVisibleFeedId保留仍可见的当前ID，否则取实际visible第一项，无结果则空串。比如只看未读时删除browser与release后，design还存在但隐藏，此时显示“暂无可用频道”，详情/重命名/置顶/删除禁用；清除筛选后design重新可选。

“恢复演示数据”恢复原三条、置顶/排序/筛选/选择，锁定设置保留。空态和恢复不是伪造服务器数据，页面明确内存fixture。菜单触发器始终存在，所以SDK关闭后有实际回焦目标；不存在“被删除触发器”的另一个焦点协议。

## 状态和资源归属

| 内容 | 主人 |
| --- | --- |
| open、频道数组、选择、置顶、scope、sort、locked | 应用React state |
| roving focus、typeahead、ARIA、选择事件、两层Portal、关闭/回焦 | 真实Radix SDK |
| visible排序/过滤、删除守卫、可见ID回落 | feed-policy纯函数 |
| 皮肤、焦点色、滚动高度 | 本例dropdown.css |

应用没有document级键盘监听、手写焦点陷阱、timer、Worker或订阅服务。离开Demo卸载Root/Portal子树，由SDK解除自己的焦点/关闭层资源，不清全站菜单。默认modal菜单会管理自身可交互范围，不等于已经实现Dialog。

## 迁移与边界

复制example.tsx、feed-policy.ts、dropdown.css，demo.tsx仅Lab默认重导出。保留真实独立包导入、asChild单button、受控Root、稳定业务ID、Checkbox/Radio的preventDefault和Sub的两层Portal。CSS使用公开data-highlighted/data-disabled与命名空间类，不靠私有DOM次序；焦点仍可见。

若接后端，菜单动作只发起业务操作，服务端重新校验；异步危险确认需要另一个获准组件/协议，本例不安装或假写AlertDialog。不要用onSelect或关闭动画表示服务器成功，不让两个浮层库同时拥有同一焦点/定位。没有输入框或IME路径、拖放、持久化、多语言验收或完整读屏测试。

| 常见错误 | 本例对应做法 |
| --- | --- |
| 子节点吞掉asChild注入的props/ref | 原生button，或业务封装完整转发 |
| 单选后菜单关了，文档却说一直开 | Checkbox与Radio都显式preventDefault |
| 删除后选到被筛走的行 | 当前visible集合内回落，空集合无选择 |
| disabled只是灰色样式 | SDK disabled+业务guard；生产权限归服务端 |

## 官方原文与验证范围

没有发现精确2.1.25的scoped Git tag，npm版本记录也无gitHead。公开npm SLSA provenance把该发布映射到stable构建commit **8f50071238d5d58bacf11910bf04a51c517c6299**；实际再读取该commit的目标package.json核对version=2.1.25。这里只核对公开元数据映射，没有做加密签名验证，不把它叫签名已验。

完整递归tree无官方中文README，选择目标packages/react/dropdown-menu/README.md原文106字节，本来就是文档指针，不用AI讲解替换。SHA-256 `7d715ed849386dad4615d5624cc5c694564155174c315de736c142a3f1c59317`；repo/path/version/lang/time/完整候选/provenance入口见official/source-audit.json与library.json。

官网实际GET200完整响应头保存在official/homepage-response.json，该次XFO/CSP未出现；未从Lab origin测iframe，所以unknown且保留直达，不由200推断allowed。

Node真实SDK2只覆盖React SSR下的asChild单button/ARIA，以及公开forceMount且不使用Portal的静态checkbox/radio/disabled语义；这不是当前Demo客户端Portal路径。6项policy只覆盖过滤/排序/删除/可见选择，不证明键盘或焦点。完整真实Playwright提案在validation/browser-proposal.txt，主控统一运行，正式sdk/build/browser保持NOT_RUN；实际命令和六项见local-validation.md。
