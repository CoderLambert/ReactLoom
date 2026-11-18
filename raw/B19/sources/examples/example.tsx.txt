import useEmblaCarousel from 'embla-carousel-react'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { allocateSlideId, boundedSnap, carouselArrow } from './slide-policy'

type Level = 'basic' | 'business' | 'advanced'
type Slide = { id: number; title: string; description: string; category: string }
type Reading = {
  selectedSnap: number
  snapPositions: number[]
  scrollProgress: number
  canPrevious: boolean
  canNext: boolean
  slideIds: string[]
  visibleSlideIndices: number[]
  viewportWidth: number
  trackWidth: number
}
const originals: Slide[] = [
  {
    id: 1,
    title: 'React 性能与测量',
    description: '如何识别实际渲染瓶颈而不盲目优化。',
    category: '性能',
  },
  {
    id: 2,
    title: '请求的取消与重试',
    description: 'AbortSignal、timeout 和旧结果回写。',
    category: '网络',
  },
  { id: 3, title: '可访问交互', description: '触摸滑动和键盘控件同时存在。', category: '交互' },
  { id: 4, title: '契约化测试', description: '让 Playwright 验证真实业务场景。', category: '测试' },
]

export default function EmblaExample({ level }: { level: Level }) {
  const headingId = useId()
  const [slides, setSlides] = useState<Slide[]>(originals)
  const [selected, setSelected] = useState(0)
  const [resetEpoch, setResetEpoch] = useState(0)
  const appliedReset = useRef(0)
  const lastAllocated = useRef(4)
  const slideSignature = slides.map((item) => item.id).join(',')
  const [canPrevious, setCanPrevious] = useState(false)
  const [canNext, setCanNext] = useState(true)
  const [snapCount, setSnapCount] = useState(0)
  const [slideBasis, setSlideBasis] = useState<'82%' | '48%'>('82%')
  const [reading, setReading] = useState<Reading | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const viewport = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncMotion = () => setReducedMotion(media.matches)
    syncMotion()
    media.addEventListener('change', syncMotion)
    return () => media.removeEventListener('change', syncMotion)
  }, [])

  const options = useMemo(
    () => ({
      align: 'start' as const,
      containScroll: 'trimSnaps' as const,
      loop: level === 'advanced',
      // React controls this list; one effect below remeasures after committed changes.
      // The SDK still observes genuine viewport resize through its default watchResize.
      watchSlides: false,
    }),
    [level],
  )
  const [emblaRef, emblaApi] = useEmblaCarousel(options)
  const attachViewport = useCallback(
    (element: HTMLElement | null) => {
      viewport.current = element
      emblaRef(element)
    },
    [emblaRef],
  )

  useEffect(() => {
    if (!emblaApi) return
    const sync = () => {
      const count = emblaApi.scrollSnapList().length
      setSelected(boundedSnap(emblaApi.selectedScrollSnap(), count))
      setCanPrevious(emblaApi.canScrollPrev())
      setCanNext(emblaApi.canScrollNext())
      setSnapCount(count)
    }
    const element = viewport.current
    const onDestroy = () => {
      if (element) element.dataset.emblaDestroyed = 'true'
    }
    sync()
    emblaApi.on('select', sync)
    emblaApi.on('reInit', sync)
    emblaApi.on('destroy', onDestroy)
    return () => {
      emblaApi.off('select', sync)
      emblaApi.off('reInit', sync)
      emblaApi.off('destroy', onDestroy)
    }
  }, [emblaApi])

  // biome-ignore lint/correctness/useExhaustiveDependencies: remeasure only after React commits the changed slide identity list
  useEffect(() => {
    if (!emblaApi) return
    emblaApi.reInit()
    if (appliedReset.current !== resetEpoch) {
      appliedReset.current = resetEpoch
      emblaApi.scrollTo(0, true)
    }
    setReading(null)
  }, [emblaApi, slideSignature, resetEpoch])

  function append() {
    if (slides.length >= 24) return
    const id = allocateSlideId(
      lastAllocated.current,
      slides.map((item) => item.id),
    )
    lastAllocated.current = id
    setSlides((items) =>
      items.length >= 24
        ? items
        : [
            ...items,
            {
              id,
              title: '新的学习专题',
              description: '列表状态更新后由引擎重新计算滚动吸附点。',
              category: '动态内容',
            },
          ],
    )
  }

  function readEngine() {
    if (!emblaApi) return
    setReading({
      selectedSnap: emblaApi.selectedScrollSnap(),
      snapPositions: [...emblaApi.scrollSnapList()],
      scrollProgress: emblaApi.scrollProgress(),
      canPrevious: emblaApi.canScrollPrev(),
      canNext: emblaApi.canScrollNext(),
      slideIds: emblaApi.slideNodes().map((node) => node.dataset.slideId ?? ''),
      visibleSlideIndices: [...emblaApi.slidesInView()],
      viewportWidth: emblaApi.rootNode().clientWidth,
      trackWidth: emblaApi.containerNode().clientWidth,
    })
  }

  return (
    <section
      aria-labelledby={headingId}
      aria-roledescription="轮播"
      data-testid="b19-workshop"
      data-reduced={reducedMotion}
      data-requested-loop={level === 'advanced'}
    >
      <h2 id={headingId}>
        {level === 'advanced' ? '动态卡片、循环条件与重新测量' : '测量、吸附与手动导航'}
      </h2>
      <p>真实 Embla 8.6.0 测量 DOM 并处理拖动；四张原创文字卡片是内存数据，没有自动播放。</p>
      {/* biome-ignore lint/a11y/useSemanticElements: a viewport navigation group is not a form fieldset */}
      <div
        ref={attachViewport}
        data-testid="b19-viewport"
        data-embla-destroyed="false"
        role="group"
        aria-label="专题滑动区域"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: this named viewport intentionally owns its local arrow-key navigation
        tabIndex={0}
        onKeyDown={(event) => {
          const direction = carouselArrow(
            event.key,
            event.target === event.currentTarget,
            canPrevious,
            canNext,
          )
          if (!direction || !emblaApi) return
          event.preventDefault()
          if (direction === 'prev') emblaApi.scrollPrev(reducedMotion)
          else emblaApi.scrollNext(reducedMotion)
        }}
        style={{ overflow: 'hidden', borderRadius: 10, border: '1px solid #dbe3d8' }}
      >
        <div data-testid="b19-track" style={{ display: 'flex', touchAction: 'pan-y pinch-zoom' }}>
          {slides.map((item, index) => (
            // biome-ignore lint/a11y/useSemanticElements: carousel slides use the APG group role; a fieldset would imply form controls
            <article
              key={item.id}
              data-slide-id={item.id}
              role="group"
              aria-roledescription="幻灯片"
              aria-label={`第 ${index + 1} 张，共 ${slides.length} 张：${item.title}`}
              style={{
                boxSizing: 'border-box',
                flex: `0 0 ${slideBasis}`,
                minWidth: 0,
                minHeight: 178,
                marginRight: '2%',
                padding: '18px 20px',
                background: '#f0f7f1',
                borderRight: '1px solid #d6e4d7',
              }}
            >
              <small style={{ color: '#456b55' }}>
                {item.category} · {item.id}
              </small>
              <h3 style={{ marginTop: 16, fontSize: 19 }}>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </div>
      <div
        className="demo-controls"
        style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginTop: 15 }}
      >
        <button
          type="button"
          disabled={!emblaApi || !canPrevious}
          onClick={() => emblaApi?.scrollPrev(reducedMotion)}
        >
          ← 上一张
        </button>
        <button
          type="button"
          disabled={!emblaApi || !canNext}
          onClick={() => emblaApi?.scrollNext(reducedMotion)}
        >
          下一张 →
        </button>
        <label>
          卡片宽度{' '}
          <select
            value={slideBasis}
            onChange={(event) => setSlideBasis(event.currentTarget.value === '48%' ? '48%' : '82%')}
          >
            <option value="82%">82% · 一张为主</option>
            <option value="48%">48% · 同屏多张</option>
          </select>
        </label>
        <button type="button" disabled={!emblaApi} onClick={readEngine}>
          读取真实引擎
        </button>
        <output aria-live="polite" data-testid="b19-position">
          {emblaApi && snapCount > 0
            ? `当前第 ${Math.min(selected + 1, snapCount)} 个吸附位置，共 ${snapCount} 个；卡片 ${slides.length} 张`
            : '轮播初始化中'}
        </output>
      </div>
      {level === 'advanced' && (
        <div
          className="demo-controls"
          style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}
        >
          <button type="button" disabled={slides.length >= 24} onClick={append}>
            添加卡片
          </button>
          <button
            type="button"
            disabled={slides.length === 1}
            onClick={() => setSlides((items) => (items.length > 1 ? items.slice(0, -1) : items))}
          >
            移除最后一张
          </button>
          <button
            type="button"
            onClick={() => {
              setSlides(originals)
              setResetEpoch((epoch) => epoch + 1)
            }}
          >
            恢复默认卡片
          </button>
          <p>
            请求开启循环不保证一张卡片也能循环。内容不足时 SDK
            会退回非循环，实际以上下按钮与引擎读数为准。
          </p>
        </div>
      )}
      {reading && (
        <pre data-testid="b19-reading" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
          {JSON.stringify(reading, null, 2)}
        </pre>
      )}
      <p>
        读数是点击时的实际 SDK 快照，visibleSlideIndices 是可见卡片索引，selectedSnap
        是吸附位置索引。减少动态偏好下按钮和方向键即时跳转；拖动区保留纵向触摸滚动。
      </p>
    </section>
  )
}
