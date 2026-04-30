'use client'
import { useEffect, useState } from 'react'
import type { StockData } from '@/types/stock'

type Props = {
  ticker: string
  name: string
  selected: boolean
  onSelect: () => void
}

function fmt(n: number) {
  return Math.round(n).toLocaleString('ko-KR')
}

function Sparkline({ data }: { data: number[] }) {
  if (!data.length) return null
  const W = 120
  const H = 40
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const points = data
    .map((v, i) => {
      const x = data.length === 1 ? W / 2 : (i / (data.length - 1)) * W
      const y = H - ((v - min) / range) * (H - 4) - 2
      return `${x},${y}`
    })
    .join(' ')

  const rising = data[data.length - 1] >= data[0]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={rising ? 'rgb(239 68 68)' : 'rgb(59 130 246)'}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function StockColumn({ ticker, name, selected, onSelect }: Props) {
  const [data, setData] = useState<StockData | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/stock/${encodeURIComponent(ticker)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then((d) => { if (!cancelled) setData(d) })
      .catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [ticker])

  const isRising = (data?.change ?? 0) > 0
  const isFalling = (data?.change ?? 0) < 0
  const changeColor = isRising
    ? 'text-red-500'
    : isFalling
      ? 'text-blue-500'
      : 'text-muted-foreground'

  return (
    <div
      onClick={onSelect}
      className={`flex min-w-52 max-w-64 cursor-pointer flex-col gap-3 border-r p-4 transition-colors ${
        selected ? 'bg-muted ring-2 ring-inset ring-ring' : 'hover:bg-muted/50'
      }`}
    >
      {/* 종목명 */}
      <div>
        <p className="font-semibold">{name}</p>
        <p className="text-xs text-muted-foreground">{ticker}</p>
      </div>

      {error ? (
        <p className="text-sm text-muted-foreground">데이터를 불러올 수 없습니다</p>
      ) : !data ? (
        <p className="text-sm text-muted-foreground">로딩 중…</p>
      ) : (
        <>
          {/* 현재가 */}
          <p className="text-2xl font-bold">{fmt(data.price)}원</p>

          {/* 등락 */}
          <p className={`text-sm font-medium ${changeColor}`}>
            {isRising ? '▲' : isFalling ? '▼' : '─'}{' '}
            {isRising ? '+' : ''}{fmt(data.change)}원 / {isRising ? '+' : ''}{data.changePct.toFixed(2)}%
          </p>

          {/* 고저가 */}
          <p className="text-xs text-muted-foreground">
            고 {fmt(data.high)} &nbsp; 저 {fmt(data.low)}
          </p>

          {/* 스파크라인 */}
          <div className="h-10">
            <Sparkline data={data.sparkline} />
          </div>

          {/* 뉴스 */}
          <div className="flex flex-col gap-1">
            {data.news.length === 0 ? (
              <p className="text-xs text-muted-foreground">뉴스 없음</p>
            ) : (
              data.news.slice(0, 5).map((n, i) => (
                <a
                  key={i}
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="line-clamp-2 text-xs text-muted-foreground underline-offset-2 hover:underline"
                >
                  {n.title}
                </a>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
