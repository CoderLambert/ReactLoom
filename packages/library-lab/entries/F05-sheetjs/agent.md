# F05 SheetJS CE — 选型与迁移

适合需要将行数据与多种表格格式互转、检查单元格类型或生成数据报告的工程。只处理CSV先比较F03 Papa Parse；精细XLSX样式比较F04 ExcelJS。F02 react-dropzone只处理选文件，不解析、不验证表格。

## 检索与真实来源

本条目 `contentState=recreated`，历史 `originalRecovery=SUMMARY_ONLY`，没有恢复研究原件。先读 library.json → guide.md → 实际 examples → verification.json，再看 local-validation.md 的本轮本地执行。不要把手册、CLI命令展示或旧CI当成正式逐库PASS。

固定版本为官方CDN的 `xlsx@0.20.3`：`https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`。工作区依赖和锁文件已有该版本；公共修改归主控，条目任务不升级。官方Node安装说明解释registry滞后：https://docs.sheetjs.com/docs/getting-started/installation/nodejs/ 。

## 核心模型与SDK职责

行数组 → `json_to_sheet` worksheet → `book_new/book_append_sheet` workbook → `write` 字节 → `read` workbook → `sheet_to_json` 行。单元格 `t/v/f` 分别表示类型、值、公式。`header`控制顺序而非白名单；自建normalize负责schema、文本和重复频道检查。分组和汇总由JavaScript完成，CE在本例不计算公式。

## 最小迁移

- 单表：复制 examples/core.mjs、validation.mjs、archive-policy.mjs、zip-entry-policy.mjs。保留真实依赖与相对导入。调用exportWorkbook(rows)和importWorkbook(bytes)。
- 分类报告：额外复制category-report.mjs，替换reportFixture；Summary与Category-N属于单向报告格式，公共importWorkbook只接受单表，不接受这份报告。
- CLI复现：再保留basic/business/advanced.mjs、artifacts.mjs、invalid-workbooks.mjs、verify.mjs、tests/sdk.test.mjs。输出只写本条目.artifacts，不能加入用户可控路径。
- React：转换逻辑不依赖框架，Node输出适配不进浏览器bundle。未知大文件解析必须移入有硬限制且可终止的隔离进程；现示例没有实现生产隔离器。

## 不能删除的边界

导入必须先ZIP预检，再SDK解析，再核对表数/范围/公式/原始表头/行schema；不能只对sheet_to_json默认对象结果挑字段。保持sheetRows与!fullref联合检查，保留中间空行以拒绝，不能悄悄跳过隐藏行列或未知列。公式前缀保守加单引号是自建数据变换，不是SheetJS安全保证；真实公式f/F一律拒绝。不能把写出文件当作求值公式。

保留normalize的非负安全整数、精确三属性、短文本、大小写重复检查和200行上限；分类汇总也要检查安全整数溢出。ZIP策略只信任有限的声明范围并核对双头，不构成inflate/XML的CPU或内存限制；它明确拒绝部分合法ZIP变体。限制值详见guide和archive-policy。

## 定向验证

cwd为packages/library-lab：

```sh
node entries/F05-sheetjs/examples/basic.mjs
node entries/F05-sheetjs/examples/business.mjs
node entries/F05-sheetjs/examples/advanced.mjs
node entries/F05-sheetjs/examples/verify.mjs
node --test entries/F05-sheetjs/examples/validation.test.mjs entries/F05-sheetjs/examples/archive-policy.test.mjs entries/F05-sheetjs/examples/zip-entry-policy.test.mjs
```

真实SDK断言包括行值/单元格类型、四张表的汇总明细、公式字符串、真实无效XLSX拒绝和汇总溢出。tests/sdk.test.mjs真实导入xlsx且断言0.20.3，可被现有SDK runner发现。纯策略套件与真实SDK分开报告。CLI registry当前没有F05，直接配方的本地运行不等于verify:record正式收据。

## 官方资料

official/readme.md为官方0.20.3对应提交8a7cfd47bde8258c0d91df6a737bf0136699cdf8的英文原文，由公开API取得。精确ref根目录只有英文README；source-evidence/readme-candidates/package-version-evidence记录来源。canonical网页当前需登录，不能据此否定已取得的API原文，也不能把登录HTML保存成README。官网HTTP200但未经Lab origin浏览器确认，status=unknown。保留Apache-2.0署名与原文，不将Pro能力写进CE承诺。
