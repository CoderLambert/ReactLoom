# IMask：输入外观、业务值与语义校验

订阅配置需要固定八位编号、带分隔符的金额，以及先按日期形状输入的日历日。IMask在逐键编辑时维护格式、选区与光标；应用仍决定保存哪种值、是否完整、业务上是否有效。适合这类受约束的文本外观，自由中文备注用普通input。只有提交时才检查格式的字段，也可以先用普通输入和schema，避免引入逐键掩码成本。

固定 **imask/react-imask7.6.1**，两者MIT。核心与React无关，包装器peer声明React>=0.14，不代表每个历史组合都通过本项目验收；当前宿主React19.3。没有远程资产、后端、表单resolver或财务账本。

## 先分模型、视图和业务值

```text
实际键盘/粘贴 → InputMask视图层与选区 → Masked模型接受/格式化
  → react-imask onAccept(value, maskRef, event)
  → React业务快照 + 真实maskRef观察
```

核心`IMask.createMask`只创建模型，可在Node格式化，不产生DOM/光标。`IMaskInput`在客户端挂载时创建InputMask，连接真实input与模型；卸载时销毁自己的mask。模型测试不能证明React回调、粘贴、光标或输入法。

同一实例有三种值：`value`是带分隔符的显示串，`unmaskedValue`是去格式的文本，Number模型的`typedValue`是JS number。`unmask={false}`使onAccept第一参选value，true选unmaskedValue，`'typed'`选typedValue。这个选择不会改变另外两种getter的含义。

```tsx
<IMaskInput type="text" inputMode="numeric" mask="0000-0000" unmask={true}
  onAccept={(value, maskRef) => {
    // value为业务数字串；另外观察真实实例的显示串。
    setRaw(value);
    setSnapshot({value: maskRef.value, unmaskedValue: maskRef.unmaskedValue});
  }} />
```

本例**没有传value属性**：SDK拥有masked输入DOM/光标，React只观察onAccept，事件快照不再反写input.value。中文备注才是普通受控文本。若迁移为value受控模式，值必须与unmask同一种形态；不要一边传显示串、一边把unmasked串当相同合同，也不要在onChange里slice或手工赋DOM值。

## 目标一：编号的显示、数据与中间编辑

basic输入`12345678`：预期input显示`1234-5678`，当前业务值是`12345678`。末次快照从真实回调的maskRef读取value、unmaskedValue、typedValue、masked.isComplete；null代表尚无事件，不是预置成功数据。

把光标移到第三位后删除，再插入数字，观察同一输入DOM继续使用、业务值与格式同步。非数字可能被模型跳过，因此accept计数不是按键次数；完整Pattern触发complete也不表示编号真实或可被业务使用。

点击“重置当前控件”才清本轮快照/计数并增加generation重挂input。普通accept绝不换key。场景外层key=level使切换后不会出现新空DOM配旧编号输出；重置和切换会销毁旧SDK实例，不承诺保留焦点或草稿。

## 目标二：金额外观与实际数值

business使用Number模型、radix='.'、scale=2、thousandsSeparator=','，仍用text输入与decimal键盘提示。输入`1234.50`并离开控件，默认normalizeZeros=true、padFractionalZeros=false：模型提交后显示可为`1,234.5`，unmaskedValue为`1234.5`，typedValue为number1234.5。输入过程中允许小数点、负号等中间态，事件快照与blur提交后的值可能经历变化，以真实input和末次事件为准。

scale限制小数输入外观，不意味着保存一定有两位。开启padFractionalZeros可以补显示零，但unmaskedValue仍可能归一化成`1234.5`；本例没有这个切换。typedValue依然是二进制浮点，财务计算另定十进制字符串或整数分合同，不能因为画面有两位就直接当精确账本。

Number模型的isComplete/complete不适合作“固定格子填满”或付款成功信号；观察三种值即可理解格式与数值边界。模型不会发保存请求。

## 目标三：填满的日期与真实公历

advanced是普通Pattern `0000-00-00`，并非SDK的Date模型；unmask=false使业务快照保留分隔符。输入`2026-02-30`：Pattern可以填满，isComplete可为true，但自建validCalendarDay必须判为不存在；`2024-02-29`则通过。空串显示“尚未填写”，不足10字符允许继续输入，不把每个合法前缀都当最终失败；只有完整但无效日期设置aria-invalid。

calendar-policy.mjs保持UTC日历回读：先拒非四位年/越界月日/0000，再用setUTCFullYear并回读年月日，避免Date.UTC把0–99年映射成1900年代。它只验证日历日，不提供时间、偏移或跨时区语义。

旁边中文备注不套数字mask。compositionstart/end只显示组合状态，blur清观察状态，没有提交快捷键；本例不会过滤候选文字。浏览器合成CompositionEvent只能验证应用事件协议，不等于操作系统中文候选窗口、移动设备键盘或剪贴板已验收。

## 迁移、重置与清理

复制五个sourceFiles：example.tsx、calendar-policy.mjs、calendar-policy.d.mts、styles.css、demo.tsx（仅重导出）。保留声明让TS能导入mjs；样式局部border-box、最大宽度、换行和焦点不依赖Lab全局reset，没有Lab alias或远程资源。

mask字段一律type=text；number/date原生类型的选区接口不适合这条SDK视图路径。inputMode只是键盘提示，不是校验或设备运行证明。inputRef用于真实input，组件ref是包装器/内部mask入口，不能混用。

实际react-imask7.6.1卸载调用destroyMask→InputMask.destroy，解绑自己的八种直接view DOM监听并移除el引用。它没有主动取消已排的10ms光标任务；任务晚到由if(!this.el)return跳过。内部_listeners是对象，length=0也不等于删除accept/complete各键；本例只存值快照，不长期持有maskRef，不承诺卸载立即清空所有内部订阅/任务。应用无自建timer/全局listener，只卸载自己的子树，不全局删事件或伪造输入清理。真实光标/撤销/粘贴、完整资源普查与SSR hydration仍需对应环境验证。

Pattern和Number是不同模型；不要依赖updateOptions在原实例硬换类型。这里通过场景key更换实例，reset才增加输入generation；中间按键保持节点。服务端回填、RHF、async请求取消、持久化都未接入，需要独立定义所有权和冲突规则，不能从这三个演示推断已实现。

## 官方资料与验证边界

匹配7.6.1的React包README与核心包README分别保留原始快照；固定repo/commit/path/语言/日期/摘要、中文候选检查及完整官网响应证据见official/source-evidence.json与library.json。中文教学在本页，不翻译覆盖原文；未在真实Lab origin确认的官网只记unknown，若响应明确跨源限制则blocked。

原模型SDK3与新增日期模型对照、calendar纯策略分开记录；它们都不证明真实React输入。完整三个真实浏览器提案由主控匹配候选执行，无SDK mock；正式verification保持NOT_RUN。具体命令、来源与六项状态见local-validation.md。

窄屏迁移保留容器的overflow-wrap:anywhere：连续API名称也必须可断行，不能用隐藏溢出来截掉说明。
