import { useEffect, useState } from 'react'

export interface BuiltInFont {
  id: string
  name: string
  family: string
  file: string
}

export const builtInFonts: BuiltInFont[] = [
  { id: 'zhixiang', name: '智享', family: 'XingBuiltIn-ZhiXiang', file: '智享.otf' },
  { id: 'gehei', name: '格黑', family: 'XingBuiltIn-GeHei', file: '格黑.otf' },
  { id: 'chuangji', name: '窗机', family: 'XingBuiltIn-ChuangJi', file: '窗机.otf' },
  { id: 'qianyan', name: '千言', family: 'XingBuiltIn-QianYan', file: '千言.otf' },
  { id: 'jianhei', name: '间黑', family: 'XingBuiltIn-JianHei', file: '间黑.otf' },
  { id: 'zhishang', name: '智尚体', family: 'XingBuiltIn-ZhiShang', file: '智尚体.otf' },
]

let fontLoadPromise: Promise<BuiltInFont[]> | null = null

function assetUrl(file: string) {
  const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`
  return `${base}${encodeURIComponent(file)}`
}

export function loadBuiltInFonts() {
  if (fontLoadPromise) return fontLoadPromise
  fontLoadPromise = Promise.all(builtInFonts.map(async (font) => {
    const face = new FontFace(font.family, `url("${assetUrl(font.file)}")`)
    await face.load()
    document.fonts.add(face)
    return font
  }).map(async (request) => {
    try {
      return await request
    } catch {
      return null
    }
  })).then((fonts) => fonts.filter((font): font is BuiltInFont => font !== null))
  return fontLoadPromise
}

export function useBuiltInFonts() {
  const [loadedFonts, setLoadedFonts] = useState<BuiltInFont[]>([])

  useEffect(() => {
    let cancelled = false
    loadBuiltInFonts().then((fonts) => {
      if (!cancelled) setLoadedFonts(fonts)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return loadedFonts
}
