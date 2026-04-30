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

function Sparkline({ data, rising }: { data: number[]; rising: boolean }) {
  if (!data.length) return null
  const W = 200
  const H = 48
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const points = data
    .map((v, i) => {
      const x = data.length === 1 ? W / 2 : (i / (data.length - 1)) * W
      const y = H - ((v - min) / range) * (H - 6) - 3
      return `${x},${y}`
    })
    .join(' ')

  const color = rising ? '#00c853' : '#ff4444'
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-12 w-full" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.9"
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
  const changeColor = isRising ? '#00c853' : isFalling ? '#ff4444' : '#888'
  const changeSign = isRising ? '+' : ''

  return (
    <div
      onClick={onSelect}
      className="w-full cursor-pointer border-b border-gray-100 transition-colors"
      style={{ backgroundColor: selected ? '#f0f4ff' : '#ffffff' }}
    >
      <div className="flex items-center gap-4 px-4 py-3">

        {/* 왼쪽: 종목 정보 */}
        <div className="flex w-40 shrink-0 flex-col gap-0.5">
          <span className="font-mono text-[13px] font-bold text-blue-500">
            {name}
          </span>
          {error ? (
            <span className="text-[12px] text-gray-400">불러오기 실패</span>
          ) : !data ? (
            <span className="text-[12px] text-gray-300">로딩 중…</span>
          ) : (
            <>
              <span className="font-mono text-[20px] font-bold text-gray-900">
                {fmt(data.price)}
              </span>
              <span className="font-mono text-[12px]" style={{ color: changeColor }}>
                {changeSign}{fmt(data.change)} {changeSign}{data.changePct.toFixed(2)}%
              </span>
              <span className="font-mono text-[11px] text-gray-400">
                고 {fmt(data.high)} · 저 {fmt(data.low)}
              </span>
            </>
          )}
        </div>

        {/* 가운데: 스파크라인 */}
        <div className="flex w-40 shrink-0 items-center">
          {data && <Sparkline data={data.sparkline} rising={isRising} />}
        </div>

        {/* 오른쪽: 뉴스 */}
        <div className="flex w-64 shrink-0 flex-col gap-1 px-3 py-2">
          {data?.news.length === 0 && (
            <span className="text-[11px] text-gray-400">뉴스 없음</span>
          )}
          {data?.news.slice(0, 4).map((n) => (
            <a
              key={n.url}
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="line-clamp-1 text-[11px] text-gray-600 transition-colors hover:text-gray-900"
            >
              {n.title}
            </a>
          ))}
        </div>

      </div>
    </div>
  )
}
