export type StockData = {
  ticker: string
  name: string
  price: number
  change: number
  changePct: number
  high: number
  low: number
  sparkline: number[]
  news: { title: string; url: string }[]
}

export type WatchlistEntry = {
  ticker: string
  name: string
}
