import * as THREE from 'three'

export function buildGeometry(shape: 'box' | 'sphere') {
  return shape === 'sphere'
    ? new THREE.SphereGeometry(1.05, 32, 16)
    : new THREE.BoxGeometry(1.65, 1.65, 1.65)
}
