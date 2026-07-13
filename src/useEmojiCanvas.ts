import { useEffect, useRef, useState } from 'react'
import { renderEmoji } from './canvas'
import type { EditorState } from './types'

export function useEmojiCanvas(
  state: EditorState,
  fontFamily: string,
  logoImage: HTMLImageElement | null,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [outputWidth, setOutputWidth] = useState(408)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const result = renderEmoji(canvas, state, fontFamily, logoImage)
    setOutputWidth((current) => current === result.width ? current : result.width)
  }, [state, fontFamily, logoImage])

  return { canvasRef, outputWidth }
}
