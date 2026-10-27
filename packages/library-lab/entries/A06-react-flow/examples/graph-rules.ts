/** Pure workflow checks; React Flow owns the viewport, not business graph validity. */
export type WorkflowNode = {readonly id: string};
export type WorkflowEdge = {readonly source: string; readonly target: string};
export type ConnectionDecision =
  | {readonly valid: true; readonly reason: 'ok'}
  | {readonly valid: false; readonly reason: 'missing-endpoint' | 'unknown-node' | 'self-loop' | 'duplicate' | 'cycle'};

export function validateConnection(
  nodes: readonly WorkflowNode[], edges: readonly WorkflowEdge[],
  source: string | null | undefined, target: string | null | undefined,
): ConnectionDecision {
  if (!source || !target) return {valid: false, reason: 'missing-endpoint'};
  const ids = new Set(nodes.map(node => node.id));
  if (!ids.has(source) || !ids.has(target)) return {valid: false, reason: 'unknown-node'};
  if (source === target) return {valid: false, reason: 'self-loop'};
  if (edges.some(edge => edge.source === source && edge.target === target)) {
    return {valid: false, reason: 'duplicate'};
  }
  const outgoing = new Map<string, string[]>();
  for (const edge of edges) {
    if (!ids.has(edge.source) || !ids.has(edge.target)) continue;
    const targets = outgoing.get(edge.source) ?? [];
    targets.push(edge.target);
    outgoing.set(edge.source, targets);
  }
  // Adding source -> target would cycle exactly when target already reaches source.
  const visited = new Set<string>();
  const remaining = [target];
  while (remaining.length) {
    const next = remaining.pop()!;
    if (next === source) return {valid: false, reason: 'cycle'};
    if (visited.has(next)) continue;
    visited.add(next);
    remaining.push(...(outgoing.get(next) ?? []));
  }
  return {valid: true, reason: 'ok'};
}

export function pruneEdgesForRemovedNodes<T extends WorkflowEdge>(
  edges: readonly T[], removed: ReadonlySet<string>,
): T[] {
  if (!removed.size) return [...edges];
  return edges.filter(edge => !removed.has(edge.source) && !removed.has(edge.target));
}
