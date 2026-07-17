import { useCallback, useEffect, useRef, useState } from 'react'

const DATABASE_NAME = 'xing-emoji-studio'
const DATABASE_VERSION = 1
const STORE_NAME = 'creations'

export type CreationKind = 'emoji' | 'avatar'

export interface CreationHistoryItem {
  id: string
  kind: CreationKind
  name: string
  createdAt: number
  width: number
  height: number
  blob: Blob
}

export interface SaveCreationInput {
  kind: CreationKind
  name: string
  width: number
  height: number
  blob: Blob
}

let databasePromise: Promise<IDBDatabase> | null = null

function openDatabase() {
  if (databasePromise) return databasePromise
  databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return databasePromise
}

function transactionComplete(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

async function readAllHistory() {
  const database = await openDatabase()
  const transaction = database.transaction(STORE_NAME, 'readonly')
  const request = transaction.objectStore(STORE_NAME).getAll()
  const result = await new Promise<CreationHistoryItem[]>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as CreationHistoryItem[])
    request.onerror = () => reject(request.error)
  })
  return result.sort((left, right) => right.createdAt - left.createdAt)
}

async function putHistory(item: CreationHistoryItem) {
  const database = await openDatabase()
  const transaction = database.transaction(STORE_NAME, 'readwrite')
  transaction.objectStore(STORE_NAME).put(item)
  await transactionComplete(transaction)
}

async function removeHistory(id: string) {
  const database = await openDatabase()
  const transaction = database.transaction(STORE_NAME, 'readwrite')
  transaction.objectStore(STORE_NAME).delete(id)
  await transactionComplete(transaction)
}

async function clearAllHistory() {
  const database = await openDatabase()
  const transaction = database.transaction(STORE_NAME, 'readwrite')
  transaction.objectStore(STORE_NAME).clear()
  await transactionComplete(transaction)
}

export function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Canvas PNG creation failed'))
    }, 'image/png')
  })
}

export function useCreationHistory() {
  const [items, setItems] = useState<CreationHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    readAllHistory()
      .then((history) => {
        if (!cancelled) setItems(history)
      })
      .catch(() => {
        if (!cancelled) setError('浏览器历史缓存不可用，请检查隐私模式或存储权限。')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const save = useCallback(async (input: SaveCreationInput) => {
    const item: CreationHistoryItem = {
      ...input,
      id: typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: Date.now(),
    }
    try {
      await putHistory(item)
      setItems((previous) => [item, ...previous])
      setError('')
      return true
    } catch {
      setError('保存失败，浏览器缓存空间可能不足。')
      return false
    }
  }, [])

  const remove = useCallback(async (id: string) => {
    try {
      await removeHistory(id)
      setItems((previous) => previous.filter((item) => item.id !== id))
      return true
    } catch {
      setError('删除历史记录失败。')
      return false
    }
  }, [])

  const clear = useCallback(async () => {
    try {
      await clearAllHistory()
      setItems([])
      return true
    } catch {
      setError('清空历史记录失败。')
      return false
    }
  }, [])

  return { items, loading, error, save, remove, clear }
}

export function useHistorySaveStatus() {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const resetTimerRef = useRef<number | null>(null)

  useEffect(() => () => {
    if (resetTimerRef.current !== null) window.clearTimeout(resetTimerRef.current)
  }, [])

  const run = useCallback(async (save: () => Promise<boolean>) => {
    if (resetTimerRef.current !== null) window.clearTimeout(resetTimerRef.current)
    setStatus('saving')
    const successful = await save()
    setStatus(successful ? 'saved' : 'error')
    resetTimerRef.current = window.setTimeout(() => setStatus('idle'), 1800)
  }, [])

  return { status, run }
}
