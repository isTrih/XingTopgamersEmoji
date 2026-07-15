export const AVATAR_SIZE = 800

export interface AvatarEditorState {
  zoom: number
  positionX: number
  positionY: number
  topEnabled: boolean
  topText: string
  bottomEnabled: boolean
  bottomText: string
  maskColor: string
  maskOpacity: number
  maskHeight: number
  arcDepth: number
  textColor: string
  topFontSize: number
  topTextX: number
  topTextY: number
  bottomFontSize: number
  bottomTextX: number
  bottomTextY: number
  fontWeight: number
}

export interface AvatarFontFamilies {
  top: string
  bottom: string
}

export interface SquareCrop {
  sourceX: number
  sourceY: number
  sourceSize: number
}

export function getSquareCrop(
  width: number,
  height: number,
  zoom: number,
  positionX: number,
  positionY: number,
): SquareCrop {
  const safeZoom = Math.max(1, zoom)
  const sourceSize = Math.min(width, height) / safeZoom
  const availableX = Math.max(0, width - sourceSize)
  const availableY = Math.max(0, height - sourceSize)
  const normalizedX = Math.max(-100, Math.min(100, positionX)) / 100
  const normalizedY = Math.max(-100, Math.min(100, positionY)) / 100

  return {
    sourceX: availableX * (normalizedX + 1) / 2,
    sourceY: availableY * (normalizedY + 1) / 2,
    sourceSize,
  }
}

function hexToRgba(hex: string, opacity: number) {
  const normalized = hex.replace('#', '')
  const value = Number.parseInt(normalized.length === 3
    ? normalized.split('').map((part) => part + part).join('')
    : normalized, 16)
  const red = (value >> 16) & 255
  const green = (value >> 8) & 255
  const blue = value & 255
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`
}

function topCurveY(x: number, height: number, depth: number) {
  const normalized = x / AVATAR_SIZE - 0.5
  return height - depth + depth * 4 * normalized * normalized
}

function bottomCurveY(x: number, height: number, depth: number) {
  const normalized = x / AVATAR_SIZE - 0.5
  return AVATAR_SIZE - height + depth - depth * 4 * normalized * normalized
}

function drawCurvedText(
  context: CanvasRenderingContext2D,
  text: string,
  curveY: (x: number) => number,
  direction: 'top' | 'bottom',
  state: AvatarEditorState,
  fontFamily: string,
) {
  const label = text.trim()
  if (!label) return

  const fontSize = Math.max(1, direction === 'top' ? state.topFontSize : state.bottomFontSize)
  const textX = direction === 'top' ? state.topTextX : state.bottomTextX
  const textY = direction === 'top' ? state.topTextY : state.bottomTextY

  context.save()
  context.font = `${state.fontWeight} ${fontSize}px "${fontFamily}", "PingFang SC", "Microsoft YaHei", sans-serif`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillStyle = state.textColor
  context.strokeStyle = 'rgba(0, 0, 0, 0.28)'
  context.lineWidth = Math.max(2, fontSize * 0.07)
  context.lineJoin = 'round'
  context.shadowColor = 'rgba(0, 0, 0, 0.22)'
  context.shadowBlur = 5
  context.shadowOffsetY = 2

  const widths = Array.from(label, (character) => context.measureText(character).width + fontSize * 0.08)
  const naturalWidth = widths.reduce((sum, width) => sum + width, 0)
  let cursor = (AVATAR_SIZE - naturalWidth) / 2 + textX

  Array.from(label).forEach((character, index) => {
    const characterWidth = widths[index]
    const x = cursor + characterWidth / 2
    const delta = 2
    const slope = (curveY(x + delta) - curveY(x - delta)) / (delta * 2)
    const yOffset = direction === 'top' ? -fontSize * 0.62 : fontSize * 0.68

    context.save()
    context.translate(x, curveY(x) + yOffset + textY)
    context.rotate(Math.atan(slope))
    context.strokeText(character, 0, 0)
    context.fillText(character, 0, 0)
    context.restore()
    cursor += characterWidth
  })
  context.restore()
}

function drawTopMask(context: CanvasRenderingContext2D, state: AvatarEditorState) {
  const controlY = state.maskHeight - state.arcDepth * 2
  context.beginPath()
  context.moveTo(0, 0)
  context.lineTo(AVATAR_SIZE, 0)
  context.lineTo(AVATAR_SIZE, state.maskHeight)
  context.quadraticCurveTo(AVATAR_SIZE / 2, controlY, 0, state.maskHeight)
  context.closePath()
  context.fill()
}

function drawBottomMask(context: CanvasRenderingContext2D, state: AvatarEditorState) {
  const edgeY = AVATAR_SIZE - state.maskHeight
  const controlY = edgeY + state.arcDepth * 2
  context.beginPath()
  context.moveTo(0, AVATAR_SIZE)
  context.lineTo(AVATAR_SIZE, AVATAR_SIZE)
  context.lineTo(AVATAR_SIZE, edgeY)
  context.quadraticCurveTo(AVATAR_SIZE / 2, controlY, 0, edgeY)
  context.closePath()
  context.fill()
}

export function renderAvatar(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement | null,
  state: AvatarEditorState,
  fonts: AvatarFontFamilies,
) {
  canvas.width = AVATAR_SIZE
  canvas.height = AVATAR_SIZE
  const context = canvas.getContext('2d')
  if (!context) return

  context.clearRect(0, 0, AVATAR_SIZE, AVATAR_SIZE)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'

  if (image) {
    const crop = getSquareCrop(
      image.naturalWidth,
      image.naturalHeight,
      state.zoom,
      state.positionX,
      state.positionY,
    )
    context.drawImage(
      image,
      crop.sourceX,
      crop.sourceY,
      crop.sourceSize,
      crop.sourceSize,
      0,
      0,
      AVATAR_SIZE,
      AVATAR_SIZE,
    )
  } else {
    const gradient = context.createLinearGradient(0, 0, AVATAR_SIZE, AVATAR_SIZE)
    gradient.addColorStop(0, '#f4f1ff')
    gradient.addColorStop(1, '#e8e3fb')
    context.fillStyle = gradient
    context.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE)
    context.fillStyle = '#776aa8'
    context.font = '700 38px "PingFang SC", sans-serif'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText('上传头像开始编辑', AVATAR_SIZE / 2, AVATAR_SIZE / 2)
  }

  context.fillStyle = hexToRgba(state.maskColor, state.maskOpacity)
  if (state.topEnabled) {
    drawTopMask(context, state)
    drawCurvedText(
      context,
      state.topText,
      (x) => topCurveY(x, state.maskHeight, state.arcDepth),
      'top',
      state,
      fonts.top,
    )
  }
  if (state.bottomEnabled) {
    drawBottomMask(context, state)
    drawCurvedText(
      context,
      state.bottomText,
      (x) => bottomCurveY(x, state.maskHeight, state.arcDepth),
      'bottom',
      state,
      fonts.bottom,
    )
  }
}
