'use client'
import { useState } from 'react'
import { useWatchlist } from '@/hooks/use-watchlist'
import { WatchlistEmpty } from './watchlist-empty'
import { AddTickerForm } from './add-ticker-form'
import { Button } from '@/components/ui/button'

export function Dashboard() {
  const { entries, add, remove } = useWatchlist()
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null)

  const handleRemove = () => {
    if (!selectedTicker) return
    remove(selectedTicker)
    setSelectedTicker(null)
  }

  return (
    <div className="flex h-screen flex-col">
      {/* 상단 툴바 */}
      <header className="flex items-center gap-2 border-b px-4 py-2">
        <AddTickerForm onAdd={add} />
        <Button
          onClick={handleRemove}
          disabled={!selectedTicker}
          variant="outline"
          size="icon"
          title="선택 종목 삭제"
        >
          −
        </Button>
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
