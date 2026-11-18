# E13 PhotoSwipe 工程复用

5.4.4/MIT实装与固定LICENSE双核。图片浏览/键盘缩放，不是裁剪/托管/上传。已有React/TSX浏览器`pnpm add photoswipe@5.4.4`；复制example.tsx、gallery-policy.mjs/.d.mts、artwork.mjs/.d.mts，demo可省。必须CSS photoswipe/style.css；ESM动态import/CSS/TS Bundler，无Provider/env/服务。

Lightbox静态模块，pswpModule动态import核心；第一次打开加载，后续模块缓存，打包懒加载需browser观察。容器ref限定children:a，不扫描全页。原创dataSVG显式width1200/height800+viewBox，元数据匹配固有尺寸；不是照片/栅格像素或生产解码性能。policy只检查字段，不验证SVG安全；生产替换素材需可信URL/权限/尺寸。

basic单图与首次core；business三图+figcaption开关和方向键/Esc/焦点；advanced3/4集合变更销毁旧Lightbox。开灯箱时底层按钮被遮罩，程序触发已有按钮是外部数据变化模拟，不宣称穿透可点击。close请求后effect disposeLightbox是真正所有权清理，卸载同样；core动态加载未完成也由destroy的shouldOpen=false防迟到打开，不中止下载。

说明为React文本，无captionHTML。trapFocus/returnFocus SDK默认，触摸/键盘/图片decode/实际destroy由browser验，不把DOM消失当destroy。测试可取官方window.pswp并公开on('destroy')外部观测，升级核对；不向产品新增全局实例。无Storage/Worker或全局清理。

纯policy不计SDK；无DOM平台依赖不伪造NodeSDK PASS。browser proposal交主控；formal sdk/build/browser无receipt保持NOT_RUN。官方固定readme/license和真实响应头在official，主页unknown。

点击路径的真实数据源是由visible渲染的gallery DOM，不是options.dataSource数组。5.4.4打开动画中destroy可能直接return：完整example.tsx中的disposeLightbox先注册实际core的openingAnimationEnd再销毁Lightbox，必要时动画完成后重试core.destroy；destroy事件移除兜底监听。必须整体迁入此函数，不能简化回单次destroy。主控浏览器覆盖打开期间立即卸载的回归。
