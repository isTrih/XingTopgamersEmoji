import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronDown,
  Download,
  ImagePlus,
  RotateCcw,
  Save,
  Upload,
} from 'lucide-react'
import { palettes } from './palettes'
import { useEmojiCanvas } from './useEmojiCanvas'
import type { EditorState, Palette } from './types'
import defaultLogoUrl from '../Logo.png'
import { AvatarEditor } from './AvatarEditor'
import { FontSelect } from './FontSelect'
import { useBuiltInFonts } from './builtInFonts'
import { HistoryPanel } from './HistoryPanel'
import { canvasToPngBlob, useCreationHistory, useHistorySaveStatus, type SaveCreationInput } from './useCreationHistory'
import { usePersistentState } from './usePersistentState'

const PRESETS_PER_PAGE = 20

const initialState: EditorState = {
  style: 'classic',
  text: '欢迎新人',
  fontSize: 70,
  fontWeight: 800,
  innerStrokeWidth: 1.8,
  edgeSmoothing: 0.8,
  logoGap: 10,
  ...palettes[0],
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

function RangeField({
  label,
  value,
  min,
  max,
  step = 1,
  unit = 'px',
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

function EmojiEditor({ onSaveHistory }: { onSaveHistory: (item: SaveCreationInput) => Promise<boolean> }) {
  const [state, setState] = usePersistentState<EditorState>('xingemoji:settings:emoji:v1', initialState)
  const [preferredFontFamily, setPreferredFontFamily] = usePersistentState('xingemoji:settings:emoji-font:v1', 'XingEmojiDefault')
  const [fontFamily, setFontFamily] = useState('XingEmojiDefault')
  const [fontName, setFontName] = useState('系统粗体')
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null)
  const [defaultLogoImage, setDefaultLogoImage] = useState<HTMLImageElement | null>(null)
  const [logoName, setLogoName] = useState('Logo.png')
  const [presetQuery, setPresetQuery] = useState('')
  const [presetKind, setPresetKind] = useState<Palette['kind']>('tonal')
  const [presetPage, setPresetPage] = useState(0)
  const fontUrlRef = useRef<string | null>(null)
  const logoUrlRef = useRef<string | null>(null)
  const availableFonts = useBuiltInFonts()
  const historySave = useHistorySaveStatus()
  const { canvasRef, outputWidth } = useEmojiCanvas(state, fontFamily, logoImage)
  const categoryPalettes = useMemo(() => palettes.filter((palette) => palette.kind === presetKind), [presetKind])
  const filteredPalettes = useMemo(() => {
    const query = presetQuery.trim().toLocaleLowerCase('zh-CN')
    return query
      ? categoryPalettes.filter((palette) => palette.name.toLocaleLowerCase('zh-CN').includes(query))
      : categoryPalettes
  }, [categoryPalettes, presetQuery])
  const presetPageCount = Math.max(1, Math.ceil(filteredPalettes.length / PRESETS_PER_PAGE))
  const visiblePalettes = filteredPalettes.slice(
    presetPage * PRESETS_PER_PAGE,
    (presetPage + 1) * PRESETS_PER_PAGE,
  )

  const changePresetKind = (kind: Palette['kind']) => {
    setPresetKind(kind)
    setPresetPage(0)
  }

  const changePresetQuery = (value: string) => {
    setPresetQuery(value)
    setPresetPage(0)
  }

  useEffect(() => {
    const image = new Image()
    image.onload = () => {
      setDefaultLogoImage(image)
      setLogoImage((current) => current ?? image)
    }
    image.src = defaultLogoUrl
  }, [])

  useEffect(() => {
    if (preferredFontFamily === 'XingEmojiDefault') {
      setFontFamily('XingEmojiDefault')
      setFontName('系统粗体')
      return
    }
    const font = availableFonts.find((item) => item.family === preferredFontFamily)
    if (font && !fontUrlRef.current) {
      setFontFamily(font.family)
      setFontName(font.name)
    }
  }, [availableFonts, preferredFontFamily])

  const update = <K extends keyof EditorState>(key: K, value: EditorState[K]) => {
    setState((previous) => ({ ...previous, [key]: value }))
  }

  const applyPalette = (palette: Palette) => {
    setState((previous) => ({
      ...previous,
      backgroundFrom: palette.backgroundFrom,
      backgroundTo: palette.backgroundTo,
      textFrom: palette.textFrom,
      textTo: palette.textTo,
      accent: palette.accent,
    }))
  }

  const handleFontUpload = async (file?: File) => {
    if (!file) return
    if (fontUrlRef.current) URL.revokeObjectURL(fontUrlRef.current)
    const url = URL.createObjectURL(file)
    fontUrlRef.current = url
    const family = `XingEmoji-${Date.now()}`
    const face = new FontFace(family, `url(${url})`)
    try {
      await face.load()
      document.fonts.add(face)
      setFontFamily(family)
      setFontName(file.name.replace(/\.[^.]+$/, ''))
    } catch {
      URL.revokeObjectURL(url)
      fontUrlRef.current = null
      window.alert('字体读取失败，请上传 TTF、OTF、WOFF 或 WOFF2 字体。')
    }
  }

  const handleLogoUpload = (file?: File) => {
    if (!file) return
    if (logoUrlRef.current) URL.revokeObjectURL(logoUrlRef.current)
    const url = URL.createObjectURL(file)
    logoUrlRef.current = url
    const image = new Image()
    image.onload = () => {
      setLogoImage(image)
      setLogoName(file.name)
    }
    image.onerror = () => window.alert('Logo 读取失败，请换一张 PNG、JPG、WebP 或 SVG。')
    image.src = url
  }

  useEffect(() => () => {
    if (fontUrlRef.current) URL.revokeObjectURL(fontUrlRef.current)
    if (logoUrlRef.current) URL.revokeObjectURL(logoUrlRef.current)
  }, [])

  const downloadName = useMemo(() => `${state.text.trim() || '星图表情'}.png`, [state.text])
  const download = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = downloadName
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const saveToHistory = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    historySave.run(async () => {
      try {
        const blob = await canvasToPngBlob(canvas)
        return await onSaveHistory({
          kind: 'emoji',
          name: downloadName,
          width: canvas.width,
          height: canvas.height,
          blob,
        })
      } catch {
        return false
      }
    })
  }

  const reset = () => {
    setState(initialState)
    setFontFamily('XingEmojiDefault')
    setPreferredFontFamily('XingEmojiDefault')
    setFontName('系统粗体')
    setLogoImage(defaultLogoImage)
    setLogoName('Logo.png')
  }

  return (
      <section className="studio-shell">
        <aside className="control-panel">
          <div className="panel-heading">
            <strong>表情设置</strong>
            <button className="panel-reset" onClick={reset}><RotateCcw size={14} /> 重置</button>
          </div>
          <div className="panel-content unified-panel-content">
            <div className="field-group">
              <span className="field-title">表情风格</span>
              <div className="style-picker">
                <button className={state.style === 'classic' ? 'active' : ''} onClick={() => update('style', 'classic')}>
                  <strong>经典徽章</strong><small>厚底描边 · 高光字</small>
                </button>
                <button className={state.style === 'octagon' ? 'active' : ''} onClick={() => update('style', 'octagon')}>
                  <strong>八角轻影</strong><small>渐变字 · 半透明投影</small>
                </button>
              </div>
            </div>

            <label className="field-group">
              <span className="field-title">表情文字 <small>{state.text.length}/12</small></span>
              <input className="text-input" maxLength={12} value={state.text} onChange={(event) => update('text', event.target.value)} placeholder="输入一句话" />
            </label>

            <div className="field-group">
              <span className="field-title">自定义素材</span>
              <FontSelect
                label="内置字体"
                value={fontFamily}
                systemFamily="XingEmojiDefault"
                systemName="系统粗体"
                currentName={fontName}
                fonts={availableFonts}
                onChange={(family, name) => {
                  setFontFamily(family)
                  setPreferredFontFamily(family)
                  setFontName(name)
                }}
              />
              <div className="upload-grid">
                <label className="upload-card">
                  <span className="upload-icon"><Upload size={18} /></span>
                  <span><strong>上传字体</strong><small title={fontName}>{fontName}</small></span>
                  <ChevronDown size={14} />
                  <input type="file" accept=".ttf,.otf,.woff,.woff2,font/*" onChange={(event) => handleFontUpload(event.target.files?.[0])} />
                </label>
                <label className="upload-card">
                  <span className="upload-icon"><ImagePlus size={18} /></span>
                  <span><strong>上传 Logo</strong><small title={logoName}>{logoName}</small></span>
                  <ChevronDown size={14} />
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => handleLogoUpload(event.target.files?.[0])} />
                </label>
              </div>
            </div>

            <div className="divider" />
            <div className="section-heading">文字样式</div>
            <RangeField label="文字大小" value={state.fontSize} min={36} max={74} onChange={(value) => update('fontSize', value)} />
            <RangeField label="文字粗细" value={state.fontWeight} min={400} max={1000} step={100} unit="" onChange={(value) => update('fontWeight', value)} />
            {state.style === 'classic' && (
              <>
                <RangeField label="白色内描边" value={state.innerStrokeWidth} min={0} max={4} step={0.2} onChange={(value) => update('innerStrokeWidth', value)} />
                <RangeField label="边缘平滑" value={state.edgeSmoothing} min={0} max={2} step={0.2} onChange={(value) => update('edgeSmoothing', value)} />
              </>
            )}

            <div className="divider" />
            <div className="field-group">
              <span className="field-title">灵感预设 <small>{filteredPalettes.length}/{categoryPalettes.length}</small></span>
              <div className="preset-kinds">
                <button className={presetKind === 'tonal' ? 'active' : ''} onClick={() => changePresetKind('tonal')}>同色系 120</button>
                <button className={presetKind === 'contrast' ? 'active' : ''} onClick={() => changePresetKind('contrast')}>精选撞色 120</button>
              </div>
              <input
                className="preset-search"
                value={presetQuery}
                onChange={(event) => changePresetQuery(event.target.value)}
                placeholder="搜索：龙、火焰、深海、星云…"
              />
              <div className="palette-grid">
                {visiblePalettes.map((palette) => (
                  <button key={palette.name} className="palette-button" onClick={() => applyPalette(palette)}>
                    <span style={{ background: `linear-gradient(135deg, ${palette.backgroundFrom}, ${palette.backgroundTo})` }} />
                    {palette.name}
                  </button>
                ))}
              </div>
              {filteredPalettes.length === 0 && <div className="preset-empty">没有匹配的预设</div>}
              {filteredPalettes.length > 0 && (
                <div className="preset-pagination">
                  <button disabled={presetPage === 0} onClick={() => setPresetPage((page) => Math.max(0, page - 1))}>上一页</button>
                  <span>{presetPage + 1} / {presetPageCount}</span>
                  <button disabled={presetPage >= presetPageCount - 1} onClick={() => setPresetPage((page) => Math.min(presetPageCount - 1, page + 1))}>下一页</button>
                </div>
              )}
            </div>

            <div className="divider" />
            <div className="color-section">
              <span className="field-title">{state.style === 'classic' ? '厚底渐变' : '文字与八角框渐变'}</span>
              <div className="color-grid">
                <ColorField label="底色上色" value={state.backgroundFrom} onChange={(value) => update('backgroundFrom', value)} />
                <ColorField label="底色下色" value={state.backgroundTo} onChange={(value) => update('backgroundTo', value)} />
              </div>
            </div>
            {state.style === 'classic' && (
              <div className="color-section">
                <span className="field-title">文字与外描边</span>
                <div className="color-grid">
                  <ColorField label="文字上色" value={state.textFrom} onChange={(value) => update('textFrom', value)} />
                  <ColorField label="文字下色" value={state.textTo} onChange={(value) => update('textTo', value)} />
                  <ColorField label="最外描边" value={state.accent} onChange={(value) => update('accent', value)} />
                </div>
              </div>
            )}
          </div>
        </aside>

        <section className="preview-panel">
          <div className="preview-header">
            <div><span className="live-dot" /> 实时预览</div>
            <span>{outputWidth} × 96 px</span>
          </div>
          <div className="canvas-stage">
            <div className="stage-glow" />
            <div className="canvas-wrap" style={{ width: outputWidth }}>
              <canvas ref={canvasRef} aria-label="表情包实时预览" />
            </div>
          </div>
          <div className="export-row">
            <button className="history-save-button" disabled={historySave.status === 'saving'} onClick={saveToHistory}>
              <Save size={17} />
              {historySave.status === 'saving' ? '保存中…' : historySave.status === 'saved' ? '已保存' : historySave.status === 'error' ? '保存失败' : '保存到历史'}
            </button>
            <button className="download-button" onClick={download}><Download size={18} /> 导出 PNG</button>
          </div>
        </section>
      </section>
  )
}

export function App() {
  const [activeTab, setActiveTab] = useState<'emoji' | 'avatar' | 'history'>('emoji')
  const history = useCreationHistory()

  const removeHistory = (id: string) => {
    history.remove(id)
  }

  const clearHistory = () => {
    if (window.confirm('确定清空所有表情包和头像历史吗？此操作无法撤销。')) history.clear()
  }

  return (
    <main>
      <div className="app-workspace">
        <nav className="editor-tabs" aria-label="编辑器类型">
          <button className={activeTab === 'emoji' ? 'active' : ''} onClick={() => setActiveTab('emoji')}>表情编辑器</button>
          <button className={activeTab === 'avatar' ? 'active' : ''} onClick={() => setActiveTab('avatar')}>头像编辑器</button>
          <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>历史记录{history.items.length > 0 ? ` ${history.items.length}` : ''}</button>
        </nav>
        {activeTab === 'emoji' && <EmojiEditor onSaveHistory={history.save} />}
        {activeTab === 'avatar' && <AvatarEditor onSaveHistory={history.save} />}
        {activeTab === 'history' && (
          <HistoryPanel
            items={history.items}
            loading={history.loading}
            error={history.error}
            onRemove={removeHistory}
            onClear={clearHistory}
          />
        )}
      </div>
    </main>
  )
}
