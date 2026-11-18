import { Canvas } from '@react-three/fiber'
import {
  Component,
  memo,
  type ReactNode,
  type RefObject,
  useCallback,
  useMemo,
  useState,
} from 'react'
import { shouldRunFrames } from './frame-policy'
import { ObjectMesh, type SceneAccess, type SceneSnapshot, type Shape } from './scene'
import { useCanvasVisibility, useDocumentVisibility, useReducedMotion } from './visibility'
import './workshop.css'

type Level = 'basic' | 'business' | 'advanced'
class SceneBoundary extends Component<{ children: ReactNode }, { message: string | null }> {
  state: { message: string | null } = { message: null }
  static getDerivedStateFromError(error: unknown) {
    return { message: error instanceof Error ? error.message : String(error) }
  }
  render() {
    return this.state.message ? (
      <p role="alert" data-testid="a14-render-error">
        WebGL场景未能启动：{this.state.message}
        。仍可使用下方HTML状态操作；停止后重新运行可重试。本例不实现丢失上下文后的自动恢复。
      </p>
    ) : (
      this.props.children
    )
  }
}

// Reading the inspector must not itself submit fresh Canvas props and request demand frames.
const CanvasScene = memo(function CanvasScene({
  level,
  sceneKey,
  running,
  speed,
  shape,
  active,
  onSelect,
  accessRef,
}: {
  level: Level
  sceneKey: number
  running: boolean
  speed: number
  shape: Shape
  active: boolean
  onSelect: () => void
  accessRef: RefObject<SceneAccess | null>
}) {
  return (
    <SceneBoundary key={sceneKey}>
      <Canvas
        data-testid="a14-canvas-host"
        frameloop={running ? 'always' : 'demand'}
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: 'low-power' }}
        camera={{ position: [0, 0, 5], fov: 50 }}
        fallback={<p>当前浏览器不能显示Canvas；下方保留HTML场景状态。</p>}
      >
        <color attach="background" args={['#eaf0e9']} />
        <ambientLight intensity={1.3} />
        <directionalLight intensity={2.5} position={[3, 3, 4]} />
        <ObjectMesh
          generation={sceneKey}
          shape={level === 'advanced' ? shape : 'box'}
          color={active ? '#c47b37' : '#267c6b'}
          speed={speed}
          running={running}
          interactive={level !== 'basic'}
          onSelect={onSelect}
          accessRef={accessRef}
        />
      </Canvas>
    </SceneBoundary>
  )
})

export default function FiberExample({ level }: { level: Level }) {
  const reduced = useReducedMotion()
  const visible = useDocumentVisibility()
  const { containerRef, inViewport } = useCanvasVisibility()
  const [paused, setPaused] = useState(false)
  const [speed, setSpeed] = useState(0.9)
  const [shape, setShape] = useState<Shape>('box')
  const [active, setActive] = useState(false)
  const [sceneKey, setSceneKey] = useState(0)
  // The replaced Canvas keeps its own ref, including any deferred SDK teardown.
  // biome-ignore lint/correctness/useExhaustiveDependencies: sceneKey deliberately replaces this owned ref together with its Canvas.
  const accessRef = useMemo<RefObject<SceneAccess | null>>(() => ({ current: null }), [sceneKey])
  const [snapshot, setSnapshot] = useState<SceneSnapshot | null>(null)
  const select = useCallback(() => setActive((value) => !value), [])
  const running =
    level === 'advanced' &&
    shouldRunFrames({ paused, reducedMotion: reduced, visible: visible && inViewport, speed })
  function inspect() {
    const access = accessRef.current
    setSnapshot(access?.generation === sceneKey ? access.read() : null)
  }
  return (
    <section
      className="a14-workshop"
      aria-label="React Three Fiber 实战"
      data-testid="a14-workshop"
    >
      <h2>
        {level === 'basic'
          ? 'JSX构建Mesh、几何与灯光'
          : level === 'business'
            ? '射线命中与React业务状态'
            : '帧循环、几何更新与卸载'}
      </h2>
      <p>
        React声明场景和业务状态，Fiber协调真实Three对象与默认WebGLRenderer。原生WebGL需要环境支持；没有远程模型、纹理、drei或网络请求。
      </p>
      <div className="demo-controls">
        {level !== 'basic' && (
          <button type="button" aria-pressed={active} onClick={() => setActive((value) => !value)}>
            {active ? '设为未处理' : '设为已处理'}
          </button>
        )}
        {level === 'advanced' && (
          <>
            <label>
              角速度{' '}
              <input
                aria-label="角速度"
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={speed}
                onChange={(event) => setSpeed(Number(event.target.value))}
              />
              {speed.toFixed(1)}
            </label>
            <label>
              几何体
              <select
                value={shape}
                onChange={(event) => setShape(event.target.value === 'sphere' ? 'sphere' : 'box')}
              >
                <option value="box">盒体</option>
                <option value="sphere">球体</option>
              </select>
            </label>
            <button
              type="button"
              aria-pressed={paused}
              onClick={() => setPaused((value) => !value)}
            >
              {paused ? '继续' : '暂停'}
            </button>
            <button
              type="button"
              onClick={() => {
                setSceneKey((value) => value + 1)
                setActive(false)
                setPaused(false)
                setSnapshot(null)
              }}
            >
              重新挂载场景
            </button>
          </>
        )}
      </div>
      <div ref={containerRef} className="a14-stage" data-testid="a14-stage">
        <CanvasScene
          level={level}
          sceneKey={sceneKey}
          running={running}
          speed={speed}
          shape={shape}
          active={active}
          onSelect={select}
          accessRef={accessRef}
        />
      </div>
      <p role="status" data-testid="a14-status">
        模型：{level === 'advanced' ? shape : 'box'}；处理状态：{active ? '已处理' : '未处理'}
        ；动画：
        {running
          ? '运行'
          : level === 'advanced'
            ? '暂停（用户/系统减动/离屏/速度门闩）'
            : '静态按需'}
        ；画布在视口内：{inViewport ? '是' : '否'}。
      </p>
      <p>
        basic观察声明式对象；business悬停放大、点击或用HTML按钮切换颜色；advanced才持续旋转。HTML状态是React输入，真实Three对象值请主动读取。
      </p>
      <details>
        <summary>查看真实Three对象和帧状态</summary>
        <button type="button" onClick={inspect}>
          读取真实场景
        </button>
        <p>
          只读快照，操作后重新读取；null表示本代场景尚未提交。UUID/颜色/顶点和renderer.info来自实际对象；frameCallbacks是本例useFrame回调累计次数，不是GPU耗电或显存指标。
        </p>
        <pre data-testid="a14-sdk-state">{JSON.stringify(snapshot, null, 2)}</pre>
      </details>
      <p>
        减少动态、文档隐藏、离屏、暂停或零速度使advanced切为demand；仍允许必要的属性更新帧。useFrame只改ref，不逐帧setState。重挂载用于学习释放，产品优先在同一Canvas换子场景。
      </p>
    </section>
  )
}
