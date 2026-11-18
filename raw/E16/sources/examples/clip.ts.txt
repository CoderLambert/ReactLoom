export async function createLocalClip(
  variant: 'light' | 'dark' = 'light',
  signal?: AbortSignal,
): Promise<Blob> {
  if (signal?.aborted) throw new DOMException('录制已取消', 'AbortError')
  if (typeof MediaRecorder === 'undefined')
    throw new Error('浏览器没有MediaRecorder；可在进阶层选本地MP4/WebM')
  const canvas = document.createElement('canvas')
  canvas.width = 320
  canvas.height = 180
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D不可用')
  if (typeof canvas.captureStream !== 'function') throw new Error('浏览器不支持Canvas视频捕获')
  const mimeType = ['video/webm;codecs=vp8', 'video/webm'].find((value) =>
    MediaRecorder.isTypeSupported(value),
  )
  if (!mimeType) throw new Error('浏览器不能录WebM；请改用本地视频文件')
  const stream = canvas.captureStream(12)
  let recorder: MediaRecorder
  try {
    recorder = new MediaRecorder(stream, { mimeType })
  } catch (error) {
    stream.getTracks().forEach((track) => {
      track.stop()
    })
    throw error
  }
  let frame = 0,
    settled = false
  let stopTimer: number | undefined, watchdog: number | undefined
  let abort = () => {}
  const chunks: BlobPart[] = []
  const draw = () => {
    context.fillStyle = variant === 'light' ? '#e7f0e8' : '#273b36'
    context.fillRect(0, 0, 320, 180)
    context.fillStyle = variant === 'light' ? '#205843' : '#e9f5e6'
    context.font = 'bold 30px sans-serif'
    context.fillText('Library Lab', 27, 74)
    context.fillRect(27 + (frame % 60) * 3, 105, 48, 10)
    frame++
  }
  draw()
  const ticker = window.setInterval(draw, 80)
  try {
    return await new Promise<Blob>((resolve, reject) => {
      const fail = (error: unknown) => {
        if (settled) return
        settled = true
        reject(error)
      }
      const stop = () => {
        try {
          if (recorder.state !== 'inactive') recorder.stop()
        } catch (error) {
          fail(error)
        }
      }
      abort = () => fail(new DOMException('录制已取消', 'AbortError'))
      recorder.ondataavailable = (event) => {
        if (!settled && event.data.size) chunks.push(event.data)
      }
      recorder.onerror = () => fail(new Error('MediaRecorder录制失败'))
      recorder.onstop = () => {
        if (settled) return
        settled = true
        const blob = new Blob(chunks, { type: mimeType })
        if (blob.size) resolve(blob)
        else reject(new Error('录制产物为空'))
      }
      if (signal?.aborted) {
        abort()
        return
      }
      signal?.addEventListener('abort', abort, { once: true })
      try {
        recorder.start(100)
      } catch (error) {
        fail(error)
        return
      }
      stopTimer = window.setTimeout(stop, 1450)
      watchdog = window.setTimeout(() => fail(new Error('录制5秒未完成，已终止本次资源')), 5000)
    })
  } finally {
    settled = true
    if (stopTimer !== undefined) window.clearTimeout(stopTimer)
    if (watchdog !== undefined) window.clearTimeout(watchdog)
    signal?.removeEventListener('abort', abort)
    window.clearInterval(ticker)
    recorder.ondataavailable = null
    recorder.onerror = null
    recorder.onstop = null
    try {
      if (recorder.state !== 'inactive') recorder.stop()
    } catch {
      /* stop still must not skip track release */
    }
    stream.getTracks().forEach((track) => {
      track.stop()
    })
  }
}
