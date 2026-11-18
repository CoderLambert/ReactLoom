# 用 Base UI 连接复选框交互、混合态与表单数据

假设订阅工作区需要配置“阅读、评论、管理”三项权限，并沿用团队自己的视觉设计。Base UI提供无样式React交互原语：它处理复选框语义、键盘与表单input，应用负责状态、样式和权限规则。若只是一个普通勾选框，原生input通常足够；需要统一的可组合原语与设计系统时再引入。想直接获得完整后台外观，应比较Ant Design、MUI或Mantine。

本例固定 **@base-ui/react 1.9.0**，React/React DOM 19.3.0；实际包peer允许17、18、19，许可证MIT。它不是旧`@mui/base`，也不是Uber的`baseui`。当前只操作Checkbox，不把其他原语的API混进来。

## 先理解Root、Indicator与两个状态

```text
外层label ──点击文字──→ SDK生成的原生checkbox input
Checkbox.Root（可聚焦span，role=checkbox）
  └── Checkbox.Indicator（勾/减号的视觉内容）
  旁侧input（type=checkbox，CSS隐藏，保留name/value/checked/disabled）
                  ↓ 浏览器原生FormData
onCheckedChange(boolean, details) → React编辑状态 → checked/indeterminate props
```

Root默认不是button。库通过可聚焦span承接辅助技术与键盘，把动作转给旁侧的原生input；不要再给Indicator添加点击处理或自己接管Space。隐藏指CSS视觉隐藏，并不是把控件改成`type="hidden"`。外层label让文字成为操作区域，完整源码还显式关联input的id/htmlFor；可访问名字只含稳定标签，计数与状态另行呈现。

`checked`是布尔编辑值；`onCheckedChange`第一参也**始终是boolean**，第二参为事件详情，不会回传`'indeterminate'`。混合态由独立`indeterminate` prop控制：SDK让Root呈现`aria-checked="mixed"`，并在布局effect写入原生input的`indeterminate`属性。它与checked独立，不能只换一个减号字符假装混合态。

Indicator只负责视觉：选中或混合时显示，本例的✓/−设为aria-hidden，读屏通过Root状态理解结果。项目CSS使用`data-checked`/`data-indeterminate`/`data-disabled`与`:focus-visible`，不清除全局焦点轮廓。

## 最小受控接入

```tsx
import {Checkbox} from '@base-ui/react/checkbox';
import {useState} from 'react';

function Preference() {
  const [checked, setChecked] = useState(false);
  return (
    <label>
      <Checkbox.Root checked={checked} onCheckedChange={setChecked}>
        <Checkbox.Indicator aria-hidden="true">✓</Checkbox.Indicator>
      </Checkbox.Root>
      接收工程更新摘要
    </label>
  );
}
```

该片段展示状态通路，完整外观与诊断在[实际组件](examples/example.tsx)、[样式](examples/checkbox.css)。没有给出受控checked时可用defaultChecked，但不要在同一个实例上来回切换两种模式。库负责交互，React state仍是当前编辑值。

## 实验一：标签、Space与真实input

打开基础实验，初始未勾选。点击“接收工程更新摘要”文字，应切到已勾选；聚焦该控件并按Space，应切回来。状态文字与ARIA应同步，控件有可见焦点环。

点击“读取实际输入”，读数通过SDK的`inputRef`取得真实DOM属性：checked反映当前值，tabIndex=-1说明隐藏input不重复占用Tab顺序；有焦点的交互面是Root。本例基础层没有form/name，所以不宣称已经提交数据。读数是点击时快照，编辑后清除旧快照。

## 实验二：从部分选择到完整FormData

业务实验初始仅选`read`，父项为混合态。点击“全选 / 取消全选”，应用把可选id写入React数组，Root显示全选；再点一次清空。手工取消某个子项后，父项应回到mixed。

这里的父项是**应用自己计算**的摘要：`permissionSummary`返回checked、indeterminate和分子/分母。我们没有使用CheckboxGroup，所以不传仅适用于该分组协议的`parent` prop。父项不带name，只有三项子控件带`name="permissions"`及各自value，因此它不会成为第四个提交值。

点“提交本地 FormData”，代码直接读取：

```tsx
const ids = new FormData(event.currentTarget).getAll('permissions').map(String);
```

全选应得到`["read","comment","manage"]`，清空应得到`[]`，部分选择只包含实际勾选值；不是中文标签或React数组的手写副本。这是浏览器本地收集，没有网络POST。1.9.0源码也让表单内Checkbox的Enter请求提交，而非切换勾选；实际键盘与表单行为仍需浏览器验收。

## 实验三：禁用权限与提交快照失效

高级实验先全选并提交，再勾“锁定管理订阅”。这一刻应用做两件事：策略移除manage，Root同时disabled。父项分母由3变2，当前read/comment全选时仍应checked，而不是永远mixed。锁定会清除上次提交输出和input读数，避免继续把旧结果当成当前配置。

再次全选或点击禁用的管理项，都不能把manage写回来；提交只含read/comment。点“读取实际输入”可核对manage.disabled=true、父项checked/indeterminate与当次FormData。解锁只恢复可编辑能力，**不自动恢复之前的管理权限**；再手工勾选才能进入提交值。

`eligiblePermissions`、`normalizePermissions`、`changePermission`是本地业务策略，不是Base UI授权能力。浏览器的disabled input不属于成功表单控件，即使持有value也不提交；本例另行规范化React数组以保持UI和规则一致。生产服务端必须按当前身份重新计算权限，不能信任客户端禁用、数组或FormData。

## 迁入项目与所有权

复制四个sourceFiles：[demo.tsx](examples/demo.tsx)是出口，[example.tsx](examples/example.tsx)、[permission-policy.ts](examples/permission-policy.ts)与[checkbox.css](examples/checkbox.css)提供实现、业务规则与必要样式。安装`@base-ui/react@1.9.0`并满足React/React DOM peer；Checkbox不需要包的可选日期依赖或外部资产。没有Lab内部alias、全局CSS主题或自建服务器。

样式有`rl-base-`前缀；整行label至少44px高，焦点环写在真实可聚焦Root上。多个实例用React useId关联各自标签/input，避免互相控制。inputRef只读取DOM，不改checked或伪造事件；SDK管理自己的监听与input，React ref在控件离开时解除。本例没有timer、全局监听或存储需要自行清空。

组件没有渲染期window/document读取；SSR的真实SDK检查只确认HTML输出。交互应用仍需要客户端边界和hydration，未在本条验证完整SSR宿主。不要从SSR的aria-checked=mixed推导原生indeterminate属性已执行，它由客户端布局effect设置。

## 官方资料与验收边界

官方原文为固定v1.9.0提交`ad7ecda5296b0295b41a51ecb01fce6204acd099`的`packages/react/README.md`，与该commit包声明1.9.0匹配。实际列出的根/包目录仅有英文README，保存未翻译的1856B原文；候选、完整响应头、日期与SHA在`official/source-evidence.json`，元数据在library.json。

包声明官网`https://base-ui.com`实际GET200，同时返回XFO SAMEORIGIN与CSP frame-ancestors *。现代浏览器以CSP的祖先策略为准，不能只看XFO记blocked；本次没有从Lab origin确认iframe内容，因此状态**unknown**，保留官网直达与重试。

局部真实SSR测试验证SDK渲染的role/mixed/原生input属性；原六项policy验证权限计算。它们不证明label点击、Space/Tab、DOM indeterminate或实际FormData。三条真实浏览器提案与命令、日志见[local-validation.md](local-validation.md)；正式sdk/build/browser没有匹配收据仍NOT_RUN。

- [匹配官方源码](https://github.com/mui/base-ui/tree/ad7ecda5296b0295b41a51ecb01fce6204acd099/packages/react/src/checkbox)
- [官方Checkbox文档](https://base-ui.com/react/components/checkbox)
- [官方表单指南](https://base-ui.com/react/handbook/forms)
