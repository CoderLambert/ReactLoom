# ExcelJS：生成自己的XLSX，再读回验证

RSS周报需要表头样式、冻结首行、整数统计和可打开的xlsx。ExcelJS4.4.0（实际安装包和固定LICENSE为MIT）能创建工作簿、写Buffer、读回工作表与公式对象；它不是公式求值引擎。纯文本交换可选CSV，更多格式需按目标格式/许可单独比较。

本条是Node-only工坊：三个CLI真实调用SDK，在内存写出并load本次自产字节，stdout输出摘要，不写用户xlsx文件。浏览器只显示命令/源码/来源，不运行Node、不生成下载链接。没有上传、外部文件读取、网络、密钥或生产报表。

## 完整迁入与命令

Node22+ ESM项目执行`pnpm add exceljs@4.4.0`。复制core.mjs、row-policy.mjs及所需basic.mjs/business.mjs/advanced.mjs，保持相对路径；可选verify.mjs是独立验证脚本，复制三场景全套共六份。无需React、CSS、Provider、环境变量或服务。

仓库根执行：

```sh
node packages/library-lab/entries/F04-exceljs/examples/basic.mjs basic
node packages/library-lab/entries/F04-exceljs/examples/business.mjs business
node packages/library-lab/entries/F04-exceljs/examples/advanced.mjs advanced
```

Lab命令面板cwd为packages/library-lab，因此显示`node entries/F04-exceljs/examples/basic.mjs basic`等，指向同一文件。最后参数可省；若传入必须等于该脚本场景，不再静默忽略错场景参数。程序只打印JSON，不在磁盘生成xlsx；要下载/保存需生产代码显式设计。

core导出generateWorkbook(level,rows)、inspectWorkbook(bytes)、FIXTURE。fixture三行52/5、38/8、25/4，reads/stars合计115/17。调用流程先checkRows，再new Workbook→Sources worksheet→行与格式→writeBuffer→新Workbook.load同一次字节。created元数据固定，但ZIP内部细节/运行环境可能改变字节长度，不承诺二进制完全确定。

## 三个独立目标

### 1. 样式与冻结表头

basic写三行，读回检查Sources存在、首个id/source、frozen ySplit1、表头bold和FF275B49填充。没有TOTAL行，info.summary为null；返回totals115/17是调用方统计，不假装工作表中已有公式。风格是工作簿数据，读回能确认存储，打印/Excel桌面视觉还需实际打开验收。

### 2. SUM公式与缓存

business追加TOTAL，C5为`{formula:'SUM(C2:C4)',result:115}`，D5缓存17。公式字符串与缓存都往返保留，ExcelJS没有计算SUM；result来自前置checkRows。Excel/其它表格软件可能重新计算，缓存不是独立计算引擎证据。core的advanced默认fixture也仍三行；advanced CLI显式传入下面第四行，范围因此变成C2:C5，不能硬写所有层都是C2:C4。

### 3. 文本、身份和数值边界

advanced CLI追加`=HYPERLINK(...)`来源文本，策略trim后在=、+、-、@开头加字面撇号；读回B5为带撇号String类型，不是formula对象。**ExcelJS直接给cell.value赋普通'=2+3'字符串也仍是String，不会自动变成公式。** 本例加撇号是额外保守文字合同，会改变字面值，不能保证所有表格/CSV再导入场景都等价隐藏撇号。真正公式仅由本例显式formula对象创建，不把不可信文本拼到公式表达式。

id先NFC规范化/trim，最多64个Unicode码点，必须字母或数字开头，后续仅字母/数字/下划线/点/冒号/连字符；以en-US小写键去重，表中保留规范化后的大小写。限制身份字符也防止两个不同id经公式前缀处理后写成相同字符串；'=id等不是合法id。source为非空字符串，trim后≤160 UTF16单元且无C0/DEL，前缀处理可能再加一个撇号。不是任意文本无损导出。

reads/stars只能非负安全整数，单项与累计都受999,999,999,999,999限制。这是应用选择的保守15位十进制整数预算，**不是Excel最大数值**；某些更大整幂仍可精确表示，但本例统一拒绝以减少一般大整数精度差异。NaN/Infinity/负数/小数、重复id、超500行或超预算合计在创建Workbook前拒绝。高级CLI实际断言NaN失败；SDK与policy另覆盖其余边界。

## 内存与信任范围

只load刚由本例生成的Buffer，不读取外部xlsx、不提供ZIP bomb防护。公开inspectWorkbook函数的调用方也必须遵守自产字节前提，不能拿它当外部文件安全验证器。生产导入需单独处理压缩展开、工作表/样式/节点/公式/链接/宏及CPU/内存预算；压缩文件大小上限本身不足以挡住展开炸弹。

1–500行和短文本限制在Workbook创建前，避免明知过量仍开始序列化；这不代表对任意外部对象/副作用getter的隔离或海量表格性能保证。没有streaming writer、浏览器File API、字体/打印布局、Excel桌面重算验收。完成后Buffer/Workbook为本次局部引用，无进程/连接/监听或临时文件需要清理。

## 官方材料与证据

v4.4.0固定commitac96f9a61e9799c7776bd940f05c4a51d7200209的tree含上游README_zh.md，因此README页签优先保存该中文原字节，language zh-CN，未自行翻译。LICENSE原文/包版本许可/SHA在official与library.json。官方homepage为GitHub仓库，实际响应deny/frame-ancestors none，blocked直达。

实际SDK4项和policy6项分别落日志，三个CLI本次真实执行结果见local-validation.md。不以网页显示命令当SDK执行，不将Node文件结构验证当桌面视觉/公式重算或浏览器运行PASS。正式verification无匹配收据仍NOT_RUN。
