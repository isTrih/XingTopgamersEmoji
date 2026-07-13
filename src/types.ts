export type Palette = {
  kind: 'tonal' | 'contrast'
  name: string
  swatch: string
  backgroundFrom: string
  backgroundTo: string
  textFrom: string
  textTo: string
  accent: string
}

export type EditorState = {
  style: 'classic' | 'octagon'
  text: string
  fontSize: number
  fontWeight: number
  innerStrokeWidth: number
  edgeSmoothing: number
  logoGap: number
  backgroundFrom: string
  backgroundTo: string
  textFrom: string
  textTo: string
  accent: string
}
