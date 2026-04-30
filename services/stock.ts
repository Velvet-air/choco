import YahooFinance from 'yahoo-finance2'
import type { StockData } from '@/types/stock'

// yahoo-finance2 v3: 클래스 인스턴스 필요 (default export = class, not instance)
const yf = new YahooFinance()

const MAX_NEWS = 5
const SPARKLINE_DAYS = 10
const QUERY_MAX_LEN = 20
const QUERY_RE = /^[A-Za-z0-9.\-]+$/

export async function fetchStockData(query: string): Promise<StockData> {
  if (!query || query.length > QUERY_MAX_LEN || !QUERY_RE.test(query)) {
    throw new NotFoundError('유효하지 않은 종목코드입니다')
  }
  const searchResult = await yf.search(query, { newsCount: MAX_NEWS })

  // EQUITY 종목의 심볼 추출
  const equityQuote = searchResult.quotes?.find(
    (q): q is (typeof q & { symbol: string; quoteType: string }) =>
      'quoteType' in q && q.quoteType === 'EQUITY' && typeof q.symbol === 'string',
  )
  const ticker: string | undefined = equityQuote?.symbol
  if (!ticker) throw new NotFoundError('종목을 찾을 수 없습니다')

  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - SPARKLINE_DAYS * 2)

  const [quoteData, historical] = await Promise.all([
    yf.quote(ticker),
    yf.historical(ticker, {
      period1: startDate.toISOString().split('T')[0],
      period2: endDate.toISOString().split('T')[0],
      interval: '1d',
    }),
  ])

  if (!quoteData.regularMarketPrice) throw new NotFoundError('종목을 찾을 수 없습니다')

  const sparkline = historical
    .slice(-SPARKLINE_DAYS)
    .map((d) => d.close)
    .filter((v): v is number => typeof v === 'number')

  const news = (searchResult.news ?? []).slice(0, MAX_NEWS).map((n) => ({
    title: n.title ?? '',
    url: n.link ?? '',
  }))

  return {
    ticker,
    name: quoteData.shortName ?? quoteData.longName ?? ticker,
    price: Math.round(quoteData.regularMarketPrice),
    change: Math.round(quoteData.regularMarketChange ?? 0),
    changePct: Number((quoteData.regularMarketChangePercent ?? 0).toFixed(2)),
    high: Math.round(quoteData.regularMarketDayHigh ?? quoteData.regularMarketPrice),
    low: Math.round(quoteData.regularMarketDayLow ?? quoteData.regularMarketPrice),
    sparkline,
    news,
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}
