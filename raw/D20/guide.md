# MiniSearch：为本地文档建立可更新的全文索引

RSS 阅读器需要同时搜索标题与正文、容忍英文错拼，并在分类切换后只显示当前范围的建议。MiniSearch 为内存文档建立倒排索引，查询词对应包含它的文档，再按相关性排序。本例固定 minisearch@7.2.0（MIT），真实SDK在浏览器执行，六篇文档是自制fixture，没有网络查询。

文档能放入客户端内存、需要前缀/容错/字段权重时值得选它。少量记录的近似匹配可比较Fuse；公开静态站点可比较Pagefind，避免客户端接收全部正文再建索引。MiniSearch score越高越相关，不能套Fuse的分数方向，也不是百分比置信度；不同查询的分数不宜直接比较。

## 文档怎样变为结果

`new MiniSearch({fields,storeFields,searchOptions})` 定义索引，`addAll`加入文档。fields=['title','summary']参与分词；storeFields=['title','group']只控制结果附带的原文，不能代替索引字段。title boost=3提高标题词权重，不代表每条标题命中一定胜过所有正文命中。

```ts
const index = buildMiniIndex(scopedDocs);
const hits = index.search('Reac', {prefix:true, fuzzy:0.2});
const suggestions = index.autoSuggest('Reac', {prefix:true, fuzzy:0.2});
```

prefix匹配未输完的词；fuzzy允许有限编辑距离，0.2为相对词长的容错设置，false关闭。UI按id回查当前scopedDocs获取摘要，按SDK顺序显示score，不拼接HTML高亮。空查询直接展示当前范围，不调用search；其行没有相关性分数。

## 三个实验

### 1. 全文、前缀和分数

basic默认查询React，结果同时含技术和开源文章，每行显示实际score与“越高越匹配”。输入Susp并提交，前缀命中React Suspense patterns。输入summary里的CLI，命中“开源 Node 工具”：正文也参与索引，而非只匹配标题。输入框只是draft，提交后才更新结果；状态句显示已提交词。

### 2. 分类与输入法

business查询React，再切“产品”，结果为空；切“开源”，仅React Loom实验室。先用scopeSearchDocuments裁剪数组，再buildMiniIndex，搜索与建议都只能来自这份scopedDocs。范围不是ACL：真正无权阅读的文档必须由可信上游在进入浏览器之前移除；不能把分类框当安全隔离。

组合输入期间不提交中间字符串，Enter同时检查composition ref、nativeEvent.isComposing与keyCode229。空白提交trim为空后展示当前分类。真实输入法仍需人工验收，合成事件只能证明事件处理分支。

### 3. 错拼、建议与文档更新

advanced查询Reakt，打开容错时可命中React；关闭“允许轻微拼写容错”后不匹配。查询Nod看到Node建议，再切技术分类，搜索与建议都不再出现Node。建议最多3条，搜索先filter再slice最多20条，避免先截断挤掉可见文档。

回到全部，查询Suspense确认旧标题；点击“更新 RSS 标题并重建索引”，id=1换成React Streaming patterns且摘要更新，当前Suspense不再命中；提交Streaming即可看到新内容。updateFirstDocument返回新数组，useMemo依赖scopedDocs重建索引，不是修改原数组后继续使用旧倒排。小fixture选择整体重建以避免半更新；大集合应评估remove/replace/add等增量API和CPU成本，而非每键入一次都重建。

## 完整迁入已有React工程

执行`pnpm add minisearch@7.2.0`。复制examples/example.tsx、runtime.mjs、runtime.d.mts、scope-policy.mjs和scope-policy.d.mts，保持相对路径。demo.tsx仅Lab重导出，可省略。渲染`<MiniSearchWorkshop level="advanced" />`，也支持basic/business。需要React与TypeScript bundler模块解析（支持.mjs/.d.mts），无Provider、环境变量、CSS插件、后台服务或资源下载；demo-controls等class只是宿主排版。

runtime.mjs是真实模型：initialDocs/buildMiniIndex/updateFirstDocument与UI、SDK测试共用。scope-policy只做分类与数组浅复制，不会深克隆文档；组件初始化另克隆每条种子，更新始终不可变。索引只在组件useMemo中持有，卸载即释放引用，没有timer/监听/Worker需要主动清理；重挂载恢复种子，不持久化。不能原地push documents，否则React依赖不变、旧索引仍被使用。

## 中文和生产边界

默认tokenizer并非中文语义分词器：连续“中文全文搜索”不会自然拆出内部词“全文”。SDK测试显示关闭前缀/容错后，完整字符串能命中而内部词不能。prefix/fuzzy不能代替中文分词；生产需为索引和查询配置一致的tokenize/processTerm，配真实语料验证召回和开销。本例没有自定义分词器、持久化、Worker、服务端搜索或权限服务。

不要只在JSX隐藏其它组的结果：全量autoSuggest仍会吐出其它组词。不要用dangerouslySetInnerHTML渲染建议，不把秘密正文交给浏览器或日志；storeFields少存字段不等于索引不含原文信息。生产授权与下载范围由服务器决定。

## 官方来源与验证范围

README页签保留lucaong/minisearch固定v7.2.0提交的英文原字节。完整固定树没有官方中文README，已记录候选，未伪造翻译。官网GET与响应头在official/source-evidence.json，没有明确frame限制但尚无Lab origin iframe验收，因此unknown并保留直达。

实际SDK测试直接导入runtime.mjs，覆盖评分方向、prefix/fuzzy、同范围联想、旧词消失与中文限制；scope纯策略测试分列。命令、日志和六项状态见local-validation.md。Chrome 本地结果见 local-validation.md；正式verification仍NOT_RUN，不能由本地测试或仓库CI推定收据。
