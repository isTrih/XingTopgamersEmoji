import { describe, expect, test } from 'bun:test'
import { getSquareCrop } from './avatarCanvas'

describe('getSquareCrop', () => {
  test('center-crops a landscape image to a square', () => {
    expect(getSquareCrop(1200, 800, 1, 0, 0)).toEqual({
      sourceX: 200,
      sourceY: 0,
      sourceSize: 800,
    })
  })

  test('moves the crop across the available image area', () => {
    expect(getSquareCrop(1200, 800, 1, 100, 0).sourceX).toBe(400)
    expect(getSquareCrop(1200, 800, 1, -100, 0).sourceX).toBe(0)
  })

  test('zoom keeps the crop square and centered', () => {
    expect(getSquareCrop(800, 1000, 2, 0, 0)).toEqual({
      sourceX: 200,
      sourceY: 300,
      sourceSize: 400,
    })
  })
})
