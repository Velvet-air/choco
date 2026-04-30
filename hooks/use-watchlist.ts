'use client'
import { useState, useEffect } from 'react'
import type { WatchlistEntry } from '@/types/stock'

const STORAGE_KEY = 'stock-dashboard-watchlist'

export function useWatchlist() {
  const [entries, setEntries] = useState<WatchlistEntry[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        const valid = parsed.filter(
          (e): e is WatchlistEntry =>
            typeof e?.ticker === 'string' && typeof e?.name === 'string',
        )
        setEntries(valid)
      }
    } catch {}
  }, [])

  const persist = (next: WatchlistEntry[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {}
  }

  const add = (ticker: string, name: string) => {
    setEntries((prev) => {
      if (prev.some((e) => e.ticker === ticker)) return prev
      const next = [...prev, { ticker, name }]
      persist(next)
      return next
    })
  }

  const remove = (ticker: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.ticker !== ticker)
      persist(next)
      return next
    })
  }

  return { entries, add, remove }
}
