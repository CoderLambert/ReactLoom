// Vite-specific adapter; model disposal does not terminate Monaco's internal cached workers.
import BaseWorker from 'monaco-editor/editor/editor.worker.js?worker'
import JsonWorker from 'monaco-editor/languages/features/json/json.worker.js?worker'
import CssWorker from 'monaco-editor/languages/features/css/css.worker.js?worker'
import HtmlWorker from 'monaco-editor/languages/features/html/html.worker.js?worker'
import TsWorker from 'monaco-editor/languages/features/typescript/ts.worker.js?worker'
import {acquireWorkerEnvironment} from './worker-lease.mjs'

export function installMonacoWorkers(): () => void {
  return acquireWorkerEnvironment(globalThis, () => ({
    getWorker(_workerId: string, label: string): Worker {
      switch (label) {
        case 'json': return new JsonWorker({name: 'monaco-json'})
        case 'css':
        case 'scss':
        case 'less': return new CssWorker({name: 'monaco-css'})
        case 'html':
        case 'handlebars':
        case 'razor': return new HtmlWorker({name: 'monaco-html'})
        case 'javascript':
        case 'typescript': return new TsWorker({name: 'monaco-typescript'})
        default: return new BaseWorker({name: 'monaco-editor'})
      }
    },
  }))
}
