import { createScanController } from '@reactloom/devtools/scan-controller'
import { scan, setOptions } from 'react-scan'

export const reactScanController = createScanController((enabled, toolbar) => {
  scan({ enabled, showToolbar: toolbar })
  setOptions({ enabled })
})
