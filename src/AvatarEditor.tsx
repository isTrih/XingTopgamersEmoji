import { useEffect, useMemo, useRef, useState } from 'react'
import { Download, ImagePlus, RotateCcw, Upload } from 'lucide-react'
import { AVATAR_SIZE, type AvatarEditorState } from './avatarCanvas'
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
  fontSize: 42,
  fontWeight: 800,
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

export function AvatarEditor() {
  const [state, setState] = useState<AvatarEditorState>(initialState)
  const [avatarImage, setAvatarImage] = useState<HTMLImageElement | null>(null)
  const [avatarName, setAvatarName] = useState('尚未上传')
  const imageUrlRef = useRef<string | null>(null)
  const canvasRef = useAvatarCanvas(avatarImage, state)

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

  useEffect(() => () => {
    if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current)
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

  const reset = () => setState(initialState)

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
            <small className="field-hint">图片会自动铺满并裁切为 1:1 正方形</small>
          </div>

          <div className="divider" />
          <div className="section-heading">裁切位置</div>
          <RangeField label="缩放" value={state.zoom} min={1} max={3} step={0.05} unit="×" onChange={(value) => update('zoom', value)} />
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
          <RangeField label="遮罩高度" value={state.maskHeight} min={100} max={250} unit="px" onChange={(value) => update('maskHeight', value)} />
          <RangeField label="弧形深度" value={state.arcDepth} min={0} max={90} unit="px" onChange={(value) => update('arcDepth', value)} />
          <RangeField label="遮罩透明度" value={state.maskOpacity} min={0.2} max={1} step={0.05} onChange={(value) => update('maskOpacity', value)} />
          <div className="color-grid">
            <ColorField label="遮罩颜色" value={state.maskColor} onChange={(value) => update('maskColor', value)} />
            <ColorField label="文字颜色" value={state.textColor} onChange={(value) => update('textColor', value)} />
          </div>

          <div className="divider" />
          <div className="section-heading">文字样式</div>
          <RangeField label="文字大小" value={state.fontSize} min={24} max={68} unit="px" onChange={(value) => update('fontSize', value)} />
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
