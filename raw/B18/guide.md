# 用 cmdk 把搜索、高亮和本地命令执行接起来

新闻工作台需要一个键盘入口：输入“收藏”找到“稍后阅读”，用方向键与Enter执行，再观察文章状态。cmdk提供无样式命令菜单，负责检索、排序、当前高亮与ARIA关系；应用负责命令数据、执行结果、样式和业务许可。它适合少量工作台命令，不替代搜索服务、授权或虚拟列表；只需要一个普通下拉选择时，原生控件可能更简单。

本例固定 **cmdk 1.1.1 / MIT**，宿主React/React DOM19.3.0，包peer覆盖18/19。实际安装的Dialog依赖解析为Radix1.2.0，焦点与门户边界按该实际源码核对。旧pacocoursey/cmdk官方入口已重定向dip/cmdk；官方原文来源独立保存，不把新主分支API套给旧包。

## 先分清查询、身份与执行结果

```text
Command.Input文本 → cmdk默认filter(value, search, keywords)
                                  ↓ 匹配分数/排序
Command.List → Group → Item（稳定value）→ 当前高亮
                                  ↓ Enter或点击
                             onSelect → 应用更新文章fixture
```

Input的value是查询文本；Item的value是唯一命令身份；Command根自身的value若受控，表示当前高亮身份。这三者不能复用一个state。本例Input受控，Item使用save/read/copy/refresh/delete固定id，中文标签与快捷词放进keywords。修改说明或翻译标签不会把命令身份改掉。

默认过滤按value与keywords打分并排列匹配项，0表示不匹配；它不自动提供拼音、远程检索或虚拟化。若服务端已完成过滤/排序，才使用shouldFilter=false并自行控制候选；当前示例使用真实默认过滤，没叠第二套搜索。

List必须包住候选。Group在过滤后可隐藏，不必卸载整个组；Empty由库的匹配数决定。disabled项可能仍是搜索结果，但不能高亮执行。Root拥有内部label，Input据此建立aria-labelledby与List/active descendant关系；不是手写几个aria属性就能代替这个通路。

## 最小接入

```tsx
import {Command} from 'cmdk';
import {useState} from 'react';

function ReadingMenu() {
  const [saved, setSaved] = useState(false);
  return <>
    <Command label="文章命令搜索">
      <Command.Input />
      <Command.List>
        <Command.Item value="save" keywords={['稍后阅读', '收藏']}
          onSelect={() => setSaved(value => !value)}>
          稍后阅读
        </Command.Item>
      </Command.List>
    </Command>
    <p>{saved ? '已加入稍后阅读' : '尚未加入'}</p>
  </>;
}
```

这是最小结构，样式与完整控制在[真实组件](examples/example.tsx)和[必要CSS](examples/styles.css)。不要省List，也不要依赖混入描述文本的textContent推断身份。

## 实验一：搜索词与高亮身份是两回事

基础层只挂三条阅读命令。输入“收藏”，实际SDK应只留下“稍后阅读”；下方读数search是查询，selectedId是save，resultCount是匹配数。方向键在可用选项中移动，Enter执行；选择后查询清空，稍后阅读状态切换，再执行一次可取消。

读数来自真正的useCommandState，不是应用自己过滤actions后算长度。三个selector分别取原始search、value、filtered.count；它们返回稳定的原始值，避免每次生成新对象破坏useSyncExternalStore快照稳定性。它表示当前高亮，不表示最后执行过哪条命令；业务结果仍以下方文章为准。

## 实验二：分组、快捷词和禁用动作

业务层新增管理组。搜索RSS，匹配“模拟刷新订阅”，按Enter只增加本地refreshCount。搜索“引用”，执行“生成本地引用”，下方citation变成固定演示字符串；**不调用Clipboard API**，没有“复制成功”的假反馈。标记已读是单向动作，稍后阅读可切换。

搜索“删除”，危险命令可以作为禁用候选出现，但Arrow/Enter和点击均不能执行。SDK通过disabled控制交互，select再拒绝disabled/delete；匹配数包含这个候选，不等于可执行数量。应用层许可始终是自己的责任，生产命令还需要服务端授权；本例只有不可写用户数据的内存fixture，没有HTTP。

## 实验三：Dialog、热键与IME所有权

高级层使用真实Command.Dialog。点按钮或在非编辑控件处按Ctrl/Cmd+K打开，输入应获得焦点；同一组合、Escape、关闭按钮或外层遮罩可关闭。关闭后，在焦点无人接管时归还打开它的控件；若用户已明确转到别的控件，不再抢回。例内“面板外编辑框”用于验证关闭状态下热键不抢编辑。

Dialog组合有三个不同样式入口：className给内部Command根，**contentClassName给门户内容，overlayClassName给遮罩**。把定位样式写在className上再匹配cmdk-dialog并不会命中外层。CSS使用rl-cmdk前缀，门户也必须加载同一份样式。

cmdk默认的Ctrl+K属于vim风格“上移高亮”，不是自动打开命令面板。高级层显式vimBindings=false，把这个组合交给唯一的document监听；内联场景保留库默认行为。监听放过已被其它处理器消费的事件、修饰冲突、可编辑目标和IME组词。对自己拥有的组合，长按repeat仍阻止浏览器默认搜索但不重复切换；离开高级层/卸载时成对移除。

1.1.1内置键盘处理已经拒绝native isComposing/keyCode229，但应用的全局热键与部分浏览器compositionend先于确认Enter的次序仍需自己处理。本例：

- compositionstart进入保护；compositionend再保留**80ms尾随窗口**，避免确认候选的Enter触发命令。
- Enter/Space抬键、组词外普通输入或blur清除尾随状态；即使没有keyup，窗口到期也允许下一次正常Enter，不会无限锁住。
- Input捕获阶段只在需要时阻止确认Enter进入cmdk；候选协议测试不等于真实操作系统IME已验收。

焦点没有重复套一层FocusManager。Radix拥有modal焦点约束；cmdk的Dialog未暴露Content的onCloseAutoFocus，外置触发器也不是Radix Trigger。应用在open变false后排一个可清理的0ms归还任务，等实际FocusScope关闭清理完成，仅当焦点落在body/已离开节点且原目标仍连接时恢复。重新打开、场景离开或卸载会取消任务，不能用选择回调里的queueMicrotask承诺所有关闭路径都正确。该边界依赖实际Radix版本，升级需回归。

## 迁移与实际限制

复制library.json列出的五源：[demo.tsx](examples/demo.tsx)、[example.tsx](examples/example.tsx)、[styles.css](examples/styles.css)、[keyboard-policy.ts](examples/keyboard-policy.ts)、[command-state.ts](examples/command-state.ts)，安装cmdk1.1.1与兼容React/DOM。不导入.pnpm内部路径，不另加一套Radix实例或全局主题。迁到Next等SSR宿主时放在客户端组件边界，不能当成纯Server Component；基础SSR结构检查不等于完整hydration或Dialog已运行。

React拥有动作数组、查询、打开状态和文章fixture；cmdk拥有列表检索/DOM排序/高亮，Radix拥有Dialog内部监听。应用只清理自己的document监听、焦点timer与IME状态，不清整个页面。CSS支持候选滚动与门户视口限制，但没有大列表/触摸/读屏性能保证。完整SSR hydration未验收；Node SSR检查仅能证明基础HTML形状。

原文来自官方v1.1.1固定commit `fb4ea04e9ec211777fbb39c6104e3c5f2ee107d2`的根README.md。目标cmdk包目录没有README，完整tree的官方候选无中文，因此保存原英文14036B；commit里的包声明同为1.1.1。完整响应头、重定向、候选、时间与SHA在official/source-evidence.json，原文字节未翻译改写。

包声明主页的旧GitHub地址实际跳到dip/cmdk；最终响应XFO deny和强制CSP frame-ancestors none，官网状态blocked，提供官方直达。旧独立站入口目前同样跳回仓库，不假装存在可嵌入演示站。

真实SDK局部检查运行默认filter与React SSR；policy只检查业务和键盘规则。实际过滤/高亮、Dialog焦点/门户、原生快捷键、IME事件协议与卸载由主控按[完整提案](validation/browser-proposal.txt)验收，尚未运行时保留NOT_RUN。实际命令与六项见[local-validation.md](local-validation.md)，正式sdk/build/browser不从局部或共享CI推导PASS。

- [匹配官方原文](https://github.com/dip/cmdk/blob/fb4ea04e9ec211777fbb39c6104e3c5f2ee107d2/README.md)
- [匹配1.1.1源码](https://github.com/dip/cmdk/blob/fb4ea04e9ec211777fbb39c6104e3c5f2ee107d2/cmdk/src/index.tsx)

关闭控件只拦截会传给Command根并引起选择的激活/导航键；Ctrl/Cmd+K仍由应用document监听拥有，Escape由SDK的capture监听拥有，Tab继续交给焦点系统。原生Enter关闭不应顺便执行高亮命令。
