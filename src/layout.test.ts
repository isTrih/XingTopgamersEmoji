import { describe, expect, test } from 'bun:test'
import { getOutputGeometry } from './layout'

describe('getOutputGeometry', () => {
  test('内容不超过 462px 时仅增加左右各 1px', () => {
    expect(getOutputGeometry(320)).toEqual({ sourceWidth: 320, outputWidth: 322, scale: 1 })
  })

  test('内容超过 462px 时整体缩放到最大画布', () => {
    const result = getOutputGeometry(700)
    expect(result.outputWidth).toBe(464)
    expect(result.sourceWidth * result.scale).toBeCloseTo(462)
  })
})
