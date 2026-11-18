export const TEST_HLS = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
export const DESTROY_EVENT = 'reactloom-e17-destroying'
export function clearMedia(video) {
  if (!video) return
  video.onerror = null
  try {
    video.pause()
  } finally {
    video.removeAttribute('src')
    video.load()
  }
}
export function disposePlayback(engine, video) {
  try {
    engine?.destroy()
  } finally {
    clearMedia(video)
  }
}
export function validLevel(index, count) {
  return index === -1 || (Number.isInteger(index) && index >= 0 && index < count)
}
