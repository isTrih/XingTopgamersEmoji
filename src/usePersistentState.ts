import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

function mergeStoredValue<T>(initialValue: T, storedValue: unknown): T {
  if (
    initialValue !== null
    && storedValue !== null
    && typeof initialValue === 'object'
    && typeof storedValue === 'object'
    && !Array.isArray(initialValue)
    && !Array.isArray(storedValue)
  ) {
    return { ...initialValue, ...storedValue } as T
  }
  return storedValue as T
}

export function usePersistentState<T>(
  key: string,
  initialValue: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key)
      return stored === null ? initialValue : mergeStoredValue(initialValue, JSON.parse(stored))
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // The editor remains usable when storage is unavailable or full.
    }
  }, [key, value])

  return [value, setValue]
}
