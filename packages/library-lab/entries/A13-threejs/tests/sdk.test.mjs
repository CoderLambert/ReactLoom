import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { buildGeometry } from '../examples/geometry.ts'

test('real geometry attributes change from box to sphere, disposal is an actual SDK event', () => {
  const box = buildGeometry('box'),
    sphere = buildGeometry('sphere')
  const events = []
  try {
    assert.equal(THREE.REVISION, '186')
    assert.equal(box.type, 'BoxGeometry')
    assert.equal(sphere.type, 'SphereGeometry')
    assert.equal(box.getAttribute('position').count, 24)
    assert.ok(sphere.getAttribute('position').count > box.getAttribute('position').count)
    box.addEventListener('dispose', () => events.push(box.uuid))
    box.dispose()
    assert.deepEqual(events, [box.uuid])
  } finally {
    sphere.dispose()
  }
})

test('real camera projection and shared material stay independent of geometry replacement', () => {
  const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(50, 2, 0.1, 100)
  const material = new THREE.MeshStandardMaterial({ color: '#227b68' })
  const geometry = buildGeometry('box'),
    next = buildGeometry('sphere')
  const mesh = new THREE.Mesh(geometry, material)
  try {
    scene.add(mesh)
    camera.position.set(0, 0, 5)
    camera.updateMatrixWorld()
    assert.equal(new THREE.Vector3(0, 0, 0).project(camera).x, 0)
    const previous = camera.projectionMatrix.elements[0]
    camera.aspect = 1
    camera.updateProjectionMatrix()
    assert.equal(camera.projectionMatrix.elements[0], previous * 2)
    material.color.set('#c07b37')
    assert.equal(material.color.getHexString(), 'c07b37')
    mesh.geometry = next
    assert.equal(mesh.material, material)
    assert.equal(scene.children[0], mesh)
    scene.remove(mesh)
    assert.equal(scene.children.length, 0)
  } finally {
    mesh.dispose()
    geometry.dispose()
    next.dispose()
    material.dispose()
  }
})
