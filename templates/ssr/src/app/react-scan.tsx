// biome-ignore-all assist/source/organizeImports: react-scan must be imported before react
'use client'

import { scan, setOptions } from 'react-scan'
import { createScanController } from '@reactloom/devtools/scan-controller'
import { useEffect } from 'react'

export const reactScanController = createScanController((enabled, toolbar) => {
  scan({ enabled, showToolbar: toolbar, useOffscreenCanvasWorker: false })
  setOptions({ enabled })
})

export function ReactScan() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development' || process.env.NEXT_PUBLIC_REACT_SCAN !== 'true') {
      return
    }
    reactScanController.configure(true, false)
  }, [])

  return null
}
