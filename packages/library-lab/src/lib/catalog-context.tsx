import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'
import { JSON_RESPONSE_LIMITS, readLimitedJsonResponse } from './bounded-json.mjs'
import { validateCatalogIndex } from './catalog-index.mjs'
import { requestGeneratedResource } from './resource-fetch.mjs'
import type { CatalogEntry } from './types'

const Context = createContext<CatalogEntry[] | null>(null)
export function CatalogProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<CatalogEntry[] | null>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setError('')
    requestGeneratedResource(
      `${import.meta.env.BASE_URL}catalog-index.json`,
      (r) => readLimitedJsonResponse(r, JSON_RESPONSE_LIMITS.catalogIndex),
      { signal: controller.signal },
    )
      .then((data: unknown) => {
        if (!controller.signal.aborted) setEntries(validateCatalogIndex(data))
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(String(e))
      })
    return () => controller.abort()
  }, [attempt])
  if (error)
    return (
      <section role="alert" className="empty">
        <h1>目录暂时不可用</h1>
        <p>{error}</p>
        <button type="button" onClick={() => setAttempt((n) => n + 1)}>
          重试
        </button>
      </section>
    )
  if (!entries)
    return (
      <p role="status" className="empty">
        正在读取轻量目录…
      </p>
    )
  return <Context.Provider value={entries}>{children}</Context.Provider>
}
export function useCatalog() {
  const data = useContext(Context)
  if (!data) throw new Error('Missing CatalogProvider')
  return data
}
