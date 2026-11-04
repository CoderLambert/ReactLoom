/** Fresh demo graphs on every level switch/reset: never reuse mutated SDK node objects. */
export type PresetNode = {readonly id: string; readonly position: {readonly x: number; readonly y: number}; readonly data: Record<string, unknown>};
export type PresetEdge = {readonly id: string; readonly source: string; readonly target: string};
export type PresetLevel = 'basic' | 'business' | 'advanced';
export function cloneWorkflowPreset<N extends PresetNode, E extends PresetEdge>(
  initialNodes: readonly N[], initialEdges: readonly E[], level: PresetLevel,
): {nodes: N[]; edges: E[]} {
  const selected = level === 'basic' ? initialNodes.slice(0,2) : initialNodes;
  const ids = new Set(selected.map(node => node.id));
  return {
    nodes: selected.map(node => ({...node, position: {...node.position}, data: {...node.data}})),
    edges: initialEdges.filter(edge => ids.has(edge.source) && ids.has(edge.target)).map(edge => ({...edge})),
  };
}
