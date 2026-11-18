import assert from 'node:assert/strict'
import test from 'node:test'
import { Graph } from '@antv/g6'
import { createGraphData } from '../examples/graph-data.ts'

// Actual G6 data model only. No render(), fake DOM, Canvas or WebGL backend.
test('real 5.1.1 Graph exposes stable nodes and directed edges from the Demo fixture', () => {
  const graph = new Graph({ animation: false, data: createGraphData('basic', false) })
  try {
    assert.equal(typeof document, 'undefined')
    assert.equal(graph.rendered, false)
    assert.deepEqual(
      graph.getNodeData().map((node) => node.id),
      ['source', 'parse', 'index'],
    )
    assert.deepEqual(
      graph.getRelatedEdgesData('parse', 'out').map((edge) => edge.target),
      ['index'],
    )
    assert.deepEqual(
      graph.getRelatedEdgesData('parse', 'in').map((edge) => edge.source),
      ['source'],
    )
  } finally {
    graph.destroy()
  }
  assert.equal(graph.destroyed, true)
})
test('real setData replaces the topology on the same model and removes obsolete edges', () => {
  const graph = new Graph({ animation: false, data: createGraphData('business', false) })
  try {
    const sameInstance = graph
    graph.setData(createGraphData('business', true))
    assert.equal(graph, sameInstance)
    assert.deepEqual(
      graph
        .getNodeData()
        .map((node) => node.id)
        .sort(),
      ['index', 'parse', 'review', 'source'],
    )
    assert.deepEqual(
      graph.getRelatedEdgesData('parse', 'out').map((edge) => edge.target),
      ['review'],
    )
    assert.deepEqual(
      graph.getRelatedEdgesData('review', 'out').map((edge) => edge.target),
      ['index'],
    )
    graph.setData(createGraphData('business', false))
    assert.deepEqual(
      graph.getNodeData().map((node) => node.id),
      ['source', 'parse', 'index'],
    )
    assert.equal(
      graph.getEdgeData().some((edge) => edge.source === 'review' || edge.target === 'review'),
      false,
    )
  } finally {
    graph.destroy()
  }
})
test('real Graph model preserves all endpoint IDs and remains unrendered without a graphics backend', () => {
  const fixture = createGraphData('advanced', true)
  const graph = new Graph({ animation: false, data: fixture })
  try {
    const data = graph.getData()
    const ids = new Set(data.nodes.map((node) => node.id))
    assert.ok(data.edges.every((edge) => ids.has(edge.source) && ids.has(edge.target)))
    assert.equal(data.edges.length, 3)
    assert.equal(data.nodes[0].style.x, 100)
    assert.equal(graph.rendered, false, 'model evidence is not visual render evidence')
  } finally {
    graph.destroy()
  }
})
