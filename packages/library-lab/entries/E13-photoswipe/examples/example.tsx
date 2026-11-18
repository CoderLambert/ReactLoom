import PhotoSwipeLightbox from 'photoswipe/lightbox'
import { useEffect, useMemo, useRef, useState } from 'react'
import 'photoswipe/style.css'
import { visibleArtwork } from './gallery-policy.mjs'

type Level = 'basic' | 'business' | 'advanced'
type Props = { level: Level }

import { artwork } from './artwork.mjs'

// v5.4.4 cannot close a core while its opening animation is in progress.
// Keep the actual core until its public opening event permits destruction.
function disposeLightbox(lightbox: PhotoSwipeLightbox) {
  const core = lightbox.pswp
  if (core) {
    const afterOpen = () => {
      core.off('openingAnimationEnd', afterOpen)
      core.destroy()
    }
    core.on('openingAnimationEnd', afterOpen)
    core.on('destroy', () => core.off('openingAnimationEnd', afterOpen))
  }
  lightbox.destroy()
}

export default function PhotoSwipeExample({ level }: Props) {
  const galleryRef = useRef<HTMLDivElement>(null)
  const lightboxRef = useRef<PhotoSwipeLightbox | null>(null)
  const [includeExtra, setIncludeExtra] = useState(false)
  const [showCaption, setShowCaption] = useState(true)

  const visible = useMemo(() => visibleArtwork(artwork, level, includeExtra), [level, includeExtra])

  useEffect(() => {
    const gallery = galleryRef.current
    if (!gallery || visible.length === 0) return
    // Container-scoped selector prevents the lab shell from becoming a gallery.
    const lightbox = new PhotoSwipeLightbox({
      gallery,
      children: 'a',
      pswpModule: () => import('photoswipe'),
      bgOpacity: 0.88,
      showHideAnimationType: 'fade',
    })
    lightbox.init()
    lightboxRef.current = lightbox
    return () => {
      if (lightboxRef.current === lightbox) lightboxRef.current = null
      // Also complete destruction if cleanup interrupts the opening transition.
      disposeLightbox(lightbox)
    }
  }, [visible])

  return (
    <section aria-label="PhotoSwipe 真正图库示例">
      <h2>
        {level === 'basic'
          ? '单图灯箱'
          : level === 'business'
            ? '文章配图预览'
            : '动态图库与销毁边界'}
      </h2>
      <p>素材由页面内原始 SVG 生成，没有外部图床请求；灯箱核心在用户首次打开时按需 import。</p>
      {level !== 'basic' && (
        <label>
          <input
            type="checkbox"
            checked={showCaption}
            onChange={(e) => setShowCaption(e.target.checked)}
          />
          显示图片说明
        </label>
      )}
      {level === 'advanced' && (
        <button
          type="button"
          onClick={() => {
            lightboxRef.current?.pswp?.close()
            setIncludeExtra((value) => !value)
          }}
        >
          {includeExtra ? '移除第四张' : '添加第四张'}
        </button>
      )}
      <div
        ref={galleryRef}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 16,
          marginTop: 20,
        }}
      >
        {visible.map((item) => (
          <figure key={item.id} style={{ margin: 0 }}>
            <a
              href={item.src}
              data-pswp-width={item.width}
              data-pswp-height={item.height}
              aria-label={`打开大图：${item.alt}`}
            >
              <img
                src={item.src}
                alt={item.alt}
                loading="lazy"
                width={300}
                height={200}
                style={{
                  width: '100%',
                  height: 'auto',
                  aspectRatio: '3 / 2',
                  objectFit: 'cover',
                  borderRadius: 10,
                }}
              />
            </a>
            {showCaption && (
              <figcaption style={{ fontSize: 12 }}>
                图 {item.id} · 原创本地图像 · {item.width}×{item.height}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
      <p>
        点击图片后使用方向键切换、Esc 关闭；离开 Demo 时执行
        lightbox.destroy()，不清理其他图库或页面存储。
      </p>
    </section>
  )
}
