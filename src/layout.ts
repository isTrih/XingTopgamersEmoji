export const MAX_OUTPUT_WIDTH = 464
export const MAX_CONTENT_WIDTH = 462
export const OUTPUT_HEIGHT = 96
export const INNER_HEIGHT = 94

export function getOutputGeometry(naturalWidth: number) {
  const sourceWidth = Math.max(1, Math.ceil(naturalWidth))
  if (sourceWidth <= MAX_CONTENT_WIDTH) {
    return {
      sourceWidth,
      outputWidth: sourceWidth + 2,
      scale: 1,
    }
  }
  return {
    sourceWidth,
    outputWidth: MAX_OUTPUT_WIDTH,
    scale: MAX_CONTENT_WIDTH / sourceWidth,
  }
}
