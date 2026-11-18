# Fuse.js：先缩小集合，再加权模糊匹配

新闻阅读页已经下载六篇允许展示的文章，需要容忍“Ract”这样的错拼，并让标题命中比摘要更重要。`fuse.js@7.5.0`（Apache-2.0，自带类型）在本地数组上建立索引，返回原文档、分数和命中字段。它无需搜索服务，但会占用客户端内存与计算时间；数据量应按真实长度和设备测量，没有固定“几百条”性能保证。需要全文倒排比较MiniSearch，静态网站构建期检索比较Pagefind；权限和全库搜索由服务端负责。

## 输入如何成为结果

[`article-index.mjs`](examples/article-index.mjs)是真实UI与SDK测试共用的索引构造器：

```js
import { createArticleIndex } from './article-index.mjs';
const docs = [{ id: 'rss-1', title: 'React Query', summary: 'RSS订阅', tags: ['React'], group: '技术' }];
const engine = createArticleIndex(docs, 0.35);
const hits = engine.search('Ract', { limit: 20 });
// hits包含item、score、matches；具体分数由真实字段及匹配计算。
```

`keys`权重为title 0.65、summary 0.25、tags 0.10。分数越小越接近，不能当成概率或跨查询直接比较。`includeScore`和`includeMatches`开启后可展示分数/命中字段，默认排序由SDK完成。`threshold`越低越严格，0要求模式匹配更严格；它不保证整字段相等。`ignoreLocation:true`使匹配不因词位于字段后部而被默认位置距离惩罚。Fuse没有专业中文分词器，本例不宣称中文语义搜索。

SDK负责索引、模糊算法、评分与命中信息；`search-scope.mjs`负责本例的UI分组/阈值策略和查询规范化；`index-lifecycle.mjs`负责稳定ID的不可变数组更新。六篇种子与导入RSS均是fixture，没有网络、服务端、ACL或真实导入接口。

## 最小迁入

在已有React/TSX项目根运行 `pnpm add fuse.js@7.5.0`。纯计算复制 `article-index.mjs`、`search-scope.mjs`、`index-lifecycle.mjs`以及各自的`.d.mts`，保持同一目录。完整界面再复制`example.tsx`并渲染 `<FuseWorkshop level="business" />`；`demo.tsx`仅Lab重导出，可省略。无需Provider、环境变量、网络、额外bundler配置或额外类型包；React由宿主提供，demo CSS类只影响外观，可替换。

可信数据边界先做授权过滤，再按UI分类`visibleDocuments`缩小集合，再构造索引，最后`search(query,{limit:20})`。分类下拉框不是ACL。若先搜全库再过滤，其他组可能占满limit，造成当前组无结果，且未经授权的正文已被下载。文档schema验证也需要生产边界自行补充，类型声明不会验证外来JSON。

## 三个独立实验

### 基础：错拼、字段权重和真实得分

默认React查询会显示正常标题与Ract错拼。搜索框提交后才检索，结果中显示越小越好的分数和命中字段。清空提交展示当前集合所有文档（无分数），不是调用`search('')`。basic固定全部分类与0.35阈值，隐藏控件残留不影响索引。

### 业务：分类范围与输入法提交

切换商业分类，React结果消失；清空提交可看到商业fixture，切回技术恢复当前查询的结果。分类在索引和limit之前应用。输入框保留draft，`compositionstart`至`compositionend`期间阻止提交推进query，避免中文输入法选字Enter误发检索；结束组合后再点“开始检索”。`normalizeQuery`做NFC、移除控制字符、trim并按码点限80；输入框maxLength120是独立UI约束。无结果时可清空、切回全部或调整进阶阈值恢复。

### 进阶：阈值与索引生命周期

用React查询，将阈值从0.35改为0比较错拼命中。点击新增RSS，稳定ID `imported-rss`的React Query出现；同ID替换为TypeScript后，标题、摘要、tags都移除旧React词，旧查询不再命中该ID。改搜TypeScript可看到替换结果；删除后该ID消失，再新增可恢复。不是只隐藏旧行：不可变数组变化触发`useMemo`重建真实Fuse。

`upsertDocument`校验ID唯一且非空，同ID替换保持位置，新ID追加；`removeDocument`删除指定ID，未知ID返回原数组。它们不深拷贝所有嵌套字段；调用方不得修改旧快照或共用tags数组，本例只创建新数据。重复/坏ID抛错由策略测试覆盖；生产导入应先schema校验并显示错误，当前按钮只生成受控fixture，没有任意JSON导入。

## 迁移边界

不要原地修改文档后继续使用旧索引，旧token可能残留；可以显式setCollection，但本例统一新快照重建。React状态/index随组件释放，无timer、监听、数据库、存储或网络资源需要清理。大集合可测量后考虑Worker，当前没有Worker或异步竞态实现。

结果通过React文本节点渲染，即使标题包含`<img ...>`也只能作为文字，不使用dangerouslySetInnerHTML。matches只显示字段名，未实现HTML高亮。基本/业务固定阈值0.35，只有进阶接受0/0.15/0.35/0.55，离开层级通过resolveScope使用有效默认值。

## 验证与官方资料

仓库根运行 `node --test packages/library-lab/entries/D19-fusejs/tests/sdk.test.mjs`，真实SDK及UI同一索引模块验证权重排序、位置、阈值、分类先于limit和索引重建；另外两个策略套件单独计数。浏览器必须另验IME、分类和新增/替换/删除，Node不能证明交互通过。本地命令及准确状态见local-validation.md，正式receipt状态仍NOT_RUN。

固定v7.5.0提交`45bac9fe2e71fe8c680c861a35a8b226c4ae6d5a`的官方README原文已保存。递归目录只有英文README，没有官方中文原文，因此保留英文，不自行翻译冒充原文；本页是独立中文教学。[官方站点](https://www.fusejs.io/)实际GET200但尚未确认Lab origin嵌入，状态unknown，保留预览尝试与直达。原始响应头/摘要见official/source-evidence.json。
