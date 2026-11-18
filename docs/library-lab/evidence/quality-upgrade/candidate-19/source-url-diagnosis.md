# 版本补丁源码URL实际失败定位

candidate19/browser.txt整批12项：11PASS、1FAIL，实际退出1。唯一B15资源case的href是`/raw/B15/sources/examples/react-grid-layout%402.3.0.patch.txt`；Playwright实际GET200但content-type text/html，不能当源码成功。

主控实际仓库cwd以Python urllib各读取一次编码/原生两URL，编码URL返回200 text/html 730B、开头DOCTYPE的Lab SPA；原生@ URL返回200 text/plain 1201B、开头真实diff --git。public与dist磁盘均存在带原生@的声明patch.txt；未改运行服务。

实装Vite dist/node/chunks/node.js:17919静态sirv分支使用decodeURI(pathname)，该函数保留%40，不能匹配磁盘@。原SourceViewer与Document均逐段encodeURIComponent，故同源输送受影响。safeRelativePath已禁止scheme/query/fragment/backslash/遍历，encodeURI可保留合法path @，并正确编码Unicode/空格/字面百分号；新encodePublishedPath把验证和编码统一供两消费者，文件仍.txt，不更改摘要/大小/HTML拒绝边界。

新增版本路径单测先真实RED，随后Document/source-integrity两文件20测试PASS（source-url-{red,green}.txt），局部格式exit0。仍待匹配新构建后仅复跑失败资源case，并新增源码面板选择patch、已校验SHA与复制可用验证；没有由Node测试推定浏览器PASS，也没有重跑无影响库。
