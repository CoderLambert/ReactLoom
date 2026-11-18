import { useFrame, useThree } from '@react-three/fiber'
import { type RefObject, useLayoutEffect, useRef, useState } from 'react'
import type { BufferGeometry, Mesh, MeshStandardMaterial } from 'three'
import { boundedFrameDelta } from './frame-policy'

export type Shape = 'box' | 'sphere'
export type SceneSnapshot = {
  generation: number
  meshUuid: string
  geometryUuid: string
  geometryType: string
  materialUuid: string
  color: string
  scale: number[]
  rotation: number[]
  vertices: number
  frameloop: string
  dpr: number
  size: { width: number; height: number }
  frameCallbacks: number
  renderFrame: number
  renderCalls: number
  contextLost: boolean
}
export type SceneAccess = { generation: number; read: () => SceneSnapshot | null }
type Props = {
  generation: number
  shape: Shape
  color: string
  speed: number
  running: boolean
  interactive: boolean
  onSelect: () => void
  accessRef: RefObject<SceneAccess | null>
}

export function ObjectMesh({
  generation,
  shape,
  color,
  speed,
  running,
  interactive,
  onSelect,
  accessRef,
}: Props) {
  const mesh = useRef<Mesh<BufferGeometry, MeshStandardMaterial>>(null)
  const callbacks = useRef(0)
  const [hover, setHover] = useState(false)
  const get = useThree((state) => state.get)
  useFrame((_state, delta) => {
    callbacks.current++
    if (!running || !mesh.current) return
    const safeDelta = boundedFrameDelta(delta)
    mesh.current.rotation.y += safeDelta * speed
    mesh.current.rotation.x += safeDelta * speed * 0.25
  })
  useLayoutEffect(() => {
    const access: SceneAccess = {
      generation,
      read() {
        const object = mesh.current
        if (!object) return null
        const state = get()
        return {
          generation,
          meshUuid: object.uuid,
          geometryUuid: object.geometry.uuid,
          geometryType: object.geometry.type,
          materialUuid: object.material.uuid,
          color: object.material.color.getHexString(),
          scale: object.scale.toArray(),
          rotation: [object.rotation.x, object.rotation.y, object.rotation.z],
          vertices: object.geometry.getAttribute('position').count,
          frameloop: state.frameloop,
          dpr: state.viewport.dpr,
          size: { width: state.size.width, height: state.size.height },
          frameCallbacks: callbacks.current,
          renderFrame: state.gl.info.render.frame,
          renderCalls: state.gl.info.render.calls,
          contextLost: state.gl.getContext().isContextLost(),
        }
      },
    }
    accessRef.current = access
    return () => {
      // An old Canvas may finish teardown after the replacement commits.
      if (accessRef.current === access) accessRef.current = null
    }
  }, [accessRef, generation, get])
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: R3F mesh is a Three object, not DOM; the parent provides an equivalent native HTML button.
    <mesh
      ref={mesh}
      name="a14-product"
      rotation={[0.15, 0.2, 0]}
      onClick={interactive ? onSelect : undefined}
      onPointerOver={interactive ? () => setHover(true) : undefined}
      onPointerOut={interactive ? () => setHover(false) : undefined}
      scale={hover ? 1.1 : 1}
    >
      {shape === 'box' ? (
        <boxGeometry args={[1.7, 1.7, 1.7]} />
      ) : (
        <sphereGeometry args={[1, 32, 20]} />
      )}
      <meshStandardMaterial color={color} roughness={0.48} metalness={0.16} />
    </mesh>
  )
}
