import { useCallback, useEffect, useRef, useState } from 'react'
import {
  normalizeCatalogQuery,
  SEARCH_DEBOUNCE_MS,
  SEARCH_QUERY_LIMIT,
} from '../lib/catalog-query.mjs'

type Props = { query: string; onQueryChange: (query: string) => void }

/** Keep IME composition local; only committed text changes the route. */
export default function CatalogSearch({ query, onQueryChange }: Props) {
  const [draft, setDraft] = useState(query)
  const composing = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastCommitted = useRef<string | null>(null)
  const changeHandler = useRef(onQueryChange)
  useEffect(() => {
    changeHandler.current = onQueryChange
  }, [onQueryChange])

  const cancel = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }, [])
  const commit = (value: string) => {
    cancel()
    const normalized = normalizeCatalogQuery(value)
    if (normalized !== query) {
      lastCommitted.current = normalized
      changeHandler.current(normalized)
    }
  }
  const schedule = (value: string) => {
    cancel()
    timer.current = setTimeout(() => {
      timer.current = null
      commit(value)
    }, SEARCH_DEBOUNCE_MS)
  }

  useEffect(() => {
    if (lastCommitted.current === query) {
      lastCommitted.current = null
      return
    }
    if (!composing.current) {
      cancel()
      setDraft(query)
    }
  }, [query, cancel])
  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current)
    },
    [],
  )

  return (
    <input
      aria-label="搜索工具库"
      placeholder="搜索库名、任务或关键词，例如：并发、图表、表单…"
      maxLength={SEARCH_QUERY_LIMIT}
      value={draft}
      onChange={(event) => {
        const value = normalizeCatalogQuery(event.currentTarget.value)
        setDraft(value)
        if (!composing.current) schedule(value)
      }}
      onCompositionStart={() => {
        composing.current = true
        cancel()
      }}
      onCompositionEnd={(event) => {
        composing.current = false
        const value = normalizeCatalogQuery(event.currentTarget.value)
        setDraft(value)
        schedule(value)
      }}
      onBlur={() => {
        if (!composing.current) commit(draft)
      }}
    />
  )
}
