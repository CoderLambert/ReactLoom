# E13 PhotoSwipe — 工程手册

## 适用

本地或已授权图片的灯箱预览、缩放和关闭。裁剪用 E14。像素缩小用 E15。不要把灯箱数据当内容数据库。

## 版本

`photoswipe@5.4.4`，MIT。初始化用 `PhotoSwipeLightbox`，核心通过 `pswpModule: () => import('photoswipe')` 按第一次打开加载。不要抄 v4 的 jQuery 写法。

## 迁移

复制 `examples/example.tsx` 的容器 ref、`data-pswp-width` / `height`、effect 里的 init/destroy。张数走 `visibleArtwork`。`examples/demo.tsx` 只是再导出。说明保持 React 文本。远程 URL 不要直接替换 data URL，除非另有主机名单和尺寸。

## 不可删的清理

effect 的清理函数必须 `lightbox.destroy()`，并只销毁本次实例。切换张数前若灯箱还开着，先 `pswp.close()`。gallery 选择器限于 ref，不能用会命中外壳的全局选择器。React key 用图片 id。

## 反例

- render 期间 `new PhotoSwipeLightbox`。
- 链接不写原始像素。
- 路由入口同步导入核心却声称按需。
- caption `innerHTML`。
- 把 items 数组当持久化数据库。
- 用 `preload` 冒充整库下载。
- `href="#"` 且没有真实图片地址。
- 任意用户 URL。
- 用数组下标做 key。

## 测试断言

- `visibleArtwork` 按层返回 1、3 或 3/4 张，并拒绝坏 id、空 alt、非正尺寸。
- 浏览器：第一次打开才加载核心；离开后 destroy；外壳链接不进图库。
- 键盘和焦点没有收据就不要写成通过。
- policy 测试不是 PhotoSwipe SDK PASS。

## 真实限制

素材是 SVG data URL，不是照片解码测试。策略不检查 SVG 安全。动画固定 fade，没有读取减少动态。Esc 和焦点返回未做浏览器记录。

## 证据

sdk、build、browser 保持 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有 E13 收据。Actions `41779873259` 是仓库级运行，不是本条目 PASS。

资料：https://photoswipe.com/getting-started/ 与 https://photoswipe.com/options/ 。
