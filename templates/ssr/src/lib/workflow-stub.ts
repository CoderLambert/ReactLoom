export default function report() {
  return Promise.resolve()
}

export function setupWorker() {
  return { start: async () => undefined }
}

export function setupServer() {
  return { listen() {}, close() {}, resetHandlers() {} }
}

function unused() {
  return undefined
}

export const http = {
  get: unused,
  post: unused,
  patch: unused,
  put: unused,
  delete: unused,
}

export const HttpResponse = {
  json: unused,
  text: unused,
}
