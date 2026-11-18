import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { shouldRunFrameLoop } from './animation-policy'
import { buildGeometry } from './geometry'
import './workshop.css'

type Level = 'basic' | 'business' | 'advanced'
type Runtime = {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>
  draw: (time: number) => void
  frame: () => void
  syncAnimation: () => void
  geometryDisposals: number
  materialDisposals: number
  loopActive: () => boolean
}
function readRuntime(data: Runtime | null) {
  if (!data) return null
  const { renderer, mesh, camera } = data
  return {
    geometry: {
      uuid: mesh.geometry.uuid,
      type: mesh.geometry.type,
      positions: mesh.geometry.getAttribute('position').count,
    },
    mesh: mesh.uuid,
    material: mesh.material.uuid,
    color: mesh.material.color.getHexString(),
    rotation: { x: mesh.rotation.x, y: mesh.rotation.y },
    size: renderer.getSize(new THREE.Vector2()).toArray(),
    drawingBuffer: renderer.getDrawingBufferSize(new THREE.Vector2()).toArray(),
    pixelRatio: renderer.getPixelRatio(),
    cameraAspect: camera.aspect,
    render: { ...renderer.info.render },
    memory: { ...renderer.info.memory },
    geometryDisposals: data.geometryDisposals,
    materialDisposals: data.materialDisposals,
    loopActive: data.loopActive(),
  }
}
export default function ThreeExample({ level }: { level: Level }) {
  const host = useRef<HTMLDivElement>(null)
  const runtime = useRef<Runtime | null>(null)
  const [shape, setShape] = useState<'box' | 'sphere'>('box')
  const geometryShape = useRef<'box' | 'sphere'>('box')
  const [speed, setSpeed] = useState(0.7)
  const [playing, setPlaying] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [overrideMotion, setOverrideMotion] = useState(false)
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || !document.hidden)
  const [error, setError] = useState('')
  const [color, setColor] = useState('#227b68')
  const [snapshot, setSnapshot] = useState<ReturnType<typeof readRuntime>>(null)
  const [narrow, setNarrow] = useState(false)
  const playingRef = useRef(playing)
  const reducedRef = useRef(reducedMotion)
  const overrideRef = useRef(overrideMotion)
  const currentSpeed = useRef(speed)
  useEffect(() => {
    currentSpeed.current = speed
    runtime.current?.syncAnimation()
  }, [speed])
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReducedMotion(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])
  useEffect(() => {
    const container = host.current
    if (!container) return
    setError('')
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#eaf0e9')
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
    camera.position.set(0, 0, 5)
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'WebGL 无法初始化')
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;'
    renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(renderer.domElement)
    const geometry = buildGeometry('box')
    const material = new THREE.MeshStandardMaterial({
      color: '#227b68',
      roughness: 0.5,
      metalness: 0.18,
    })
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)
    scene.add(new THREE.HemisphereLight(0xffffff, 0x5a695f, 2))
    const light = new THREE.DirectionalLight(0xffffff, 2.5)
    light.position.set(3, 4, 5)
    scene.add(light)
    let last = 0
    let loopActive = false
    const frame = () => renderer.render(scene, camera)
    const draw = (time: number) => {
      const delta = last ? Math.min((time - last) / 1000, 0.1) : 0
      last = time
      mesh.rotation.y += delta * currentSpeed.current
      mesh.rotation.x += delta * currentSpeed.current * 0.45
      frame()
    }
    const data: Runtime = {
      renderer,
      scene,
      camera,
      mesh,
      draw,
      frame,
      syncAnimation: () => {},
      geometryDisposals: 0,
      materialDisposals: 0,
      loopActive: () => loopActive,
    }
    geometry.addEventListener('dispose', () => {
      data.geometryDisposals++
    })
    material.addEventListener('dispose', () => {
      data.materialDisposals++
    })
    runtime.current = data
    geometryShape.current = 'box'
    const resize = () => {
      if (runtime.current !== data) return
      const width = Math.max(1, container.clientWidth)
      const height = Math.max(1, container.clientHeight)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
      frame()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    resize()
    const syncAnimation = () => {
      if (runtime.current !== data) return
      const active = shouldRunFrameLoop(
        {
          playing: playingRef.current,
          visible: !document.hidden,
          reducedMotion: reducedRef.current,
          overrideMotion: overrideRef.current,
        },
        currentSpeed.current,
      )
      if (active !== loopActive) {
        if (active) last = 0
        renderer.setAnimationLoop(active ? draw : null)
        loopActive = active
        if (!active) frame()
      }
      setVisible(!document.hidden)
    }
    data.syncAnimation = syncAnimation
    document.addEventListener('visibilitychange', syncAnimation)
    syncAnimation()
    return () => {
      renderer.setAnimationLoop(null)
      observer.disconnect()
      document.removeEventListener('visibilitychange', syncAnimation)
      scene.remove(mesh)
      mesh.dispose()
      mesh.geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.dataset.threeCleanup = JSON.stringify({
        geometryDisposals: data.geometryDisposals,
        materialDisposals: data.materialDisposals,
      })
      renderer.domElement.remove()
      if (runtime.current === data) runtime.current = null
    }
  }, [])
  useEffect(() => {
    playingRef.current = playing
    reducedRef.current = reducedMotion
    overrideRef.current = overrideMotion
    runtime.current?.syncAnimation()
  }, [playing, reducedMotion, overrideMotion])
  useEffect(() => {
    const r = runtime.current
    if (!r) return
    const nextShape = level === 'advanced' ? shape : 'box'
    if (nextShape === geometryShape.current) return
    const previous = r.mesh.geometry
    const next = buildGeometry(nextShape)
    next.addEventListener('dispose', () => {
      r.geometryDisposals++
    })
    r.mesh.geometry = next
    geometryShape.current = nextShape
    previous.dispose()
    r.frame()
  }, [shape, level])
  useEffect(() => {
    const r = runtime.current
    if (!r) return
    r.mesh.material.color.set(color)
    r.frame()
  }, [color])
  return (
    <section className="a13-workshop" aria-label="Three.js 真实三维场景">
      <h2>{level === 'advanced' ? '循环、几何替换与资源所有权' : '网格、相机与材质'}</h2>
      <p>真实 Three.js WebGLRenderer + Scene + Mesh；没有远程模型或材质请求。</p>
      <div className="demo-controls">
        <label>
          转速{' '}
          <input
            type="range"
            min="0"
            max="3"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
          {speed.toFixed(1)}
        </label>
        <label>
          材质颜色{' '}
          <select value={color} onChange={(e) => setColor(e.target.value)}>
            <option value="#227b68">绿色</option>
            <option value="#c07b37">橙色</option>
            <option value="#4b63aa">蓝色</option>
          </select>
        </label>
        {level === 'advanced' && (
          <>
            <label>
              几何体
              <select value={shape} onChange={(e) => setShape(e.target.value as 'box' | 'sphere')}>
                <option value="box">盒体</option>
                <option value="sphere">球体</option>
              </select>
            </label>
            <button type="button" aria-pressed={playing} onClick={() => setPlaying((v) => !v)}>
              {playing ? '暂停动画' : '继续动画'}
            </button>
            <label>
              <input
                type="checkbox"
                checked={overrideMotion}
                onChange={(e) => setOverrideMotion(e.target.checked)}
              />
              允许显式覆盖减少动态偏好
            </label>
          </>
        )}
      </div>
      <button type="button" onClick={() => setNarrow((old) => !old)}>
        {narrow ? '恢复渲染容器' : '缩窄渲染容器'}
      </button>
      <div
        ref={host}
        data-testid="a13-canvas-host"
        role="img"
        aria-label="可旋转的三维几何体；下方提供当前参数"
        style={{
          width: narrow ? '65%' : '100%',
          height: 280,
          background: '#eaf0e9',
          borderRadius: 10,
          overflow: 'hidden',
        }}
      />
      {error && <p role="alert">WebGL不可用：{error}。可从下方读取参数。</p>}
      <p role="status">
        网格：{level === 'advanced' ? shape : 'box'}；颜色：{color}；角速度：{speed}；动画：
        {shouldRunFrameLoop({ playing, visible, reducedMotion, overrideMotion }, speed)
          ? '运行'
          : '暂停'}
        ；减少动态：{reducedMotion ? '开启' : '关闭'}。
      </p>
      <details>
        <summary>查看真实渲染器与资源</summary>
        <button type="button" onClick={() => setSnapshot(readRuntime(runtime.current))}>
          读取当前渲染状态
        </button>
        <pre data-testid="a13-sdk-state">{JSON.stringify(snapshot, null, 2)}</pre>
        <p>这是显式读取的快照；dispose事件与renderer.info计数不表示显存字节。</p>
      </details>
      <p>
        窗口和容器变化自动resize；后台和系统减少动态时停止动画循环，保留静态帧；仅高级操作可显式覆盖减少动态。退出Tab后停止动画、断开监听并dispose几何体、材质和渲染器。
      </p>
    </section>
  )
}
