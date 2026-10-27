// Vite-specific adapter; model disposal does not terminate Monaco's internal cached workers.
import BaseWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
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
