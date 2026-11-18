// Pure analysis of real build outputs. Policy tests do not execute the SDK.
export function staticClosure(chunks) {
  const byFile = new Map(chunks.map((chunk) => [chunk.file, chunk]))
  const visited = new Set()
  function visit(file) {
    if (visited.has(file)) return
    const chunk = byFile.get(file)
    if (!chunk) throw new Error(`Missing imported chunk: ${file}`)
    visited.add(file)
    for (const imported of chunk.imports) visit(imported)
  }
  const entries = chunks.filter((chunk) => chunk.isEntry)
  if (entries.length !== 1) throw new Error('Fixture must have exactly one JS entry')
  visit(entries[0].file)
  return [...visited].sort()
}

export function moduleAttribution(raw) {
  if (raw?.version !== 2 || !raw.nodeParts || !raw.nodeMetas) {
    throw new Error('Expected Visualizer 7.1.1 version-2 raw-data')
  }
  const modules = Object.values(raw.nodeMetas).map((meta) => ({
    id: meta.id,
    parts: Object.entries(meta.moduleParts).map(([file, uid]) => {
      const part = raw.nodeParts[uid]
      if (!part || !Number.isFinite(part.renderedLength)) {
        throw new Error('Raw-data module part is missing or invalid')
      }
      return { file, renderedBytes: part.renderedLength }
    }),
    imports: meta.imported.map((link) => ({
      id: raw.nodeMetas[link.uid]?.id,
      dynamic: Boolean(link.dynamic),
    })),
  }))
  for (const file of ['/helper.ts', '/view.ts', '/heavy.ts']) {
    if (!modules.some((module) => module.id === file && module.parts.length > 0)) {
      throw new Error(`Visualizer must attribute emitted bytes to ${file}`)
    }
  }
  return modules.sort((left, right) => left.id.localeCompare(right.id))
}

export function summarizeChunks(chunks) {
  const initialFiles = staticClosure(chunks)
  const initial = new Set(initialFiles)
  const sum = (items, key) => items.reduce((total, item) => total + item[key], 0)
  return {
    initialFiles,
    deferredFiles: chunks
      .filter((chunk) => !initial.has(chunk.file))
      .map((chunk) => chunk.file)
      .sort(),
    initialBytes: sum(
      chunks.filter((chunk) => initial.has(chunk.file)),
      'bytes',
    ),
    initialGzipBytes: sum(
      chunks.filter((chunk) => initial.has(chunk.file)),
      'gzipBytes',
    ),
    totalBytes: sum(chunks, 'bytes'),
    totalGzipBytes: sum(chunks, 'gzipBytes'),
  }
}

export function compareBuilds(builds) {
  const before = builds.find((build) => build.variant === 'static')
  const after = builds.find((build) => build.variant === 'lazy')
  if (!before || !after) return null
  const carriesHeavy = (build) =>
    build.chunks.some(
      (chunk) => build.initialFiles.includes(chunk.file) && chunk.moduleIds.includes('/heavy.ts'),
    )
  if (!carriesHeavy(before) || carriesHeavy(after)) {
    throw new Error('Expected heavy.ts to move out of the entry static dependency closure')
  }
  if (after.deferredFiles.length === 0) throw new Error('Dynamic import emitted no deferred chunk')
  return {
    initialBytesDelta: after.initialBytes - before.initialBytes,
    initialGzipBytesDelta: after.initialGzipBytes - before.initialGzipBytes,
    totalBytesDelta: after.totalBytes - before.totalBytes,
    heavyInStaticInitial: true,
    heavyInLazyInitial: false,
  }
}

export function evaluateBudget(build, maxInitialGzipBytes) {
  if (!Number.isSafeInteger(maxInitialGzipBytes) || maxInitialGzipBytes < 1) {
    throw new Error('Budget must be a positive integer number of bytes')
  }
  return {
    metric: 'sum-of-initial-js-gzip-level-9-bytes',
    variant: build.variant,
    actual: build.initialGzipBytes,
    limit: maxInitialGzipBytes,
    passed: build.initialGzipBytes <= maxInitialGzipBytes,
  }
}
