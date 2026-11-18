import { checkCropArea, checkImageDimensions } from './crop-policy.mjs'
// DOM/Canvas implementation; policy tests alone do not execute this path.
export async function cropToPng(source, area) {
  const image = new Image()
  let canvas
  try {
    image.src = source
    await image.decode()
    checkImageDimensions(image.naturalWidth, image.naturalHeight)
    const { x, y, width, height } = checkCropArea(area, image.naturalWidth, image.naturalHeight)
    canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('无法创建Canvas上下文')
    context.drawImage(image, x, y, width, height, 0, 0, width, height)
    return await new Promise((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob && blob.size > 0 ? resolve(blob) : reject(new Error('无法编码PNG'))),
        'image/png',
      ),
    )
  } finally {
    image.removeAttribute('src')
    if (canvas) {
      canvas.width = 0
      canvas.height = 0
    }
  }
}
