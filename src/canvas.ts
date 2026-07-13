import type { EditorState } from './types'
import { getOutputGeometry, INNER_HEIGHT, OUTPUT_HEIGHT } from './layout'
import { alphaToImageData, createFilledSilhouette, extractAlpha, smoothAlpha } from './silhouette'

const SUPERSAMPLE = 3
const OCTAGON_PADDING = 6

function drawContainedImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  size: number,
) {
  const scale = Math.min(size / image.naturalWidth, size / image.naturalHeight)
  const width = image.naturalWidth * scale
  const height = image.naturalHeight * scale
  ctx.drawImage(image, x + (size - width) / 2, y + (size - height) / 2, width, height)
}

function drawOctagonPath(context: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const centerX = x + size / 2
  const centerY = y + size / 2
  const radius = size / 2
  context.beginPath()
  for (let index = 0; index < 8; index += 1) {
    const angle = -Math.PI / 2 + index * Math.PI / 4
    const pointX = centerX + Math.cos(angle) * radius
    const pointY = centerY + Math.sin(angle) * radius
    if (index === 0) context.moveTo(pointX, pointY)
    else context.lineTo(pointX, pointY)
  }
  context.closePath()
}

function finishCanvas(
  canvas: HTMLCanvasElement,
  sourceCanvas: HTMLCanvasElement,
  sourceWidth: number,
  outputWidth: number,
  scale: number,
) {
  canvas.width = outputWidth
  canvas.height = OUTPUT_HEIGHT
  const outputContext = canvas.getContext('2d')
  if (!outputContext) return { width: outputWidth, height: OUTPUT_HEIGHT }
  outputContext.clearRect(0, 0, canvas.width, canvas.height)
  outputContext.imageSmoothingEnabled = true
  outputContext.imageSmoothingQuality = 'high'
  const destinationWidth = sourceWidth * scale
  const destinationHeight = INNER_HEIGHT * scale
  outputContext.drawImage(
    sourceCanvas,
    (canvas.width - destinationWidth) / 2,
    (canvas.height - destinationHeight) / 2,
    destinationWidth,
    destinationHeight,
  )
  return { width: outputWidth, height: OUTPUT_HEIGHT }
}

function renderOctagonStyle(
  canvas: HTMLCanvasElement,
  state: EditorState,
  family: string,
  label: string,
  logo: HTMLImageElement | null,
) {
  const displayFontSize = Math.min(82, state.fontSize + 8)
  const measureCanvas = document.createElement('canvas')
  const measureContext = measureCanvas.getContext('2d')
  if (!measureContext) return { width: 1, height: OUTPUT_HEIGHT }
  measureContext.font = `${state.fontWeight} ${displayFontSize}px ${family}`
  const metrics = measureContext.measureText(label)
  const ascent = metrics.actualBoundingBoxAscent || displayFontSize * 0.78
  const descent = metrics.actualBoundingBoxDescent || displayFontSize * 0.18
  const glyphHeight = ascent + descent
  const frameSize = logo ? Math.max(46, Math.min(88, glyphHeight)) : 0
  const logoSize = logo ? frameSize - OCTAGON_PADDING * 2 : 0
  const shadowRoom = 4
  const groupWidth = metrics.width + (logo ? frameSize + state.logoGap : 0)
  const geometry = getOutputGeometry(groupWidth + shadowRoom * 2)
  const groupX = (geometry.sourceWidth - groupWidth) / 2
  const textX = groupX + (logo ? frameSize + state.logoGap : 0)
  const centerY = INNER_HEIGHT / 2
  const baselineY = centerY + (ascent - descent) / 2

  const sourceCanvas = document.createElement('canvas')
  sourceCanvas.width = geometry.sourceWidth * SUPERSAMPLE
  sourceCanvas.height = INNER_HEIGHT * SUPERSAMPLE
  const context = sourceCanvas.getContext('2d')
  if (!context) return { width: geometry.outputWidth, height: OUTPUT_HEIGHT }
  context.scale(SUPERSAMPLE, SUPERSAMPLE)

  if (logo) {
    const frameX = groupX
    const frameY = centerY - frameSize / 2
    const frameGradient = context.createLinearGradient(frameX, frameY, frameX + frameSize, frameY + frameSize)
    frameGradient.addColorStop(0, state.backgroundFrom)
    frameGradient.addColorStop(1, state.backgroundTo)
    drawOctagonPath(context, frameX, frameY, frameSize)
    context.fillStyle = frameGradient
    context.fill()
    drawContainedImage(
      context,
      logo,
      frameX + OCTAGON_PADDING,
      centerY - logoSize / 2,
      logoSize,
    )
  }

  context.font = `${state.fontWeight} ${displayFontSize}px ${family}`
  context.textAlign = 'left'
  context.textBaseline = 'alphabetic'
  context.lineJoin = 'round'
  const textGradient = context.createLinearGradient(textX, 0, textX + metrics.width, 0)
  textGradient.addColorStop(0, state.backgroundFrom)
  textGradient.addColorStop(0.52, state.backgroundTo)
  textGradient.addColorStop(1, state.backgroundFrom)
  context.fillStyle = textGradient
  context.shadowColor = 'rgba(0, 0, 0, 0.32)'
  context.shadowBlur = 2.4
  context.shadowOffsetX = 1
  context.shadowOffsetY = 2
  context.fillText(label, textX, baselineY)

  return finishCanvas(
    canvas,
    sourceCanvas,
    geometry.sourceWidth,
    geometry.outputWidth,
    geometry.scale,
  )
}

export function renderEmoji(
  canvas: HTMLCanvasElement,
  state: EditorState,
  fontFamily: string,
  logo: HTMLImageElement | null,
) {
  const measureCanvas = document.createElement('canvas')
  const measureContext = measureCanvas.getContext('2d')
  if (!measureContext) return { width: 1, height: OUTPUT_HEIGHT }

  const family = `"${fontFamily}", "Arial Black", "PingFang SC", sans-serif`
  const label = state.text || '输入文字'
  const fontSize = state.fontSize
  measureContext.font = `${state.fontWeight} ${fontSize}px ${family}`
  const metrics = measureContext.measureText(label)
  const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.78
  const descent = metrics.actualBoundingBoxDescent || fontSize * 0.18
  const glyphHeight = ascent + descent
  if (state.style === 'octagon') {
    return renderOctagonStyle(canvas, state, family, label, logo)
  }
  const logoSize = logo ? Math.max(34, Math.min(76, glyphHeight)) : 0
  const bottomRadius = Math.max(
    6,
    Math.min(
      Math.max(9, fontSize * 0.16),
      (INNER_HEIGHT - Math.max(glyphHeight, logoSize)) / 2 - 2,
    ),
  )
  const outerRadius = bottomRadius + 2
  const groupWidth = metrics.width + (logo ? logoSize + state.logoGap : 0)
  const geometry = getOutputGeometry(groupWidth + outerRadius * 2)
  const sourceWidth = geometry.sourceWidth
  const groupX = (sourceWidth - groupWidth) / 2
  const logoX = groupX
  const textX = groupX + (logo ? logoSize + state.logoGap : 0)
  const centerY = INNER_HEIGHT / 2
  const baselineY = centerY + (ascent - descent) / 2
  const logoY = centerY - logoSize / 2

  const maskCanvas = document.createElement('canvas')
  maskCanvas.width = sourceWidth * SUPERSAMPLE
  maskCanvas.height = INNER_HEIGHT * SUPERSAMPLE
  const maskContext = maskCanvas.getContext('2d', { willReadFrequently: true })
  if (!maskContext) return { width: geometry.outputWidth, height: OUTPUT_HEIGHT }
  maskContext.font = `${state.fontWeight} ${fontSize * SUPERSAMPLE}px ${family}`
  maskContext.textAlign = 'left'
  maskContext.textBaseline = 'alphabetic'
  maskContext.fillStyle = '#ffffff'
  if (logo) {
    drawContainedImage(
      maskContext,
      logo,
      logoX * SUPERSAMPLE,
      logoY * SUPERSAMPLE,
      logoSize * SUPERSAMPLE,
    )
  }
  maskContext.fillText(label, textX * SUPERSAMPLE, baselineY * SUPERSAMPLE)

  const sourceMask = maskContext.getImageData(0, 0, maskCanvas.width, maskCanvas.height)
  const originalAlpha = extractAlpha(sourceMask)
  const makeLayerAlpha = (radius: number) => smoothAlpha(
    createFilledSilhouette(originalAlpha, maskCanvas.width, maskCanvas.height, radius * SUPERSAMPLE),
    maskCanvas.width,
    maskCanvas.height,
    state.edgeSmoothing * SUPERSAMPLE,
  )
  const bottomAlpha = makeLayerAlpha(bottomRadius)
  const whiteBorderAlpha = makeLayerAlpha(bottomRadius + 1)
  const colorBorderAlpha = makeLayerAlpha(outerRadius)

  const sourceCanvas = document.createElement('canvas')
  sourceCanvas.width = maskCanvas.width
  sourceCanvas.height = maskCanvas.height
  const sourceContext = sourceCanvas.getContext('2d')
  if (!sourceContext) return { width: geometry.outputWidth, height: OUTPUT_HEIGHT }

  const layerCanvas = document.createElement('canvas')
  layerCanvas.width = maskCanvas.width
  layerCanvas.height = maskCanvas.height
  const layerContext = layerCanvas.getContext('2d')
  if (!layerContext) return { width: geometry.outputWidth, height: OUTPUT_HEIGHT }

  const paintLayer = (alpha: Uint8ClampedArray, fill: string | CanvasGradient) => {
    maskContext.clearRect(0, 0, maskCanvas.width, maskCanvas.height)
    maskContext.putImageData(alphaToImageData(alpha, maskCanvas.width, maskCanvas.height), 0, 0)
    layerContext.clearRect(0, 0, layerCanvas.width, layerCanvas.height)
    layerContext.globalCompositeOperation = 'source-over'
    layerContext.fillStyle = fill
    layerContext.fillRect(0, 0, layerCanvas.width, layerCanvas.height)
    layerContext.globalCompositeOperation = 'destination-in'
    layerContext.drawImage(maskCanvas, 0, 0)
    layerContext.globalCompositeOperation = 'source-over'
    sourceContext.drawImage(layerCanvas, 0, 0)
  }

  paintLayer(colorBorderAlpha, state.accent)
  paintLayer(whiteBorderAlpha, '#ffffff')
  const outlineGradient = layerContext.createLinearGradient(0, 0, 0, layerCanvas.height)
  outlineGradient.addColorStop(0, state.backgroundFrom)
  outlineGradient.addColorStop(0.48, state.backgroundFrom)
  outlineGradient.addColorStop(1, state.backgroundTo)
  paintLayer(bottomAlpha, outlineGradient)

  if (logo) {
    sourceContext.shadowColor = 'rgba(0, 0, 0, 0.34)'
    sourceContext.shadowBlur = 1.8 * SUPERSAMPLE
    sourceContext.shadowOffsetX = 0.8 * SUPERSAMPLE
    sourceContext.shadowOffsetY = 1.2 * SUPERSAMPLE
    drawContainedImage(
      sourceContext,
      logo,
      logoX * SUPERSAMPLE,
      logoY * SUPERSAMPLE,
      logoSize * SUPERSAMPLE,
    )
    sourceContext.shadowColor = 'transparent'
    sourceContext.shadowBlur = 0
    sourceContext.shadowOffsetX = 0
    sourceContext.shadowOffsetY = 0
  }

  sourceContext.font = `${state.fontWeight} ${fontSize * SUPERSAMPLE}px ${family}`
  sourceContext.textAlign = 'left'
  sourceContext.textBaseline = 'alphabetic'
  sourceContext.lineJoin = 'round'
  if (state.innerStrokeWidth > 0) {
    sourceContext.lineWidth = state.innerStrokeWidth * SUPERSAMPLE
    sourceContext.strokeStyle = '#ffffff'
    sourceContext.strokeText(label, textX * SUPERSAMPLE, baselineY * SUPERSAMPLE)
  }

  const textGradient = sourceContext.createLinearGradient(
    0,
    (baselineY - ascent) * SUPERSAMPLE,
    0,
    (baselineY + descent) * SUPERSAMPLE,
  )
  textGradient.addColorStop(0, state.textFrom)
  textGradient.addColorStop(0.48, '#ffffff')
  textGradient.addColorStop(1, state.textTo)
  sourceContext.fillStyle = textGradient
  sourceContext.shadowColor = 'rgba(0, 0, 0, 0.34)'
  sourceContext.shadowBlur = 1.8 * SUPERSAMPLE
  sourceContext.shadowOffsetX = 0.8 * SUPERSAMPLE
  sourceContext.shadowOffsetY = 1.2 * SUPERSAMPLE
  sourceContext.fillText(label, textX * SUPERSAMPLE, baselineY * SUPERSAMPLE)
  sourceContext.shadowColor = 'transparent'

  return finishCanvas(canvas, sourceCanvas, sourceWidth, geometry.outputWidth, geometry.scale)
}
