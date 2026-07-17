import { useEffect, useRef } from 'react'
import { renderAvatar, type AvatarEditorState, type AvatarFontFamilies } from './avatarCanvas'

export function useAvatarCanvas(
  image: HTMLImageElement | null,
  state: AvatarEditorState,
  fonts: AvatarFontFamilies,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) renderAvatar(canvas, image, state, fonts)
  }, [image, state, fonts])

  return canvasRef
}
