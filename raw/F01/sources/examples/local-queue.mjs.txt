import Uppy from '@uppy/core'
export function createLocalQueue(id, { infoTimeout = 5000 } = {}) {
  return new Uppy({
    id,
    autoProceed: false,
    infoTimeout,
    restrictions: {
      maxNumberOfFiles: 3,
      maxFileSize: 1024 * 1024,
      allowedFileTypes: ['.txt', '.csv', '.md'],
    },
  })
}
export function localFiles(uppy) {
  return uppy.getFiles().map((file) => ({
    id: file.id,
    name: file.name ?? '未命名文件',
    size: file.size ?? 0,
    type: file.type || 'unknown',
  }))
}
export function bindLocalQueue(uppy, onFiles, onRestriction) {
  const sync = () => onFiles(localFiles(uppy))
  const rejected = (_file, error) => onRestriction(error)
  uppy.on('file-added', sync)
  uppy.on('file-removed', sync)
  uppy.on('restriction-failed', rejected)
  return () => {
    uppy.off('file-added', sync)
    uppy.off('file-removed', sync)
    uppy.off('restriction-failed', rejected)
    uppy.destroy()
  }
}
export function addLocalFiles(uppy, inputs) {
  const before = new Set(uppy.getFiles().map((file) => file.id)),
    errors = []
  const collect = (_file, error) => errors.push(error.message)
  let fatal = null
  uppy.on('restriction-failed', collect)
  try {
    uppy.addFiles(
      inputs.map((file) => ({
        name: file.name,
        type: file.type,
        data: file,
        source: 'library-lab-local-picker',
      })),
    )
  } catch (error) {
    fatal = error instanceof Error ? error.message : String(error)
  } finally {
    uppy.off('restriction-failed', collect)
  }
  const added = uppy.getFiles().filter((file) => !before.has(file.id)).length
  return { added, notAdded: inputs.length - added, errors, fatal }
}
