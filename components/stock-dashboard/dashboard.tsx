'use client'
import { useState } from 'react'
import { useWatchlist } from '@/hooks/use-watchlist'
import { WatchlistEmpty } from './watchlist-empty'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function Dashboard() {
  const { entries, add, remove } = useWatchlist()
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null)

  const handleAdd = async () => {
    const trimmed = query.trim()
    if (!trimmed) return
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/stock/${encodeURIComponent(trimmed)}`)
      if (!res.ok) {
        const body = await res.json()
        setError(body.error ?? '종목을 찾을 수 없습니다')
        return
      }
      const data = await res.json()
      add(data.ticker, data.name)
      setQuery('')
    } catch {
      setError('데이터를 불러올 수 없습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = () => {
    if (!selectedTicker) return
    remove(selectedTicker)
    setSelectedTicker(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdd()
  }

  return (
    <div className="flex h-screen flex-col">
      {/* 상단 툴바 */}
      <header className="flex items-center gap-2 border-b px-4 py-2">
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <Input
              placeholder="종목코드 입력 (예: 005930)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="max-w-xs"
              disabled={loading}
            />
            <Button onClick={handleAdd} disabled={loading || !query.trim()} size="icon" title="종목 추가">
              +
            </Button>
            <Button
              onClick={handleRemove}
              disabled={!selectedTicker}
              variant="outline"
              size="icon"
              title="선택 종목 삭제"
            >
              −
            </Button>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </header>

      {/* 종목 컬럼 영역 */}
      <main className="flex flex-1 overflow-x-auto">
        {entries.length === 0 ? (
          <WatchlistEmpty />
        ) : (
          <div className="flex gap-0">
            {entries.map((entry) => (
              <div
                key={entry.ticker}
                onClick={() =>
                  setSelectedTicker((prev) => (prev === entry.ticker ? null : entry.ticker))
                }
                className={`flex min-w-52 cursor-pointer flex-col border-r p-4 transition-colors ${
                  selectedTicker === entry.ticker
                    ? 'bg-muted ring-2 ring-inset ring-ring'
                    : 'hover:bg-muted/50'
                }`}
              >
                <p className="font-semibold">{entry.name}</p>
                <p className="text-sm text-muted-foreground">{entry.ticker}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
