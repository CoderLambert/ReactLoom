/** Import boundary for untrusted local Excalidraw JSON; this is not a full schema validator. */
export const MAX_SCENE_BYTES = 1_500_000
export const MAX_SCENE_ELEMENTS = 200
const IMPORT_ELEMENT_TYPES = new Set([
  'rectangle',
  'diamond',
  'ellipse',
  'line',
  'arrow',
  'text',
  'freedraw',
])

export function isSafeSceneLink(value: string | null | undefined): boolean {
  if (!value) return true
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password
  } catch {
    return false
  }
}

export function sceneImportError(input: {
  name: string
  bytes: number
  links?: readonly (string | null | undefined)[]
  elementCount?: number
  attachedFiles?: number
  elementTypes?: readonly string[]
}): string | null {
  if (!/\.(?:excalidraw|json)$/iu.test(input.name)) return '仅接受 .excalidraw 或 .json 文件'
  if (!Number.isSafeInteger(input.bytes) || input.bytes < 1 || input.bytes > MAX_SCENE_BYTES)
    return '导入文件必须非空且不超过 1.5 MB'
  if (
    input.elementCount !== undefined &&
    (!Number.isSafeInteger(input.elementCount) ||
      input.elementCount < 0 ||
      input.elementCount > MAX_SCENE_ELEMENTS)
  )
    return '元素超过 200 个或数量无效'
  if (input.links?.some((link) => !isSafeSceneLink(link)))
    return '存在不安全的元素链接（仅允许无凭据的 HTTPS）'
  if (input.attachedFiles && input.attachedFiles > 0) return '当前教学导入不接受二进制附件'
  if (input.elementTypes?.some((type) => !IMPORT_ELEMENT_TYPES.has(type)))
    return '当前教学导入仅接受几何、箭头、文字和自由绘制；不接受图片或嵌入元素'
  return null
}
