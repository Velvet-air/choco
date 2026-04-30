import YahooFinance from 'yahoo-finance2'
import type { StockData } from '@/types/stock'
import { resolveKrTicker } from '@/lib/kr-stocks'
import { translateToKo } from '@/lib/translate'

// yahoo-finance2 v3: 클래스 인스턴스 필요 (default export = class, not instance)
const yf = new YahooFinance()

const MAX_NEWS = 5
const SPARKLINE_DAYS = 10
const QUERY_MAX_LEN = 30
const QUERY_RE = /^[A-Za-z0-9가-힣\s.\-&]+$/

export async function fetchStockData(query: string): Promise<StockData> {
  const trimmed = query.trim()
  if (!trimmed || trimmed.length > QUERY_MAX_LEN || !QUERY_RE.test(trimmed)) {
    throw new NotFoundError('유효하지 않은 종목코드입니다')
  }

  // 한국어 종목명 → 티커코드 자동 변환
  const resolved = resolveKrTicker(trimmed) ?? trimmed

  const searchResult = await yf.search(resolved, { newsCount: MAX_NEWS })

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

  // 검색 결과의 영문 회사명으로 뉴스 재검색 → 종목별 고유 뉴스
  const newsQuery = (equityQuote as Record<string, unknown>).shortname as string | undefined
    ?? ticker.split('.')[0]

  const [quoteData, historical, newsResult] = await Promise.all([
    yf.quote(ticker),
    yf.historical(ticker, {
      period1: startDate.toISOString().split('T')[0],
      period2: endDate.toISOString().split('T')[0],
      interval: '1d',
    }),
    yf.search(newsQuery, { newsCount: MAX_NEWS, quotesCount: 0 }),
  ])

  if (!quoteData.regularMarketPrice) throw new NotFoundError('종목을 찾을 수 없습니다')

  const sparkline = historical
    .slice(-SPARKLINE_DAYS)
    .map((d) => d.close)
    .filter((v): v is number => typeof v === 'number')

  // newsResult가 비면 초기 검색 결과로 fallback
  const rawNews = ((newsResult.news?.length ? newsResult.news : searchResult.news) ?? []).slice(0, MAX_NEWS)
  const titles = rawNews.map((n) => n.title ?? '')
  const translatedTitles = await translateToKo(titles)

  const news = rawNews.map((n, i) => ({
    title: translatedTitles[i] ?? n.title ?? '',
    url: n.link ?? '',
  }))

  // 한국어 이름으로 검색했으면 해당 이름을 우선 표시
  const krName = resolveKrTicker(trimmed) ? trimmed : null

  return {
    ticker,
    name: krName ?? quoteData.shortName ?? quoteData.longName ?? ticker,
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
