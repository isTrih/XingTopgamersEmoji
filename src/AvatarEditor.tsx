import { useEffect, useMemo, useRef, useState } from 'react'
import { Download, ImagePlus, RotateCcw, Upload } from 'lucide-react'
import { AVATAR_SIZE, type AvatarEditorState, type AvatarFontFamilies } from './avatarCanvas'
import { AvatarCropSelector } from './AvatarCropSelector'
import { FontSelect } from './FontSelect'
import { useBuiltInFonts } from './builtInFonts'
import { useAvatarCanvas } from './useAvatarCanvas'

const initialState: AvatarEditorState = {
  zoom: 1,
  positionX: 0,
  positionY: 0,
  topEnabled: true,
  topText: '闪耀每一天',
  bottomEnabled: true,
  bottomText: 'XING AVATAR',
  maskColor: '#5D47D2',
  maskOpacity: 0.9,
  maskHeight: 170,
  arcDepth: 48,
  textColor: '#FFFFFF',
  topFontSize: 42,
  topTextX: 0,
  topTextY: 0,
  bottomFontSize: 42,
  bottomTextX: 0,
  bottomTextY: 0,
  fontWeight: 800,
}

const systemFonts: AvatarFontFamilies = {
  top: 'XingAvatarSystemTop',
  bottom: 'XingAvatarSystemBottom',
}

function RangeField({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (value: number) => void
}) {
  const percent = ((value - min) / (max - min)) * 100
  return (
    <label className="range-field">
      <span className="range-label"><span>{label}</span><strong>{value}{unit}</strong></span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ '--range-progress': `${percent}%` } as React.CSSProperties}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="color-field">
      <span>{label}</span>
      <span className="color-value">
        <input type="color" value={value} onChange={(event) => onChange(event.target.value)} />
        <code>{value.toUpperCase()}</code>
      </span>
    </label>
  )
}

function NumberField({
  label,
  value,
  unit,
  min,
  onChange,
}: {
  label: string
  value: number
  unit: string
  min?: number
  onChange: (value: number) => void
}) {
  return (
    <label className="number-field">
      <span>{label}</span>
      <span className="number-input-wrap">
        <input
          type="number"
          min={min}
          step={1}
          value={value}
          onChange={(event) => {
            const nextValue = Number(event.target.value)
            if (Number.isFinite(nextValue)) onChange(min === undefined ? nextValue : Math.max(min, nextValue))
          }}
        />
        <small>{unit}</small>
      </span>
    </label>
  )
}

export function AvatarEditor() {
  const [state, setState] = useState<AvatarEditorState>(initialState)
  const [avatarImage, setAvatarImage] = useState<HTMLImageElement | null>(null)
  const [avatarName, setAvatarName] = useState('尚未上传')
  const [fonts, setFonts] = useState<AvatarFontFamilies>(systemFonts)
  const [topFontName, setTopFontName] = useState('系统字体')
  const [bottomFontName, setBottomFontName] = useState('系统字体')
  const imageUrlRef = useRef<string | null>(null)
  const topFontUrlRef = useRef<string | null>(null)
  const bottomFontUrlRef = useRef<string | null>(null)
  const topFontFaceRef = useRef<FontFace | null>(null)
  const bottomFontFaceRef = useRef<FontFace | null>(null)
  const availableFonts = useBuiltInFonts()
  const canvasRef = useAvatarCanvas(avatarImage, state, fonts)

  const update = <K extends keyof AvatarEditorState>(key: K, value: AvatarEditorState[K]) => {
    setState((previous) => ({ ...previous, [key]: value }))
  }

  const handleUpload = (file?: File) => {
    if (!file) return
    if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current)
    const url = URL.createObjectURL(file)
    imageUrlRef.current = url
    const image = new Image()
    image.onload = () => {
      setAvatarImage(image)
      setAvatarName(file.name)
      setState((previous) => ({ ...previous, zoom: 1, positionX: 0, positionY: 0 }))
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      imageUrlRef.current = null
      window.alert('头像读取失败，请上传 PNG、JPG、WebP、GIF 或 SVG 图片。')
    }
    image.src = url
  }

  const handleFontUpload = async (position: 'top' | 'bottom', file?: File) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    const family = `XingAvatar-${position}-${Date.now()}`
    const face = new FontFace(family, `url(${url})`)

    try {
      await face.load()
      document.fonts.add(face)
      const urlRef = position === 'top' ? topFontUrlRef : bottomFontUrlRef
      const faceRef = position === 'top' ? topFontFaceRef : bottomFontFaceRef
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
      if (faceRef.current) document.fonts.delete(faceRef.current)
      urlRef.current = url
      faceRef.current = face
      setFonts((previous) => ({ ...previous, [position]: family }))
      const name = file.name.replace(/\.[^.]+$/, '')
      if (position === 'top') setTopFontName(name)
      else setBottomFontName(name)
    } catch {
      URL.revokeObjectURL(url)
      window.alert('字体读取失败，请上传 TTF、OTF、WOFF 或 WOFF2 字体。')
    }
  }

  useEffect(() => () => {
    if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current)
    if (topFontUrlRef.current) URL.revokeObjectURL(topFontUrlRef.current)
    if (bottomFontUrlRef.current) URL.revokeObjectURL(bottomFontUrlRef.current)
    if (topFontFaceRef.current) document.fonts.delete(topFontFaceRef.current)
    if (bottomFontFaceRef.current) document.fonts.delete(bottomFontFaceRef.current)
  }, [])

  const fileName = useMemo(() => {
    const originalName = avatarName.replace(/\.[^.]+$/, '')
    return `${originalName === '尚未上传' ? '星图头像' : originalName}-头像框.png`
  }, [avatarName])

  const download = () => {
    const canvas = canvasRef.current
    if (!canvas || !avatarImage) return
    const link = document.createElement('a')
    link.download = fileName
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const reset = () => {
    if (topFontUrlRef.current) URL.revokeObjectURL(topFontUrlRef.current)
    if (bottomFontUrlRef.current) URL.revokeObjectURL(bottomFontUrlRef.current)
    if (topFontFaceRef.current) document.fonts.delete(topFontFaceRef.current)
    if (bottomFontFaceRef.current) document.fonts.delete(bottomFontFaceRef.current)
    topFontUrlRef.current = null
    bottomFontUrlRef.current = null
    topFontFaceRef.current = null
    bottomFontFaceRef.current = null
    setState(initialState)
    setFonts(systemFonts)
    setTopFontName('系统字体')
    setBottomFontName('系统字体')
  }

  return (
    <section className="studio-shell">
      <aside className="control-panel">
        <div className="panel-heading">
          <strong>头像框设置</strong>
          <button className="panel-reset" onClick={reset}><RotateCcw size={14} /> 重置</button>
        </div>
        <div className="panel-content unified-panel-content">
          <div className="field-group">
            <span className="field-title">头像图片</span>
            <label className="avatar-upload-card">
              <span className="upload-icon"><ImagePlus size={19} /></span>
              <span><strong>上传任意尺寸图片</strong><small title={avatarName}>{avatarName}</small></span>
              <Upload size={15} />
              <input type="file" accept="image/*" onChange={(event) => handleUpload(event.target.files?.[0])} />
            </label>
            <small className="field-hint">上传后可在原图上拖动并缩放正方形选区</small>
          </div>

          {avatarImage && (
            <>
              <div className="divider" />
              <div className="section-heading">可视化裁切</div>
              <AvatarCropSelector
                image={avatarImage}
                value={{ zoom: state.zoom, positionX: state.positionX, positionY: state.positionY }}
                onChange={(crop) => setState((previous) => ({ ...previous, ...crop }))}
              />
            </>
          )}

          <div className="divider" />
          <div className="section-heading">裁切精细调节</div>
          <RangeField label="缩放" value={state.zoom} min={1} max={10} step={0.05} unit="×" onChange={(value) => update('zoom', value)} />
          <RangeField label="水平位置" value={state.positionX} min={-100} max={100} unit="%" onChange={(value) => update('positionX', value)} />
          <RangeField label="垂直位置" value={state.positionY} min={-100} max={100} unit="%" onChange={(value) => update('positionY', value)} />

          <div className="divider" />
          <div className="section-heading">弧形遮罩</div>
          <label className="switch-row">
            <span><strong>上弧形遮罩</strong><small>显示在头像顶部</small></span>
            <input type="checkbox" checked={state.topEnabled} onChange={(event) => update('topEnabled', event.target.checked)} />
          </label>
          {state.topEnabled && (
            <label className="field-group">
              <span className="field-title">上方文字 <small>{state.topText.length}/16</small></span>
              <input className="text-input" maxLength={16} value={state.topText} onChange={(event) => update('topText', event.target.value)} placeholder="输入上方文字" />
            </label>
          )}
          <label className="switch-row">
            <span><strong>下弧形遮罩</strong><small>显示在头像底部</small></span>
            <input type="checkbox" checked={state.bottomEnabled} onChange={(event) => update('bottomEnabled', event.target.checked)} />
          </label>
          {state.bottomEnabled && (
            <label className="field-group">
              <span className="field-title">下方文字 <small>{state.bottomText.length}/16</small></span>
              <input className="text-input" maxLength={16} value={state.bottomText} onChange={(event) => update('bottomText', event.target.value)} placeholder="输入下方文字" />
            </label>
          )}
          <NumberField label="遮罩高度（无上限）" value={state.maskHeight} min={0} unit="px" onChange={(value) => update('maskHeight', value)} />
          <RangeField label="弧形深度" value={state.arcDepth} min={0} max={90} unit="px" onChange={(value) => update('arcDepth', value)} />
          <RangeField label="遮罩透明度" value={state.maskOpacity} min={0.2} max={1} step={0.05} onChange={(value) => update('maskOpacity', value)} />
          <div className="color-grid">
            <ColorField label="遮罩颜色" value={state.maskColor} onChange={(value) => update('maskColor', value)} />
            <ColorField label="文字颜色" value={state.textColor} onChange={(value) => update('textColor', value)} />
          </div>

          <div className="divider" />
          <div className="section-heading">文字样式</div>
          <div className="font-select-grid">
            <FontSelect
              label="上方内置字体"
              value={fonts.top}
              systemFamily={systemFonts.top}
              systemName="系统字体"
              currentName={topFontName}
              fonts={availableFonts}
              onChange={(family, name) => {
                setFonts((previous) => ({ ...previous, top: family }))
                setTopFontName(name)
              }}
            />
            <FontSelect
              label="下方内置字体"
              value={fonts.bottom}
              systemFamily={systemFonts.bottom}
              systemName="系统字体"
              currentName={bottomFontName}
              fonts={availableFonts}
              onChange={(family, name) => {
                setFonts((previous) => ({ ...previous, bottom: family }))
                setBottomFontName(name)
              }}
            />
          </div>
          <div className="field-group">
            <span className="field-title">分别上传字体</span>
            <div className="upload-grid">
              <label className="upload-card">
                <span className="upload-icon"><Upload size={18} /></span>
                <span><strong>上方字体</strong><small title={topFontName}>{topFontName}</small></span>
                <input type="file" accept=".ttf,.otf,.woff,.woff2,font/*" onChange={(event) => handleFontUpload('top', event.target.files?.[0])} />
              </label>
              <label className="upload-card">
                <span className="upload-icon"><Upload size={18} /></span>
                <span><strong>下方字体</strong><small title={bottomFontName}>{bottomFontName}</small></span>
                <input type="file" accept=".ttf,.otf,.woff,.woff2,font/*" onChange={(event) => handleFontUpload('bottom', event.target.files?.[0])} />
              </label>
            </div>
          </div>
          <div className="text-layout-card">
            <strong>上方文字</strong>
            <div className="number-field-grid">
              <NumberField label="字号（无上限）" value={state.topFontSize} min={1} unit="px" onChange={(value) => update('topFontSize', value)} />
              <NumberField label="横向位置" value={state.topTextX} unit="px" onChange={(value) => update('topTextX', value)} />
              <NumberField label="纵向位置" value={state.topTextY} unit="px" onChange={(value) => update('topTextY', value)} />
            </div>
          </div>
          <div className="text-layout-card">
            <strong>下方文字</strong>
            <div className="number-field-grid">
              <NumberField label="字号（无上限）" value={state.bottomFontSize} min={1} unit="px" onChange={(value) => update('bottomFontSize', value)} />
              <NumberField label="横向位置" value={state.bottomTextX} unit="px" onChange={(value) => update('bottomTextX', value)} />
              <NumberField label="纵向位置" value={state.bottomTextY} unit="px" onChange={(value) => update('bottomTextY', value)} />
            </div>
          </div>
          <RangeField label="文字粗细" value={state.fontWeight} min={400} max={900} step={100} onChange={(value) => update('fontWeight', value)} />
        </div>
      </aside>

      <section className="preview-panel">
        <div className="preview-header">
          <div><span className="live-dot" /> 实时预览</div>
          <span>{AVATAR_SIZE} × {AVATAR_SIZE} px</span>
        </div>
        <div className="canvas-stage avatar-stage">
          <div className="stage-glow avatar-glow" />
          <div className="canvas-wrap avatar-canvas-wrap">
            <canvas ref={canvasRef} aria-label="头像框实时预览" />
          </div>
        </div>
        <div className="export-row avatar-export-row">
          {!avatarImage && <span>上传图片后即可导出</span>}
          <button className="download-button" disabled={!avatarImage} onClick={download}><Download size={18} /> 导出头像 PNG</button>
        </div>
      </section>
    </section>
  )
}
