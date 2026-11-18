const W = 1200
const H = 800
const palettes = [
  ['#234e51', '#92d2ba', '#f7efdb'],
  ['#594b73', '#d1acd7', '#f4ddec'],
  ['#6e583d', '#e7c694', '#eff0d4'],
  ['#355d78', '#8ab6d7', '#f9ead1'],
]

function localArtwork(index) {
  const [dark, light, paper] = palettes[index % palettes.length]
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">' +
    '<rect width="1200" height="800" fill="' +
    paper +
    '"/>' +
    '<circle cx="' +
    (320 + index * 60) +
    '" cy="360" r="260" fill="' +
    light +
    '"/>' +
    '<path d="M0 620 Q250 300 540 650 T1200 500 V800 H0Z" fill="' +
    dark +
    '"/>' +
    '<circle cx="930" cy="175" r="75" fill="' +
    light +
    '"/>' +
    '<text x="75" y="130" fill="' +
    dark +
    '" font-size="46" font-family="sans-serif">ReactLoom ' +
    (index + 1) +
    '</text></svg>'
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export const artwork = palettes.map((_, index) => ({
  id: index + 1,
  src: localArtwork(index),
  alt: `原创抽象景观 ${index + 1}`,
  width: W,
  height: H,
}))
