import { describe, expect, test } from 'bun:test'
import { palettes } from './palettes'

describe('palettes', () => {
  test('提供 120 组同色系和 120 组撞色预设', () => {
    expect(palettes.filter((palette) => palette.kind === 'tonal')).toHaveLength(120)
    expect(palettes.filter((palette) => palette.kind === 'contrast')).toHaveLength(120)
    expect(palettes).toHaveLength(240)
    expect(new Set(palettes.map((palette) => palette.name)).size).toBe(palettes.length)
  })

  test('撞色预设的渐变两端颜色不同', () => {
    for (const palette of palettes.filter((item) => item.kind === 'contrast')) {
      expect(palette.backgroundFrom).not.toBe(palette.backgroundTo)
    }
  })

  test('撞色预设来自人工维护主题快照并保留原名', () => {
    const names = new Set(palettes.filter((item) => item.kind === 'contrast').map((item) => item.name))
    expect(names.has('Blue & Orange')).toBe(true)
    expect(names.has('Vice City')).toBe(true)
    expect(names.has('Superman')).toBe(true)
  })

  test('所有颜色均为六位十六进制', () => {
    for (const palette of palettes) {
      for (const color of [palette.backgroundFrom, palette.backgroundTo, palette.textFrom, palette.textTo, palette.accent]) {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i)
      }
    }
  })
})
