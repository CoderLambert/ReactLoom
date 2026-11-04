# D19 Fuse.js — 浏览器模糊搜索与 RSS 分组过滤

## 版本与任务定位

固定 fuse.js@7.5.0（Apache-2.0），适用于低至中等规模的浏览器本地模糊匹配：频道发现、命令面板、离线收藏。不是向量搜索、权限系统、跨用户同步或服务器全文索引。此条目为重新编写的完整实战源码，不继承旧研究中的测试成功标记。

## 安装与引用

~~~sh
pnpm add fuse.js@7.5.0
~~~

~~~ts
import Fuse from 'fuse.js'
const fuse = new Fuse(data, {
  keys:[{name:'title',weight:0.65},{name:'summary',weight:0.25},{name:'tags',weight:0.1}],
  threshold:0.35,includeScore:true,ignoreLocation:true
})
const found=fuse.search('React',{limit:20})
~~~

实际运行源码 examples/example.tsx，Demo 出口 examples/demo.tsx；三层示例通过相同源码参数切换行为，源码视图不维护副本。

## 三层实际应用

基础：中文/英文标题输入，查看模糊匹配的 score。score 越小越接近，不把浮点数分数当业务“相关性概率”。

业务：RSS 频道先根据可见分组裁剪集合再建立 Fuse 索引，最后执行模糊匹配和 limit；不能先在全局索引 limit=20 后再过滤分组，否则可能遗漏组内有效结果；IME 合成阶段不能因为 Enter 误提交。query 为空时回退为经过组别筛选的全部条目，不能让空串命中数量反映未定义行为。

进阶：显式调整 threshold（0 更严格，0.55 更宽松）；增加一个本地频道后，在 useMemo 中重建 Fuse 实例，使索引与文档快照一致。也可采用 fuse.setCollection(newData) 显式刷新；不要原地改数组以免索引过期。

## 重要机制

- Keys 权重相对决定排序，需按搜索任务调整；标题通常高于摘要。
- includeMatches 返回匹配位置，可用于安全文本切片高亮；不要从不可信数据拼 HTML 或使用 dangerouslySetInnerHTML。
- ignoreLocation 禁用默认“靠前更重要”的影响，适合标题/摘要不同长度的条目。
- threshold 是模糊容错而不是固定字符相似百分比，应该在真实语料中测试。
- Fuse 不会内建用户权限过滤，必须将权限范围先收窄后建立索引，或者在最终结果强制过滤，防止敏感项通过结果/时间泄露。

## 反例与修正

1. useMemo 依赖为空，数据列表已更换但索引仍旧：以 data/阈值为依赖重建，或 setCollection。
2. 搜索结果将用户字符串直接插入 innerHTML：使用 React 文本节点和安全高亮切片。
3. 以 score 排序替代可信过滤：tenant、权限、内容有效性属于业务契约。
4. 百万记录全部塞主线程并每个键盘事件重新建索引：使用节流、分片、Worker 或服务端搜索。
5. 使用索引下标作为唯一身份：动态插入后引用错乱，保留领域 ID。
6. 认为模糊搜索能够自动匹配中文语义同义词：Fuse 是近似文本匹配，不是语义嵌入模型。

## 与其他库对比

D20 MiniSearch 擅长在字段上建立倒排索引和全文检索；D21 Pagefind 更适用于构建时索引的静态站；D04 p-queue 管理任务启动频率，不能代替全文索引。后端最终搜索一般还需要来源权限、索引更新和持久化。

## 验收

tests/sdk.test.mjs 直接真实 import Fuse 并验证搜索、limit、setCollection。浏览器需验证 IME、组别过滤和数据更新。没有实际跑依赖/浏览器则状态 NOT_RUN；Mock SDK 或编造命中率不得记 PASS。

官方：https://www.fusejs.io/ · https://www.fusejs.io/api/options.html · https://github.com/krisk/Fuse/releases

## 补充：隐藏设置不得继续影响基础模式

原版在高级模式设置容错阈值、业务模式选择分组后，回到基础模式虽然隐藏了两项控件，却继续使用上一次的 `group` 和 `threshold`。这会令基础搜索不可预期地缺少文章、得分不同。现在组件每次由 `resolveScope({level, group, threshold})` 派生生效设置：basic 永远全部分组 + 0.35；business 保留可见分组但固定 0.35；advanced 才使用合法高级阈值。 `visibleDocuments` 在建 Fuse 索引之前筛选，`normalizeQuery` 有 NFC、控制字符清理、80 码点长度限制。helper 源码与声明同时在三层 sourceFiles 展示。该分组是 UI 条件，不是租户授权；生产权限仍须在服务端或数据交付阶段完成。

## 数据更新必须更换索引快照：新增 / 替换 / 删除

进阶场景现在有三个真实交互：新增带固定业务 ID 的 RSS、将同 ID 记录替换成 TypeScript 标题、删除该 ID。组件真正从 index-lifecycle.mjs 引入 upsertDocument 与 removeDocument，使用 React setDocs(old => ...) 的函数式更新，确保连续操作顺序确定。旧快照不可原地修改；useMemo 看到新 docs 后先做分组裁剪，再重新 new Fuse，旧标题不能残留在搜索结果。

upsertDocument 保持既有 ID 的列表位置，插入时追加；removeDocument 删除特定 ID，不存在时返回原数组。源数据含重复/空 ID 则拒绝更新，防止 index 与 React key 产生二义性。三个层级共用 example.tsx、index-lifecycle.mjs/.d.mts 和既有 search-scope.mjs/.d.mts；不要维护第二份展示代码。索引是本地 UI 能力，不是可代替后端 tenant ACL 的边界。

运行 node --test packages/library-lab/entries/D19-fusejs/tests/index-lifecycle.test.mjs 只证明不可变快照规则；tests/sdk.test.mjs 另外包含真实 Fuse 构建后新增、替换、删除及分组迁移断言。浏览器应验证先新增再替换时旧 React 命中消失、TypeScript 新命中出现，删除后不再命中，并测试中文 IME 与隐藏筛选模式。未执行 SDK/浏览器时仍保持 NOT_RUN。
