import { describe, expect, test } from 'bun:test'
import { getCropSelectorLayout } from './AvatarCropSelector'
import { getSquareCrop } from './avatarCanvas'

describe('getCropSelectorLayout', () => {
  test('shows a centered square over a contained landscape image', () => {
    const layout = getCropSelectorLayout(1200, 800, { zoom: 1, positionX: 0, positionY: 0 })
    expect(layout.image).toEqual({ x: 15, y: 0, width: 630, height: 420 })
    expect(layout.selection).toEqual({ x: 120, y: 0, width: 420, height: 420 })
  })

  test('maps position values to the visual selection edges', () => {
    const left = getCropSelectorLayout(1200, 800, { zoom: 1, positionX: -100, positionY: 0 })
    const right = getCropSelectorLayout(1200, 800, { zoom: 1, positionX: 100, positionY: 0 })
    expect(left.selection.x).toBe(left.image.x)
    expect(right.selection.x + right.selection.width).toBe(right.image.x + right.image.width)
  })

  test('keeps zoomed selections square and centered', () => {
    const layout = getCropSelectorLayout(800, 1000, { zoom: 2, positionX: 0, positionY: 0 })
    expect(layout.selection.width).toBe(168)
    expect(layout.selection.height).toBe(168)
    expect(layout.selection.x + 84).toBe(330)
    expect(layout.selection.y + 84).toBe(210)
  })

  test('matches the source rectangle used by PNG export', () => {
    const crop = { zoom: 2.5, positionX: 36, positionY: -42 }
    const layout = getCropSelectorLayout(1200, 800, crop)
    const source = getSquareCrop(1200, 800, crop.zoom, crop.positionX, crop.positionY)
    const displayScale = layout.image.width / 1200
    expect((layout.selection.x - layout.image.x) / displayScale).toBeCloseTo(source.sourceX)
    expect((layout.selection.y - layout.image.y) / displayScale).toBeCloseTo(source.sourceY)
    expect(layout.selection.width / displayScale).toBeCloseTo(source.sourceSize)
  })
})
