# nuqs：让订阅筛选能分享、刷新和返回

RSS列表要让同事打开同一组筛选，刷新后也不丢页码，还要能用浏览器返回。React state适合输入草稿，URL适合已经应用、可公开分享的短筛选。nuqs提供parser、React hook、默认值和URL更新队列；应用仍需决定范围、历史策略和列表数据。本例的5条订阅是本地fixture，没有HTTP、Query缓存或后端。

实装nuqs2.10.1/MIT，Lab使用TanStack Router。三个场景都实际调用useQueryStates，复用同一份parser与ll_c19_键映射；只读URL不需要为默认值主动改写地址。令牌、长文草稿和服务端错误不应写进可分享URL。

## 从输入到地址栏

```text
输入草稿（可有未确认中文/尾随空格）
  → 应用筛选：清洗词、分组白名单、重置页码
  → 单次useQueryStates更新，SDK状态可先变化
  → SDK队列调用真实Router adapter，地址栏提交
  → 回退/前进读取URL，再同步非组合中的草稿
```

页面同时显示实际useLocation.searchStr、SDK解析结果、业务过滤/夹取后的结果。它们各有含义：setter的Promise结束不代表服务器保存、网络完成或路由loader已经结束，测试也要等实际URL，不凭“队列结束”文字判断地址已经正确。草稿变化不立刻写URL，直到应用或普通Enter提交；改分组同样先是草稿。

[query-contract.mjs](examples/query-contract.mjs)定义parseAsString空词、parseAsInteger页码1、分组all及urlKeys；UI和Node直接共用。nuqs/server提供不依赖React hook的同一批parser/loader/serializer，名称不表示本例运行了服务器。真实createLoader/createSerializer只在SDK验证中检查默认值与映射往返，页面本身用真实hook。

## 三个独立实验

| 目标 | 操作 | 应观察的结果 | 关键源 |
| --- | --- | --- | --- |
| basic：查询与分享 | 输入“React 官方”，确认尾随空格能继续编辑，再应用、刷新、清除 | 未应用时URL和列表不变；应用后仅一条React源，刷新可恢复；清除仅删实验键 | [示例](examples/example.tsx)、[共享parser](examples/query-contract.mjs) |
| business：联合筛选与分页 | 先下一页，再选择技术/输入部署并应用；试空结果再清除 | query/group/page同一调用提交，页码回1；空态禁翻页；业务翻页replace | [业务策略](examples/url-policy.mjs) |
| advanced：历史与深链接 | 连翻两页、Back/Forward；应用查询；打开abc/99/2tail链接 | 翻页push，应用replace；返回恢复输入/列表；SDK解析与业务夹页不同，非法原始URL不隐式改写 | [兼容adapter](examples/tanstack-adapter.tsx)、[示例](examples/example.tsx) |

## 一个调用提交关联参数

在现有TanStack Router的页面组件中，用本例的兼容provider包住调用hook的子组件；provider自己也读取Router上下文，因此应位于Router内部。实际入口如下：

```tsx
import { TanStackNuqsAdapter } from './tanstack-adapter'

export default function NuqsExample({ level }: Props) {
  return (
    <TanStackNuqsAdapter>
      <QueryWorkshop key={level} level={level} />
    </TanStackNuqsAdapter>
  )
}
```

子组件从共享合同导入queryParsers和URL_KEYS。用户应用“技术”分组时，输入是当前草稿和分组，处理是清洗查询并清除旧页码，结果由一个setter同时提交：

```tsx
const [state, setState] = useQueryStates(queryParsers, {
  urlKeys: URL_KEYS,
  history: 'replace',
})

// 一次应用同时提交筛选并清页码；调用级选项覆盖本次各parser。
void setState({ query: clean || null, group: 'tech', page: null }, {
  history: 'replace',
})
```

缺失键由withDefault提供状态默认值；显式null删除键。withDefault读取时不替你清理非法/冗余URL，clearOnDefault则控制后续写入默认值是否删键。清除实验参数传null给整组setter，保留tab、example及外部参数。ll_c19_是命名空间，避免和宿主已有键碰撞；不同名称的q本身不会“变成tab”，仍需正确保留整份URL。

SDK整数parser内部是parseInt：abc失败后用默认1，但2tail会读成2，负数也是可解析数。随后deriveSearchView才清洗查询、筛分组、过滤、算页数并夹到范围。basic忽略残留group并展示全部matches，不用隐藏分组偷偷过滤。5条数据每页2条，最多3页；99显示第3页，但原99保留在URL，只有后续明确操作才写入新值。

sanitizeQuery保留原有去ASCII控制字符、trim和80码点上限，用于应用及视图两边；它不是鉴权，也不保证按字素簇截断。名称包含比较不意味着要小写path或业务ID。不要把原始999页发给后端再期望nuqs自动修业务范围。

## history与当前版本的必要兼容桥

本例一次应用/清除都请求replace，仅advanced翻页请求push。nuqs同批队列里push优先，因此不要让搜索重置页码时继承另一个parser的push；统一调用级选项能避免本例混合策略。多个其他写者若共享同一队列仍要协调，不把这当跨组件事务保证。

本例版本组合是nuqs2.10.1、@tanstack/react-router1.170.42及其@tanstack/router-core1.171.35。[tanstack-adapter.tsx](examples/tanstack-adapter.tsx)是**示例自己的兼容集成**：完整带查询的URL用公开navigate的href入口，交Router自己的parseHref/parseSearch处理；to用于路径/路由模板，不能把整段查询当路径。直接Object.fromEntries后传search也不等价，Router默认JSON序列化可能把数字字符串2编码成带引号的字符串。

桥通过nuqs公开的unstable_createAdapterProvider接入真实hook/队列，使用公开Router状态读取并展开数组；外层保留真实内置NuqsAdapter的HistorySpy，因此Back/Forward/GO队列重置和订阅清理由原SDK执行。公开defaultOptions/processUrlSearchParams透传，state/hash/replace/resetScroll保留；不私有导入context/resetQueues，不改全局router、依赖或锁。unstable_AdapterContext只是导出类型，不是可读取的Context对象。

Router可能把host=a&host=b规范化成JSON数组编码，逻辑数组和顺序保留，原始query字节不保证相同。读取端按Router数组展开给nuqs；不绕开Router或自改公共stringifySearch。请把这份桥连同本例一起迁移；升级任何一方后重新核公开接口、历史和真实URL，不能宣称内置adapter在这个组合里已正常工作。

## 草稿、IME与生命周期

组合期间只改draft，不让URL回填覆盖正在组合的输入，也不提交筛选。确认Enter保持到keyup，compositionend不无条件吞下下一个普通Enter；Space/鼠标确认后普通Enter仍可应用。输入框不在onChange中trim，用户可以继续输入空格后的词。浏览器返回在非组合时把已解析值写回草稿；组合中的新草稿保持待应用，不自动覆盖URL。

组件自己的异步回调只有setter Promise状态提示，alive/generation只阻止卸载或过期回调写React state；这不是取消SDK全局URL队列。SDK管理限速timer/历史订阅，Back重置由真实HistorySpy执行，应用不能全局reset其他使用者。卸载不清URL，重新运行恢复URL筛选、丢弃未应用草稿；清除URL必须是用户明确操作。合成composition不是系统IME，DOM断开也不是全部SDK缓存/队列泄漏证明。

## 迁移与取舍

复制sourceFiles全部8源：example/demo、tanstack-adapter.tsx、query-contract.mjs/.d.mts、url-policy.mjs/.d.mts、styles.css。安装nuqs2.10.1并提供同一真实TanStack Router上下文，不能用Next adapter或React-only adapter替换。SDK peer要求React>=18.2或19及TanStack Router ^1，当前版本已strict核对；本例没有SSR/hydration接线，也没有服务器缓存/请求隔离实现。

URL不是权限边界，SSR或服务端请求仍要重新验证业务参数；接Query时用已应用的有效条件作key，草稿不触发请求。多参数原子持久化、后端保存/并发、设备时区都不属于此演示。这里不加载外部资产，也不注册应用timer、网络、Worker或全局监听；SDK/provider的清理按自身所有权处理。

## 官方原文与官网

[官方根README原文](https://github.com/47ng/nuqs/blob/691a473226bba0ddb93bc3a1010c8fa4e777c45f/README.md)固定npm2.10.1 gitHead691a473226bba0ddb93bc3a1010c8fa4e777c45f，包目录packages/nuqs没有README，匹配范围无中文README，因此回退根英文原文。31845B/SHA256 de5eb7cbf51d0a8c0eecd79146a7e61e6dadfbd0132f3f26a73f91fa569d66eb，和安装包README逐字节相同。源码manifest真实写0.0.0-semantically-released，安装/发布为2.10.1，按npm gitHead绑定，不伪造一致。

[官方首页](https://nuqs.dev)由目标包与原文确认；实际GET200，原始rawHeaders中无XFO/CSP限制，但未从Lab origin确认iframe可用，因此unknown。日期、最终URL、原始列表、匿名cookie摘要处理及5次请求保存在条目维护证据；README未翻译/改写。官网展示和SDK运行分别验收，不能据HTTP200、load或原文存在标allowed。
