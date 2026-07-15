import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'

const SELECTOR_WIDTH = 660
const SELECTOR_HEIGHT = 420
const MAX_ZOOM = 10

export interface CropSelectionValue {
  zoom: number
  positionX: number
  positionY: number
}

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface CropSelectorLayout {
  image: Rect
  selection: Rect
}

interface DragState {
  mode: 'move' | 'resize'
  image: Rect
  selectionSize: number
  offsetX: number
  offsetY: number
  centerX: number
  centerY: number
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

export function getCropSelectorLayout(
  imageWidth: number,
  imageHeight: number,
  crop: CropSelectionValue,
): CropSelectorLayout {
  const imageScale = Math.min(SELECTOR_WIDTH / imageWidth, SELECTOR_HEIGHT / imageHeight)
  const displayWidth = imageWidth * imageScale
  const displayHeight = imageHeight * imageScale
  const image = {
    x: (SELECTOR_WIDTH - displayWidth) / 2,
    y: (SELECTOR_HEIGHT - displayHeight) / 2,
    width: displayWidth,
    height: displayHeight,
  }
  const zoom = Math.max(1, crop.zoom)
  const selectionSize = Math.min(displayWidth, displayHeight) / zoom
  const availableX = displayWidth - selectionSize
  const availableY = displayHeight - selectionSize
  const normalizedX = clamp(crop.positionX, -100, 100) / 100
  const normalizedY = clamp(crop.positionY, -100, 100) / 100

  return {
    image,
    selection: {
      x: image.x + availableX * (normalizedX + 1) / 2,
      y: image.y + availableY * (normalizedY + 1) / 2,
      width: selectionSize,
      height: selectionSize,
    },
  }
}

function positionFromSelection(image: Rect, size: number, x: number, y: number): CropSelectionValue {
  const availableX = image.width - size
  const availableY = image.height - size
  return {
    zoom: Math.min(image.width, image.height) / size,
    positionX: availableX > 0 ? clamp(((x - image.x) / availableX) * 200 - 100, -100, 100) : 0,
    positionY: availableY > 0 ? clamp(((y - image.y) / availableY) * 200 - 100, -100, 100) : 0,
  }
}

function pointerPosition(event: ReactPointerEvent<HTMLCanvasElement>) {
  const bounds = event.currentTarget.getBoundingClientRect()
  return {
    x: (event.clientX - bounds.left) * SELECTOR_WIDTH / bounds.width,
    y: (event.clientY - bounds.top) * SELECTOR_HEIGHT / bounds.height,
  }
}

export function AvatarCropSelector({
  image,
  value,
  onChange,
}: {
  image: HTMLImageElement
  value: CropSelectionValue
  onChange: (value: CropSelectionValue) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragRef = useRef<DragState | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    const layout = getCropSelectorLayout(image.naturalWidth, image.naturalHeight, value)
    const selection = layout.selection

    context.clearRect(0, 0, SELECTOR_WIDTH, SELECTOR_HEIGHT)
    context.fillStyle = '#dedbd4'
    context.fillRect(0, 0, SELECTOR_WIDTH, SELECTOR_HEIGHT)
    context.drawImage(image, layout.image.x, layout.image.y, layout.image.width, layout.image.height)

    context.beginPath()
    context.rect(layout.image.x, layout.image.y, layout.image.width, layout.image.height)
    context.rect(selection.x, selection.y, selection.width, selection.height)
    context.fillStyle = 'rgba(24, 22, 29, 0.58)'
    context.fill('evenodd')

    context.save()
    context.strokeStyle = 'rgba(255, 255, 255, 0.65)'
    context.lineWidth = 1
    for (let index = 1; index < 3; index += 1) {
      const offset = selection.width * index / 3
      context.beginPath()
      context.moveTo(selection.x + offset, selection.y)
      context.lineTo(selection.x + offset, selection.y + selection.height)
      context.moveTo(selection.x, selection.y + offset)
      context.lineTo(selection.x + selection.width, selection.y + offset)
      context.stroke()
    }
    context.strokeStyle = '#ffffff'
    context.lineWidth = 3
    context.strokeRect(selection.x, selection.y, selection.width, selection.height)
    context.strokeStyle = '#664cda'
    context.lineWidth = 2
    context.strokeRect(selection.x - 2, selection.y - 2, selection.width + 4, selection.height + 4)
    context.fillStyle = '#ffffff'
    context.beginPath()
    context.arc(selection.x + selection.width, selection.y + selection.height, 9, 0, Math.PI * 2)
    context.fill()
    context.strokeStyle = '#664cda'
    context.lineWidth = 4
    context.stroke()
    context.restore()
  }, [image, value])

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const point = pointerPosition(event)
    const layout = getCropSelectorLayout(image.naturalWidth, image.naturalHeight, value)
    const selection = layout.selection
    const handleDistance = Math.hypot(
      point.x - selection.x - selection.width,
      point.y - selection.y - selection.height,
    )
    const inside = point.x >= selection.x && point.x <= selection.x + selection.width
      && point.y >= selection.y && point.y <= selection.y + selection.height

    event.currentTarget.setPointerCapture(event.pointerId)
    if (handleDistance <= 24) {
      dragRef.current = {
        mode: 'resize',
        image: layout.image,
        selectionSize: selection.width,
        offsetX: 0,
        offsetY: 0,
        centerX: selection.x + selection.width / 2,
        centerY: selection.y + selection.height / 2,
      }
      return
    }

    const targetX = inside ? selection.x : clamp(point.x - selection.width / 2, layout.image.x, layout.image.x + layout.image.width - selection.width)
    const targetY = inside ? selection.y : clamp(point.y - selection.height / 2, layout.image.y, layout.image.y + layout.image.height - selection.height)
    if (!inside) onChange(positionFromSelection(layout.image, selection.width, targetX, targetY))
    dragRef.current = {
      mode: 'move',
      image: layout.image,
      selectionSize: selection.width,
      offsetX: inside ? point.x - selection.x : selection.width / 2,
      offsetY: inside ? point.y - selection.y : selection.height / 2,
      centerX: 0,
      centerY: 0,
    }
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const point = pointerPosition(event)

    if (drag.mode === 'move') {
      const x = clamp(point.x - drag.offsetX, drag.image.x, drag.image.x + drag.image.width - drag.selectionSize)
      const y = clamp(point.y - drag.offsetY, drag.image.y, drag.image.y + drag.image.height - drag.selectionSize)
      onChange(positionFromSelection(drag.image, drag.selectionSize, x, y))
      return
    }

    const minimumSize = Math.min(drag.image.width, drag.image.height) / MAX_ZOOM
    const maximumSize = Math.min(drag.image.width, drag.image.height)
    const size = clamp(
      Math.max(Math.abs(point.x - drag.centerX), Math.abs(point.y - drag.centerY)) * 2,
      minimumSize,
      maximumSize,
    )
    const x = clamp(drag.centerX - size / 2, drag.image.x, drag.image.x + drag.image.width - size)
    const y = clamp(drag.centerY - size / 2, drag.image.y, drag.image.y + drag.image.height - size)
    onChange(positionFromSelection(drag.image, size, x, y))
  }

  const stopDragging = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <div className="crop-selector">
      <canvas
        ref={canvasRef}
        width={SELECTOR_WIDTH}
        height={SELECTOR_HEIGHT}
        aria-label="可视化头像裁切选区"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
      />
      <div className="crop-selector-help">
        <span><i className="move-symbol" />拖动选框调整范围</span>
        <span><i className="resize-symbol" />拖动右下角缩放</span>
      </div>
    </div>
  )
}
