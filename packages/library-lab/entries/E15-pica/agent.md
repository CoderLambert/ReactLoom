# E15 pica工程复用

固定pica10.0.3 MIT，支持pica()工厂实例顺序resize/toBlob，不是裁剪/上传。默认mks2013已有重采样锐化设计，额外unsharp参数未设；PNG字节不是画质评分。

安装本包，复制example.tsx、resize-policy.mjs/.d.mts、task-owner.mjs/.d.mts，demo仅适配。ReactDOM/TS bundler/Canvas2D/Blob/ObjectURL/createImageBitmap文件解码前提，无env/Provider/CSS插件/账号/服务；Worker/WASM需实际CSP能力验证。

文件PNG/JPEG/WebP非空≤4MiB；解码后≤16,000,000像素，bitmap finally close。后置像素检查不能阻止所有解码内存分配。最长边240/480/800，保比例/不放大；CSS不是导出像素。

真实resize传cancelToken Promise；resize结束clearCancel后，toBlob没有中止接口，只epoch丢旧输出。task-owner同步begin单飞、invalidate取消并作废id、旧Promise settle前不重开，finish旧id不影响新任务。取消/换图/边长/卸载都清结果；原生与pica均非空PNG成功才一起发布，null/empty/MIME异常失败，不可选context静默成功。

结果URL effect各自创建/revoke，bitmap自己close，不全局清URL。Worker池属于pica，默认idle2000ms，full包可能Blob Worker，split包workerURL不同；无公开destroy，不宣称卸载立即terminate或回退已验证。key=level换session，mountedRef防旧finally写已卸载状态。

Node7项全部policy（含Blob控制流），不是SDK。Browser提案实际resize尺寸/本地文件/native与URL回收，真实encoder callback持有→取消/卸载→释放无旧发布，只证明epoch不物理取消encoding/Worker。formal无收据NOT_RUN。官方固定README/许可原文en（无中文），仓库首页DENY blocked直达。
