import type { GraphData } from '@antv/g6'

export type Level = 'basic' | 'business' | 'advanced'
export function createGraphData(level: Level, extended: boolean): GraphData {
  const steps = [
    { id: 'source', label: 'RSS来源' },
    { id: 'parse', label: '正文解析' },
    ...(level !== 'basic' && extended ? [{ id: 'review', label: '质量审校' }] : []),
    { id: 'index', label: '内容索引' },
  ]
  return {
    nodes: steps.map((step, index) => ({
      id: step.id,
      data: { label: step.label },
      style: { x: 100 + index * 142, y: index % 2 ? 160 : 110, labelText: step.label },
    })),
    edges: steps.slice(1).map((step, index) => ({
      id: `edge-${steps[index].id}-${step.id}`,
      source: steps[index].id,
      target: step.id,
    })),
  }
}
