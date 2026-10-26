// Vite-specific adapter. MonacoEnvironment must exist before editor.create().
import BaseWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

type MonacoWorkerHost = typeof globalThis & {
  MonacoEnvironment?: {getWorker(workerId: string, label: string): Worker}
}

export function installMonacoWorkers(): void {
  const host = globalThis as MonacoWorkerHost
  if (host.MonacoEnvironment) return
  host.MonacoEnvironment = {
    getWorker(_workerId, label) {
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
  }
}
