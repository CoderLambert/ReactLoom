# React Aria：输入文本与频道身份分开

用户想从RSS频道中搜索、用键盘选项，再把稳定id提交到表单。输入“React”只是查询草稿，不等于已经选择频道。React Aria Components负责组合框、列表框、弹出层与键盘/ARIA状态；应用负责过滤、禁用业务规则、异步数据和最终确认。需要设计系统自己的外观又愿意写CSS时适合它；固定少量选项可先用原生select。安装本库不等于整站WCAG或读屏验收通过。

固定 `react-aria-components@1.21.0`，Apache-2.0，宿主React19.3.0；安装peer覆盖React/ReactDOM16.8、17、18、19系列，不表示这些组合均已测试。样式与频道fixture为本地原创，没有HTTP、字体下载或第三方素材。

## 模型：三个值各有职责

```text
Input原始字符串 → 应用过滤 / 本地延迟查询 → ListBox候选
ListBoxItem.id → selectedKey              显示文字 → textValue/name
selectedKey + 完整名称匹配 → confirmedChannel → FormData.channel的id
```

展示名称可改，id应稳定。`selectedKey`与`inputValue`分别受控；应用在选中有效项时同步完整名称；SDK的null选择通知只清身份，不清文本。输入改变时清除不再匹配的旧key，用户明确点击“清空选择”、按Escape撤销未确认文本或切换场景时才清文本；否则异步候选变化带来的null回调会覆盖刚键入的新查询。提交同时核对业务确认和真实FormData的channel，避免半输入还提交旧身份。

**匹配版本的接口事实**：1.21.0仍兼容selectedKey/onSelectionChange，但其依赖react-stately3.50.0已经将这两个属性标deprecated，并支持value/onChange。本例保留有效兼容实现，不能再说value/onChange是此版本不存在的API。新项目可按匹配类型选择新接口；不要混控两套选择属性，inputValue仍是独立文本。

## 目标一：键盘选择与真实表单

打开“键盘选择与频道身份”。四个固定候选：React组件工程、后端架构实践、开源趋势、国际新闻。输入React，按ArrowDown/Enter选择，或点“显示可选频道”后选择。Escape沿SDK revert撤销未确认查询并关闭弹层（身份已清时回到空串；已有有效选择则恢复其名称），焦点保持输入；点击“提交真实表单”应显示 `真实表单选中频道 ID：react`。

```tsx
<ComboBox name="channel" selectedKey={selectedKey}
  onSelectionChange={select} inputValue={inputValue}
  onInputChange={changeInput} allowsEmptyCollection
  defaultFilter={() => true}>
  <Label>选择 RSS 频道</Label>
  <Input aria-describedby={hintId} />
  <Button aria-label="显示可选频道">展开</Button>
  <Text slot="description" id={hintId}>使用方向键选择</Text>
  <Popover><ListBox items={items}>{renderItem}</ListBox></Popover>
</ComboBox>
```

Input只在非组合输入的Escape捕获阶段同步这份受控文本，随后仍让SDK执行revert/关闭/焦点；不拦事件，不用全局键处理或手动open状态。若null通知一律保留文本却不参与SDK的撤销契约，SDK关闭后的自动打开effect会重新开菜单。

`name`默认按key而非文字生成隐藏表单input；服务端静态HTML测试检查了真实SDK的两份值，但真实键盘/表单交互仍需浏览器。描述id由React useId每个实例生成，不使用固定全局id。SDK管理组合框焦点、aria-expanded/controls/activedescendant与选中公告；没有手写全局方向键逻辑。

展开“查看受控状态与候选”直接看React状态和传入的候选id。选择后把文本改成半个名字再提交，结果应被拒绝；“清空选择”把文本和身份一起清掉。确认不把中文名当外键，也不靠输入框有文字就算成功。

## 目标二：分类查询与禁用项

打开“分类过滤、禁用与表单确认”。完整七项可按名称或分类过滤；输入“技术”，React、后端、开源和安全通告都应出现。过滤用trim+zh-CN locale大小写匹配，原始输入state不trim。禁用的“安全紧急通告”可见，SDK isDisabled阻止交互；应用确认函数也再拒绝禁用id。

`defaultFilter={() => true}`关闭SDK内部二次筛选，实际items由应用产生，否则分类命中却名称不命中的行可能又被删掉。`ListBoxItem id/textValue`分别提供身份与可读文字。输入无匹配词会看到真正ListBox的“暂无匹配频道”（SDK可把空态容器暴露为一个占位option，真实数据候选应以visibleIds=[]确认，不能按role option总数当业务数量）；显式allowsEmptyCollection允许空集合仍开弹层，默认行为会关闭空列表，只有renderEmptyState不足以保证空态可见。

清空恢复全表。选中合法频道后原生FormData提交id；候选被禁用或输入与完整名称不一致都不能确认。只有前端本地规则，没有授权服务或后端订阅。

## 目标三：异步结果先对齐，再展示

advanced在focus时尝试打开列表。输入改变立即显示“正在查询本地数据…”，候选先空；240ms后只显示与当前输入对齐的结果。这个setTimeout是明确的本地fixture，不是网络请求或性能指标。

```ts
const id = ++generation.current;
const controller = new AbortController();
const timer = setTimeout(() => {
  if (controller.signal.aborted || generation.current !== id) return;
  // 写入查询结果、对应query和busy=false
}, 240);
return () => {
  clearTimeout(timer);
  controller.abort();
  generation.current++;
};
```

`busy || resolvedQuery !== inputValue`时queryRows返回空集，旧候选不会在新输入后暂留。快速从React改到开源，只能看到最后查询；清空或卸载也会使旧代际失效。AbortSignal在此是本地取消标记，定时器并不自动遵守signal，clearTimeout和代际比较各有职责。接真实API时仍须传signal并处理服务端失败，本文没有实现网络错误/重试。

Input的compositionstart/end只记录当前是否组合；submit在组合期间直接返回。Enter如何导航/确认仍由真实SDK与浏览器处理，不加吞下一次Enter的额外守卫。自动化的合成composition事件只验证此应用guard，不等于OS输入法候选框通过；真实中文输入法/触摸/读屏需另验。

## 迁移和所有权

复制四个sourceFiles：example.tsx、channel-policy.ts、combobox.css和demo.tsx（仅重导出）。真实运行代码和展示源码相同，无Lab alias。Popover物理Portal不依赖父节点CSS后代选择器，专用全局前缀类仅为该浮层服务；SDK提供定位、碰撞与交互状态，应用CSS负责可见外观、焦点提示和窄屏最大宽度。没有额外动画。

应用拥有受控状态、240ms timer、AbortController与代际；cleanup同时清timer/abort/推进代际。React Aria拥有Popover/集合/输入焦点及自身监听，卸载自己的React子树即可，不能清全局SDK资源。公共level prop变化也重置身份和文本，迁出Lab后依然有效。SSR静态标记不代表hydration、Portal和设备交互已通过；旧兼容属性升级时应连同类型/表单行为一起核对。

## 原文与验收范围

精确npm1.21.0和安装gitHead均为 [`0a2a7e68`](https://github.com/adobe/react-spectrum/blob/0a2a7e68e4d896b3ac46c3647fe48fac9ea3ae2e/packages/react-aria-components/README.md)。实际递归tree有246个README候选、未截断、无官方中文，优先目标包英文原文1915B；完整原文与版本/语言/时间/sha及五个HTTP请求的完整头保存在official和library元数据。本地中文讲解与原文分开。

官网此次GET200的enforced CSP为 `frame-ancestors 'self'`，限制跨源Lab嵌入，标blocked并保留直达；这不是网络未知或浏览器allowed。没有放宽公共frame-src。

本地真实SDK2项验证兼容/新选择属性的SSR key、受控文字和实例描述关系；纯策略4项验证过滤/业务确认/查询对齐，二者不证明Portal、IME或键盘运行。实际日志/六项与未测见local-validation，完整真实浏览器提案在validation/browser-proposal.txt，主控匹配构建运行；formal三项NOT_RUN。
