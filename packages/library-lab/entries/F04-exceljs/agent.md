# F04 ExcelJS工程复用

Node ESM，exceljs4.4.0 MIT。选择样式/冻结/公式对象XLSX输出；不是公式求值器或任意外部xlsx安全导入。安装后复制core.mjs、row-policy.mjs与所需入口，完整三场景+verify共六份；无React/env/Provider/CSS/服务。

checkRows必须先于newWorkbook：1–500行，id NFC/trim、字母数字起始+字母数字_.:-、≤64码点，en-US小写去重；source非空trim≤160UTF16、C0/DEL拒绝，公式样前缀加字面撇号。ExcelJS普通字符串不会自动变formula；前缀是额外保守合同且改变值，不称所有下游CSV安全。仅受控SUM由显式formula/result对象生成。

reads/stars非负安全整数，单项/合计≤999999999999999，保守15位预算非Excel数值最大值。先policy后Workbook；自产writeBuffer→新Workbook.load，不load外部用户ZIP/XLSX。外部导入/ZIPbomb/宏/流式/浏览器下载/桌面重算不支持。

basic样式冻结无TOTAL summarynull；business SUM(C2:C4) cache115/17；advanced CLI追加第四条公式样source，TOTAL范围C2:C5且String撇号保留。缓存是JS预加总，不是ExcelJS算式执行。元数据固定不等ZIP字节必定相同。脚本可省最后参数，若给必须匹配入口场景；Lab cwd packages/library-lab，根命令加packages/library-lab前缀。

SDK4/policy6与3CLI真实输出分记，网页只展示命令/源码/来源，browser主控不执行Node。无需文件/连接清理，仅本次内存引用。固定README_zh.md上游中文原字节，GitHub官网blocked；formal无匹配receipt保持NOT_RUN，详细命令/raw与剩余边界见local-validation。
