# D21 Pagefind 独立试用与评审

2026-11-18，当前D21-pagefind工作树；pagefind1.5.2。仅写本报告，不改条目/共享文件，不重复作者3CLI或完整SDK，不跑浏览器/生成/构建。按LIBRARY_CATALOG→metadata→agent→全部声明workshop/入口/policy/SDK源码→verification→guide检索，并检查本地日志/manifest/官方材料。

结论：Spec与质量内容/Node工坊运行复核PASS，无实质整改项；主站资料展示浏览器NOT_RUN。访客search明确未执行，不推定搜索相关性/URL可访问/中文/WASM通过。正式三项收据仍NOT_RUN。

## 独立原生消费者

新公开fixture：`/articles/observatory/`，Public observatory，Quasar observations and public telescope schedules。复用实际publication-policy的assertPublicDocument/escapeHtmlText后，通过真实Pagefind createIndex/addHTMLFile/getFiles/writeFiles生成本次独有tmp输出。实际读取pagefind.js字节并计算SHA，而不是使用getFiles摘要冒充写盘。finally删除本index、close本进程服务、仅删除本次d21-independent-*目录，最后access确认该目录不存在。

最终命令 `node --input-type=module` 内联ESM，cwd `/home/lambert/githubRepos/lambert/ReactLoom/packages/library-lab`，exit0：

```json
{"trial":"PASS","publicUrl":"/articles/observatory/","memoryFiles":15,"writtenPaths":17,"entryBytes":45555,"entrySha256":"252d272bd34d483d19a752060f6a065114d15ab12c42d8f905ca565e2768a009","visitorSearchExecuted":false,"indexDeleted":true,"serviceClosed":true,"ownedScratchRemoved":true}
```

writtenPaths为readdir recursive的路径数量（包含目录），不是磁盘文件数；没有把它与memoryFiles比较。初次在仓库根用createRequire.resolve定位ESM-only pagefind入口，exit1 ERR_PACKAGE_PATH_NOT_EXPORTED，未创建tmp或native index；改从Lab cwd标准ESM import后通过。此为消费者入口定位问题，不是SDK失败或条目缺陷。未建立新搜索宿主。

## 作者产物证据核验

逐读三个*-cli-final.log与对应command.json，均为Lab cwd的精确basic/business/advanced入口，exit0；记录2/4/5、16/20/21文件、645963/646622/646847磁盘字节，visitorSearchExecuted均false。三个disk-manifest分别与result.assets完整排序比较相等，count/字节汇总相等；保留的pagefind.js.txt和pagefind-entry.json.txt原字节分别重算SHA/长度，与对应manifest相等。该核验脚本exit0，逐项输出 `manifest/result and retained raw hashes PASS`。

完整二进制包原tmp已清理，因此本次不能重新读出全部WASM/分片字节；这些部分依赖当时独立磁盘manifest与命令清理记录，而不是声称现在仍能重读。getFiles/writeFiles两次生成的带hash路径与字节不可互认，代码分别统计内存与实际writeFiles读盘，初次ENOENT错误记录保留，没有用新日志抹掉失败。

## 六维状态

|要求|结论与证据层级|
|---|---|
|技术准确|PASS，真实native消费者+静态：HTML/customRecord/目录三种输入、英文forceLanguage、错误数组处理、真实磁盘统计、index与process清理边界对应源码。|
|解释清楚|PASS，静态：公开静态内容选型→Node模型→三种输入→命令cwd/迁移→生产部署与search接线；明确生成不等于访客检索。|
|Demo有用|PASS，Node工坊实执行层：HTML索引、自定义RSS meta/filter、受控临时目录扫描分别有独立目标，非只改数量；浏览器命令展示仍NOT_RUN。|
|源码可迁移|PASS，真实SDK接入+静态：workshop/publication-policy/所需CLI入口完整，Node ESM、optional平台二进制、执行/tmp权限、无React/CSS/账户/服务明确。|
|官方来源可靠|PASS，字节/HTTP核对：固定Pagefind/pagefind commitbf17396721be637cc67c8ed7ead1dc7b8ac43d96 README上游raw与本地SHA均e363a3eede2deb4622808e246bcf1490483e8a5d3326483a2deda49a7b0735ac。安装包version1.5.2/licenseMIT及固定LICENSE原文一致；固定tree无中文根README记录，保留en。保存头与本次GET均HTTP200，未见XFO/CSP限制，未有Lab-origin内容确认因此unknown合理。|
|结果可复核|Node层PASS，展示/访客search/正式收据NOT_RUN：作者SDK3与policy3分计正确，独立消费者另列，不重复或将策略计入SDK数量。实际CLI/manifest/代表字节已核验，余下浏览器由主控执行。|

## 公开边界与所有权

public是构建前断言，不是ACL。生成前可信上游必须决定可公开范围；filters/meta与索引均会被下载，excludeSelectors不补救私密原文已进入构建输入。URL policy限制/articles或/files安全路径、拒绝遍历/查询/双斜线，HTML按文本转义，目录仅扫描本次创建的公开fixture站点，没有任意服务器路径执行口。

customRecord URL只进入索引，不自动发布目标文本文件；生产必须同时发布真实内容URL与完整索引包。指南的search/results.data示意明确未运行；本次独立HTML也不声称生成对应目标站点HTML文件。

workshop只管理自己mkdtemp与index，finally deleteIndex；keepOutput仅成功且索引删除完成后保留，失败清理本次scratch。入口finally close拥有整个独立进程的Pagefind服务；共享并行生产服务应由更上层统一close，不由一个任务关闭其它索引。默认工坊清tmp、CLI保留后由调用者定向取证删除，两种路径区分明确。

剩余由主控执行主站命令/官方资料展示；不新增浏览器search runner。独立报告完成，停止写入。
