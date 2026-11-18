import {
  Alignment,
  EventType,
  type Fit,
  Layout,
  RuntimeLoader,
  useRive,
} from '@rive-app/react-webgl2'
import {
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react'
import { RIVE_SAMPLE_STATE_MACHINE, RIVE_SAMPLE_URL } from './asset'

type Instance = NonNullable<ReturnType<typeof useRive>['rive']>
export type PlayerSnapshot = {
  instance: string
  objectIdentity: number
  artboard: string
  stateMachines: string[]
  contractMatches: boolean
  isPlaying: boolean
  isPaused: boolean
  isStopped: boolean
  playingMachines: string[]
  pausedMachines: string[]
  bounds: { minX: number; minY: number; maxX: number; maxY: number } | null
  fit: string
  canvas: { width: number; height: number; cssWidth: number; cssHeight: number } | null
  observedAdvanceEvents: number
  observedPlayEvents: number
  observedPauseEvents: number
  wasmUrl: string
  wasmFallbackUrl: string | null
}
export type PlayerProbe = { instance: string; read: () => PlayerSnapshot | null }
type Props = {
  playing: boolean
  fit: Fit
  probeRef: RefObject<PlayerProbe | null>
  onError: (message: string) => void
  onSnapshot: (snapshot: PlayerSnapshot) => void
  onDetached: (instance: string) => void
}

/** The React SDK owns its instance. App cleanup only removes app listeners and its read handle. */
export function RivePlayer({ playing, fit, probeRef, onError, onSnapshot, onDetached }: Props) {
  const instance = useId() // App observation identity, not an SDK instance id.
  const alive = useRef(true)
  const runtime = useRef<Instance | null>(null)
  const identities = useRef(new WeakMap<Instance, number>())
  const nextIdentity = useRef(0)
  const contractMatches = useRef(false)
  const advances = useRef(0)
  const plays = useRef(0)
  const pauses = useRef(0)
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      onDetached(instance)
    }
  }, [instance, onDetached])
  const read = useCallback((): PlayerSnapshot | null => {
    const value = runtime.current
    if (!value || !alive.current) return null
    const canvas = host.current?.querySelector('canvas')
    const bounds = value.bounds
    return {
      instance,
      objectIdentity: identities.current.get(value) ?? 0,
      artboard: value.activeArtboard,
      stateMachines: [...value.stateMachineNames],
      contractMatches: value.stateMachineNames.includes(RIVE_SAMPLE_STATE_MACHINE),
      isPlaying: value.isPlaying,
      isPaused: value.isPaused,
      isStopped: value.isStopped,
      playingMachines: [...value.playingStateMachineNames],
      pausedMachines: [...value.pausedStateMachineNames],
      bounds: bounds
        ? { minX: bounds.minX, minY: bounds.minY, maxX: bounds.maxX, maxY: bounds.maxY }
        : null,
      fit: value.layout.fit,
      canvas: canvas
        ? {
            width: canvas.width,
            height: canvas.height,
            cssWidth: canvas.clientWidth,
            cssHeight: canvas.clientHeight,
          }
        : null,
      observedAdvanceEvents: advances.current,
      observedPlayEvents: plays.current,
      observedPauseEvents: pauses.current,
      wasmUrl: RuntimeLoader.getWasmUrl(),
      wasmFallbackUrl: RuntimeLoader.getWasmFallbackUrl(),
    }
  }, [instance])
  const publish = useCallback(() => {
    if (!alive.current) return
    try {
      const next = read()
      if (next) onSnapshot(next)
    } catch (error) {
      onError(`Rive实际对象读取失败：${String(error)}`)
    }
  }, [read, onSnapshot, onError])
  useLayoutEffect(() => {
    const probe = { instance, read }
    probeRef.current = probe
    return () => {
      if (probeRef.current === probe) probeRef.current = null
    }
  }, [instance, probeRef, read])
  const layout = useMemo(() => new Layout({ fit, alignment: Alignment.Center }), [fit])
  const { rive, RiveComponent } = useRive(
    {
      src: RIVE_SAMPLE_URL,
      stateMachine: RIVE_SAMPLE_STATE_MACHINE,
      layout,
      autoplay: false,
      onLoadError: (error) => {
        if (alive.current) onError(`Rive资源/渲染失败：${String(error.data ?? error)}`)
      },
    },
    { useOffscreenRenderer: true },
  )
  useLayoutEffect(() => {
    if (!rive) return
    // The hook-selected loaded instance is the authority, rather than a late load callback.
    runtime.current = rive
    if (!identities.current.has(rive)) identities.current.set(rive, ++nextIdentity.current)
    contractMatches.current = rive.stateMachineNames.includes(RIVE_SAMPLE_STATE_MACHINE)
    if (contractMatches.current) onError('')
    else onError(`资源已加载，但预期状态机${RIVE_SAMPLE_STATE_MACHINE}不在实际SDK列表中`)
    publish()
    // In WebGL2 2.45.0 Draw is an enum member without a dispatch site.
    // Advance is actually emitted, but does not prove renderer/pixel output.
    const advance = () => {
      advances.current++
    }
    const play = () => {
      plays.current++
      publish()
    }
    const pause = () => {
      pauses.current++
      publish()
    }
    rive.on(EventType.Advance, advance)
    rive.on(EventType.Play, play)
    rive.on(EventType.Pause, pause)
    return () => {
      rive.off(EventType.Advance, advance)
      rive.off(EventType.Play, play)
      rive.off(EventType.Pause, pause)
      if (runtime.current === rive) runtime.current = null
    }
  }, [rive, publish, onError])
  useEffect(() => {
    if (!rive) return
    try {
      rive.layout = layout
      publish()
    } catch (error) {
      if (alive.current) onError(`Rive布局更新失败：${String(error)}`)
    }
  }, [rive, layout, publish, onError])
  useEffect(() => {
    if (!rive || !contractMatches.current) return
    try {
      if (playing) rive.play()
      else rive.pause()
      publish()
    } catch (error) {
      if (alive.current) onError(`Rive播放控制失败：${String(error)}`)
    }
  }, [rive, playing, publish, onError])
  return (
    <div ref={host} className="ab-rive-canvas" data-testid="b05-player" aria-hidden="true">
      <RiveComponent data-testid="b05-canvas" />
    </div>
  )
}
