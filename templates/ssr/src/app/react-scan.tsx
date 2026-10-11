// biome-ignore-all assist/source/organizeImports: react-scan must be imported before react
'use client'

import { scan } from 'react-scan'
import { useEffect } from 'react'

export function ReactScan() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development' || process.env.NEXT_PUBLIC_REACT_SCAN !== 'true') {
      return
    }
    scan({
      enabled: true,
    })
  }, [])

  return null
}
