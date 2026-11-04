# E13 PhotoSwipe — Agent 工程使用指南

**适用**：文章多图预览、图库浏览、移动端缩放；**不适用**：图像裁剪、媒体上传、需要完全自研编辑坐标体系的白板。

- 依赖基线：photoswipe@5.4.4 / MIT（要在目标项目重新确认依赖锁文件）。
- 最小复用：examples/example.tsx。Lab 的 examples/demo.tsx 只转出组件，不需要复制到生产业务。
- 必须有原始图的width/height；正确alt和可访问的a链接；需要脚本失效时a仍能导航到图像。
- 图片列表归React；Lightbox监听器和Popup归PhotoSwipe；只在需要时 init，卸载要destroy；绝不借全局document选择器接管其他图库。
- 确认样式 photoswipe/style.css 的打包方式、预览Tab首次点击时的懒加载chunk。复杂设计系统应隔离z-index与焦点回退，不能直接全局覆盖通用CSS。
- 外部图源属于图片服务/版权/CORS问题；本例原创SVG没有跨源风险，不能外推到第三方站点。
- 禁止：在render里创建Lightbox、多实例共享document级gallery选择器、把图片缩略尺寸当原图尺寸、没有销毁、无alt、全站预加载大图。

## 迁移路径

1. 在真实产品选择现有图片列表数据模型（src/thumbnail,width,height,alt）。
2. 复制 Gallery 与Lightbox effect逻辑，替换本例dataURL图源，保留销毁。
3. 在目标路由中仅使用动态import加载当前图库；验证灯箱关闭/切路由时无额外监听和焦点泄漏。
4. 真实浏览器断言：可点击、Escape、键盘左右切换、动态追加、卸载后不能再打开，移动端触摸。
5. 记录对应版本/commit/命令和真实结果，未执行写NOT_RUN。

**不能删掉的部分**：gallery Ref作用域、pswpModule动态import、尺寸元数据、effect清理、原生链接语义。验证状态见 verification.json。官方： https://photoswipe.com/getting-started/ 。

## wave19 迁移风险

动态图库删除/切换level时，先关闭当前slide，再销毁或重新初始化当前gallery范围的Lightbox；不要仅更新React数组而让旧Popup索引继续引用已卸载元素。`gallery-policy.mjs` 只约束示例ID/尺寸/层级，不验证用户上传SVG的安全性。真实PhotoSwipe SDK与Chromium必须另外验证。
