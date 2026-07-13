type SourceGradient = {
  name: string
  colors: string[]
}

const SOURCE = 'https://raw.githubusercontent.com/Ghosh/uiGradients/master/gradients.json'

function rgb(hex: string) {
  const value = hex.replace('#', '')
  const normalized = value.length === 3
    ? value.split('').map((part) => part + part).join('')
    : value
  return [0, 2, 4].map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16) / 255)
}

function hsl(hex: string) {
  const [red, green, blue] = rgb(hex)
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const delta = max - min
  const lightness = (max + min) / 2
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1))
  let hue = 0
  if (delta !== 0) {
    if (max === red) hue = 60 * (((green - blue) / delta) % 6)
    else if (max === green) hue = 60 * ((blue - red) / delta + 2)
    else hue = 60 * ((red - green) / delta + 4)
  }
  return { hue: (hue + 360) % 360, saturation, lightness }
}

function contrastScore([from, to]: string[]) {
  const first = hsl(from)
  const second = hsl(to)
  const hueDistance = Math.min(Math.abs(first.hue - second.hue), 360 - Math.abs(first.hue - second.hue))
  const lightDistance = Math.abs(first.lightness - second.lightness)
  const saturation = (first.saturation + second.saturation) / 2
  return hueDistance * 1.35 + lightDistance * 100 + saturation * 22
}

const source = await fetch(SOURCE).then((response) => response.json()) as SourceGradient[]
const selected = source
  .filter((gradient) => gradient.colors.length === 2)
  .filter((gradient) => {
    const first = hsl(gradient.colors[0])
    const second = hsl(gradient.colors[1])
    const hueDistance = Math.min(Math.abs(first.hue - second.hue), 360 - Math.abs(first.hue - second.hue))
    return hueDistance >= 45
      && (first.saturation + second.saturation) / 2 >= 0.4
      && Math.min(first.saturation, second.saturation) >= 0.12
  })
  .sort((left, right) => contrastScore(right.colors) - contrastScore(left.colors))
  .slice(0, 120)

if (selected.length !== 120) throw new Error(`Expected 120 gradients, received ${selected.length}`)

const lines = selected.map(({ name, colors }) => `  { name: ${JSON.stringify(name)}, colors: [${JSON.stringify(colors[0])}, ${JSON.stringify(colors[1])}] },`)
const output = `// Generated from the human-curated uiGradients collection (MIT).\n// Run \`bun scripts/sync-curated-gradients.ts\` to refresh this snapshot.\nexport const curatedContrastGradients = [\n${lines.join('\n')}\n] as const\n`

await Bun.write('src/curatedContrastGradients.ts', output)
console.log(`Saved ${selected.length} curated contrasting gradients.`)
