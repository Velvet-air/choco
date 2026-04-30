'use client'
import { useState } from 'react'
import { useWatchlist } from '@/hooks/use-watchlist'
import { WatchlistEmpty } from './watchlist-empty'
import { AddTickerForm } from './add-ticker-form'
import { StockColumn } from './stock-column'
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
      <main className="flex-1 overflow-x-auto">
        {entries.length === 0 ? (
          <WatchlistEmpty />
        ) : (
          <div className="flex h-full min-w-max">
            {entries.map((entry) => (
              <StockColumn
                key={entry.ticker}
                ticker={entry.ticker}
                name={entry.name}
                selected={selectedTicker === entry.ticker}
                onSelect={() =>
                  setSelectedTicker((prev) => (prev === entry.ticker ? null : entry.ticker))
                }
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
