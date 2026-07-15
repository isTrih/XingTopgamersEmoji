import { useEffect, useRef } from 'react'
import { renderAvatar, type AvatarEditorState } from './avatarCanvas'

export function useAvatarCanvas(image: HTMLImageElement | null, state: AvatarEditorState) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) renderAvatar(canvas, image, state)
  }, [image, state])

  return canvasRef
}
