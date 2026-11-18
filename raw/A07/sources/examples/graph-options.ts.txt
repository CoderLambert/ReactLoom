import type { GraphData, GraphOptions } from '@antv/g6'

export function createGraphOptions(
  container: HTMLElement,
  width: number,
  data: GraphData,
): GraphOptions {
  return {
    container,
    width,
    height: 330,
    data,
    animation: false,
    autoFit: { type: 'view', animation: false },
    padding: 24,
    node: {
      type: 'circle',
      style: { size: 42, fill: '#d9e7df', stroke: '#326b57', lineWidth: 2 },
      state: { selected: { fill: '#ffe4ad', stroke: '#955d13', lineWidth: 3 } },
    },
    edge: { type: 'line', style: { stroke: '#6c9380', lineWidth: 2, endArrow: true } },
    behaviors: ['drag-canvas', 'zoom-canvas'],
  }
}
