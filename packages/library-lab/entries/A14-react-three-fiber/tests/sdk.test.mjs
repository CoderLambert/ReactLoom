import assert from 'node:assert/strict'
import test from 'node:test'
import { applyProps, buildGraph, dispose } from '@react-three/fiber'
import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three'

// Actual R3F object helpers + actual Three objects, without a renderer or substitute GL.
// This does not execute Canvas reconciliation, useFrame, raycasting events or WebGL.
test('real R3F applyProps maps declarative transforms and material color onto Three objects', () => {
  const geometry = new BoxGeometry(1.7, 1.7, 1.7)
  const material = new MeshStandardMaterial()
  const mesh = new Mesh(geometry, material)
  try {
    applyProps(mesh, { name: 'a14-product', rotation: [0.15, 0.2, 0], scale: 1.1 })
    applyProps(material, { color: '#267c6b', roughness: 0.48, metalness: 0.16 })
    assert.equal(mesh.name, 'a14-product')
    assert.deepEqual(mesh.scale.toArray(), [1.1, 1.1, 1.1])
    assert.deepEqual(mesh.rotation.toArray().slice(0, 3), [0.15, 0.2, 0])
    assert.equal(material.color.getHexString(), '267c6b')
    const sameMaterial = mesh.material
    applyProps(material, { color: '#c47b37' })
    assert.equal(mesh.material, sameMaterial)
    assert.equal(material.color.getHexString(), 'c47b37')
    console.log(
      'Actual Three:',
      JSON.stringify({
        geometry: geometry.type,
        vertices: geometry.getAttribute('position').count,
        color: material.color.getHexString(),
        scale: mesh.scale.toArray(),
      }),
    )
  } finally {
    geometry.dispose()
    material.dispose()
  }
})
test('real R3F buildGraph returns named object identities; explicit helper disposal emits actual Three events', () => {
  const geometry = new BoxGeometry()
  const material = new MeshStandardMaterial()
  material.name = 'a14-material'
  const mesh = new Mesh(geometry, material)
  mesh.name = 'a14-product'
  const root = new Group()
  root.add(mesh)
  let geometryDisposals = 0
  let materialDisposals = 0
  geometry.addEventListener('dispose', () => geometryDisposals++)
  material.addEventListener('dispose', () => materialDisposals++)
  try {
    const graph = buildGraph(root)
    assert.equal(graph.nodes['a14-product'], mesh)
    assert.equal(graph.meshes['a14-product'], mesh)
    assert.equal(graph.materials['a14-material'], material)
  } finally {
    // Only our own CPU objects. No Canvas root or shared cache is involved.
    dispose(mesh)
    root.remove(mesh)
  }
  assert.equal(geometryDisposals, 1)
  assert.equal(materialDisposals, 1)
})
