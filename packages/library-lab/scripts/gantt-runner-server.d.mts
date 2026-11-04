import type { IncomingMessage, ServerResponse } from 'node:http'
export const GANTT_HEADERS: Readonly<Record<string, string>>
export function createGanttSessionMiddleware(options?: {
  development?: boolean
}): (request: IncomingMessage, response: ServerResponse, next: () => void) => void
