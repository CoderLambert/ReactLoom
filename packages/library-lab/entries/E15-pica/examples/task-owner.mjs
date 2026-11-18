// Owns application task identity, not the pica worker pool or native encoder.
export function createTaskOwner() {
  let epoch = 0,
    active = null,
    cancel = null
  return {
    begin() {
      if (active !== null) return null
      active = ++epoch
      return active
    },
    isCurrent(id) {
      return id === epoch && id === active
    },
    isBusy() {
      return active !== null
    },
    attachCancel(id, callback) {
      if (id === epoch && id === active) cancel = callback
      else callback()
    },
    clearCancel(id) {
      if (id === epoch && id === active) cancel = null
    },
    invalidate() {
      epoch++
      const callback = cancel
      cancel = null
      callback?.()
    },
    finish(id) {
      if (active === id) {
        active = null
        cancel = null
      }
    },
  }
}
export function assertPNGBlob(value) {
  if (!(value instanceof Blob) || value.size === 0 || value.type !== 'image/png')
    throw new Error('PNG编码没有产生有效Blob')
  return value
}
