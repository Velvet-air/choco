'use client'
import { useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type Props = {
  onAdd: (ticker: string, name: string) => void
}

export function AddTickerForm({ onAdd }: Props) {
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const handleSubmit = async () => {
    const trimmed = query.trim()
    if (!trimmed) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/stock/${encodeURIComponent(trimmed)}`, {
        signal: controller.signal,
      })
      if (!res.ok) {
        const body = await res.json()
        setError(body.error ?? '종목을 찾을 수 없습니다')
        return
      }
      const data = await res.json()
      onAdd(data.ticker, data.name)
      setQuery('')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError('데이터를 불러올 수 없습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Input
          placeholder="종목명 또는 코드 (예: 삼성전자, 005930)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setError(null)
          }}
          onKeyDown={handleKeyDown}
          className="max-w-xs"
          disabled={loading}
        />
        <Button onClick={handleSubmit} disabled={loading || !query.trim()} size="icon" title="종목 추가">
          +
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
