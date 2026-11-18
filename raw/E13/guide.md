# PhotoSwipe：图片尺寸、惰性灯箱与资源所有权

文章配图需要点击放大、方向键切换和Esc关闭。PhotoSwipe5.4.4（实装package与固定LICENSE为MIT）负责灯箱、缩放与键盘焦点；不负责媒体数据库、裁剪或图片托管。只有装饰图用普通img，裁剪比较react-easy-crop，缩小编码比较pica。本例没有远程图库、上传、实拍照片或Canvas转换。

## 最小接入与对象模型

已有React/TSX DOM打包项目运行`pnpm add photoswipe@5.4.4`。复制example.tsx、gallery-policy.mjs/.d.mts、artwork.mjs/.d.mts，保持相对目录；demo.tsx仅Lab转发可省。渲染`<PhotoSwipeExample level="business" />`。打包器需ES模块动态import/CSS与包exports解析，TS用Bundler。无Provider/env/账号/字体或服务。

保留`import 'photoswipe/style.css'`，它决定遮罩/按钮/布局；不是只复制JS就有完整灯箱。Lightbox模块静态导入，核心通过pswpModule函数在首次打开动态import；后续浏览器模块缓存复用，不保证每开一次都下载。代码分割由打包器决定，浏览器提案分别观察打开前/后资源，不能用源码import替代真实加载证据。

```tsx
const lightbox = new PhotoSwipeLightbox({
  gallery, children: 'a', pswpModule: () => import('photoswipe'),
  bgOpacity: 0.88, showHideAnimationType: 'fade',
})
lightbox.init()
return () => disposeLightbox(lightbox) // 完整函数见 example.tsx；覆盖打开动画窗口
```

React拥有稳定memo选中集合与锚点；锚点点击由Lightbox读取当前gallery DOM（其onThumbnailsClick传入gallery数据源），DOM由同一visible集合渲染，本次effect拥有Lightbox。gallery是自己的div ref，不用全页a选择器。width/height元数据来自图片固有尺寸，不是缩略图CSS。每次level/includeExtra变化先清理旧Lightbox再创建；showCaption只改变React文本，不需重建。

## 素材与尺寸的真实含义

artwork.mjs是完整原创fixture：四个data:image/svg+xml URL，每个SVG显式width1200/height800及viewBox0 0 1200 800，几何图形和文字均本地模板生成。它们不是拍摄素材，不证明JPEG/EXIF/生产图床性能。SVG没有固定栅格“像素原件”，1200×800是声明固有显示尺寸与坐标框；本例浏览器image.decode/naturalWidth应与显式尺寸一致。

锚点data-pswp-width/height写1200/800供PhotoSwipe预先布局，缩略图HTML width300/height200和CSS响应式只是预留3:2布局。viewBox单独只有比例，不足以保证naturalWidth1200，本轮已补显式SVG尺寸。loading=lazy只影响缩略图调度，不证明带宽优化；data URL仍需真实图片解码。

gallery-policy检查选中条目id唯一、安全整数、非空src/alt、正整数尺寸≤32768。它不验证SVG字节、来源许可或远程URL安全，不将字符串非空当可信媒体。生产图片应自己验证URL/类型/尺寸/授权，不能直接换任意用户URL。

## 三个独立目标

### 基础：首次打开与真实图片

单张fixture。缩略图可解码，点击后真实Lightbox导入core并打开图片，Esc关闭；若脚本失败锚点保留真实图片href，但data URL导航的浏览器策略各异，不能承诺通用降级导航成功。CSS与页面CSP需允许当前data图片及实际构建资源。

### 业务：多图、说明与键盘焦点

三张，显示说明复选框控制真实figcaption；不是灯箱内caption。打开第一张，用ArrowRight切到第二张，Esc关闭后焦点返回触发锚点。默认trapFocus/returnFocus来自SDK，本例没有另外模拟。键盘/触摸/移动设备/减少动态仍需相应运行环境验收；fade不等于已响应prefers-reduced-motion。

### 进阶：动态集合与旧弹层失效

添加第四张，真实锚点数由3变4；删除回3。按钮先请求当前pswp.close，再修改includeExtra，effect cleanup调用disposeLightbox并重建，防旧弹层引用撤下图片。若集合由外部状态在弹层打开时变化，也应走相同销毁路径，不只在JSX隐藏缩略图。

overlay打开会拦住页面按钮，浏览器验收可通过程序触发已有React按钮表示外部集合更新，仍观察真实SDK destroy事件；不能声称用户能穿透遮罩点击。卸载期间在外层保留真实打开实例并监听destroy，不能只凭.pswp节点消失认定资源关闭。Lightbox.destroy还解绑自己的gallery点击监听，不清全局其它图库。

## 生命周期、迁移和证据

每个effect实例清理时disposeLightbox，若ref仍指本实例才清ref。核心若正处于动态import阶段，Lightbox内部destroy会置shouldOpen=false，避免迟到打开；不是中止浏览器下载。没有Worker、timer、Storage或上传队列属于本例。说明只用React文本，不拼captionHTML。

完整源码/纯policy测试与browser提案见本目录。没有可替代DOM的Node SDK测试：policy只验证选图/fixture字段，不当PhotoSwipe运行PASS。主控浏览器应执行图片decode尺寸、首次core加载、方向键/Esc/焦点、caption/第四张、打开时集合变更、外层destroy和卸载。真实触摸/OS辅助技术另行验收，formal verification保持NOT_RUN。

固定官方v5.4.4→commitfd85184b450f451bc4aa2697f6d0a79304d13473的README和LICENSE原字节保存；固定树无官方中文README，英文en回退。本地中文教学独立。官网GET200但无Lab嵌入确认，unknown，完整响应头在official/source-evidence.json，保留直达。实际命令/日志与六项分层见local-validation.md。

PhotoSwipe 5.4.4 在打开动画中可能忽略 core.destroy 的关闭请求。本例先给实际 core 注册 openingAnimationEnd 兜底，再调用 Lightbox.destroy 解绑图库、阻止迟到 import；若动画正在进行，公开 openingAnimationEnd 后重试 core.destroy，最终 destroy 事件移除兜底监听。已经打开时按原 SDK 路径关闭。清理在动画完成后收敛，不宣称调用瞬间所有节点都已移除。
