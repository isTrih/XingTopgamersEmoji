import { useEffect, useMemo, useState } from 'react'
import { Download, Images, Trash2 } from 'lucide-react'
import type { CreationHistoryItem, CreationKind } from './useCreationHistory'

function HistoryCard({ item, onRemove }: { item: CreationHistoryItem; onRemove: (id: string) => void }) {
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    const url = URL.createObjectURL(item.blob)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [item.blob])

  const download = () => {
    const link = document.createElement('a')
    link.download = item.name
    link.href = previewUrl
    link.click()
  }

  return (
    <article className="history-card">
      <div className={`history-preview ${item.kind === 'avatar' ? 'avatar' : ''}`}>
        {previewUrl && <img src={previewUrl} alt={item.name} />}
      </div>
      <div className="history-card-info">
        <strong title={item.name}>{item.name.replace(/\.png$/i, '')}</strong>
        <span>{item.kind === 'emoji' ? '表情包' : '头像'} · {item.width} × {item.height}</span>
        <time>{new Date(item.createdAt).toLocaleString('zh-CN', { hour12: false })}</time>
      </div>
      <div className="history-card-actions">
        <button onClick={download} title="下载 PNG"><Download size={15} /> 下载</button>
        <button className="danger" onClick={() => onRemove(item.id)} title="删除记录"><Trash2 size={15} /> 删除</button>
      </div>
    </article>
  )
}

export function HistoryPanel({
  items,
  loading,
  error,
  onRemove,
  onClear,
}: {
  items: CreationHistoryItem[]
  loading: boolean
  error: string
  onRemove: (id: string) => void
  onClear: () => void
}) {
  const [filter, setFilter] = useState<'all' | CreationKind>('all')
  const visibleItems = useMemo(
    () => filter === 'all' ? items : items.filter((item) => item.kind === filter),
    [filter, items],
  )

  return (
    <section className="history-shell">
      <header className="history-header">
        <div>
          <span className="history-icon"><Images size={19} /></span>
          <span><strong>创作历史</strong><small>成品保存在当前浏览器中</small></span>
        </div>
        {items.length > 0 && <button className="history-clear" onClick={onClear}><Trash2 size={14} /> 清空全部</button>}
      </header>
      <div className="history-toolbar">
        <div className="history-filters">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>全部 {items.length}</button>
          <button className={filter === 'emoji' ? 'active' : ''} onClick={() => setFilter('emoji')}>表情包 {items.filter((item) => item.kind === 'emoji').length}</button>
          <button className={filter === 'avatar' ? 'active' : ''} onClick={() => setFilter('avatar')}>头像 {items.filter((item) => item.kind === 'avatar').length}</button>
        </div>
        <span>IndexedDB 本地存储</span>
      </div>
      {error && <div className="history-error">{error}</div>}
      <div className="history-content">
        {loading && <div className="history-empty">正在读取浏览器缓存…</div>}
        {!loading && visibleItems.length === 0 && (
          <div className="history-empty">
            <Images size={34} />
            <strong>{items.length === 0 ? '还没有保存的作品' : '该分类暂无作品'}</strong>
            <span>在编辑器中点击“保存到历史”即可在这里查看</span>
          </div>
        )}
        {!loading && visibleItems.length > 0 && (
          <div className="history-grid">
            {visibleItems.map((item) => <HistoryCard key={item.id} item={item} onRemove={onRemove} />)}
          </div>
        )}
      </div>
    </section>
  )
}
