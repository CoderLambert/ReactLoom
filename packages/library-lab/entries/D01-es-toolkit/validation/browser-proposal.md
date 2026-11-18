# @D01 浏览器接线提案（由主控写入 e2e）

只保留 basic Demo。沿现有条目导航进入 D01/demo/basic 后：

1. `getByRole('button', {name:'运行真实工具函数'})` 点击；读取 `getByTestId('toolkit-output')` 的 JSON，断言 inputCount=5、normalized.length=5、sorted.length=5、unique.length=4、unique[0].title='Release notes'、unique[1].title='Frontend Insights'、groupSizes={official:2,community:2,other:0}、pages.map(length)=[2,2]、rejected=[]。
2. `getByLabel('每页文章数').selectOption('3')`，运行；断言页长 [3,1]，unique 仍 4。
3. `getByRole('checkbox', {name:'包含两个坏输入'}).check()`，运行；inputCount=7、rejected.map(index)=[5,6]，unique=4。
4. `getByLabel('文章 JSON').fill('{}')`，运行；`getByRole('alert')` 显示「输入必须是 JSON 数组」，旧 toolkit-output 不存在。再填 `[` 测语法错误可见 alert。
5. 点击 `getByRole('button', {name:'恢复示例输入'})`；checkbox unchecked，alert 不存在；运行后 inputCount=5、unique=4。
6. JSON.parse textarea，修改第 2 条日期为 2026-10-28T06:00:00Z，填回并运行；unique[0].title='Same article older'，不存在 Frontend Insights，证明排序在去重前。
7. 填 `[]`，运行；normalized/unique/pages/rejected 全为空。离开 Demo 后重入，恢复初始 fixture 且无旧输出。

所有结果从实际运行 DOM JSON 读取；仅 Node 套件不能证明以上交互已 PASS。
