import { describe, expect, test } from 'bun:test'
import { createFilledSilhouette, smoothAlpha } from './silhouette'

function mask(rows: string[]) {
  const width = rows[0].length
  return {
    width,
    height: rows.length,
    alpha: Uint8Array.from(rows.join('').split('').map((pixel) => pixel === '#' ? 255 : 0)),
  }
}

describe('createFilledSilhouette', () => {
  test('填满完全封闭的文字孔洞', () => {
    const input = mask([
      '.......',
      '.#####.',
      '.#...#.',
      '.#...#.',
      '.#...#.',
      '.#####.',
      '.......',
    ])
    const result = createFilledSilhouette(input.alpha, input.width, input.height, 0)
    expect(result[3 * input.width + 3]).toBe(255)
    expect(result[0]).toBe(0)
  })

  test('保留与画布外部连通的空白', () => {
    const input = mask([
      '.......',
      '.#####.',
      '.#.....',
      '.#.....',
      '.#.....',
      '.#####.',
      '.......',
    ])
    const result = createFilledSilhouette(input.alpha, input.width, input.height, 0)
    expect(result[3 * input.width + 3]).toBe(0)
  })

  test('通过圆形膨胀连接 Logo 与文字区域', () => {
    const input = mask([
      '.........',
      '..#...#..',
      '.........',
    ])
    const result = createFilledSilhouette(input.alpha, input.width, input.height, 2)
    expect(result[1 * input.width + 4]).toBe(255)
    expect(result[0]).toBe(0)
  })
})

describe('smoothAlpha', () => {
  test('为硬边缘生成中间透明度', () => {
    const source = Uint8ClampedArray.from([0, 0, 255, 255, 255])
    const result = smoothAlpha(source, 5, 1, 1)
    expect(result.some((value) => value > 0 && value < 255)).toBe(true)
  })

  test('平滑为 0 时保持原始蒙版', () => {
    const source = Uint8ClampedArray.from([0, 255])
    expect(smoothAlpha(source, 2, 1, 0)).toEqual(source)
  })
})
