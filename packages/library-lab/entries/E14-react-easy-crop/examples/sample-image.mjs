function sampleImage() {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">' +
    '<rect width="1200" height="800" fill="#e7f0df"/>' +
    '<circle cx="620" cy="370" r="270" fill="#7cab97"/>' +
    '<path d="M0 580 Q380 260 640 570 T1200 530 V800 H0Z" fill="#356b64"/>' +
    '<text x="65" y="130" font-size="48" fill="#264f48" font-family="sans-serif">ReactLoom Cover</text></svg>'
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
export const sample = sampleImage()
