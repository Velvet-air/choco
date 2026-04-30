import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockSearch, mockQuote, mockHistorical } = vi.hoisted(() => ({
  mockSearch: vi.fn(),
  mockQuote: vi.fn(),
  mockHistorical: vi.fn(),
}))

vi.mock('yahoo-finance2', () => ({
  default: class {
    search = mockSearch
    quote = mockQuote
    historical = mockHistorical
  },
}))

const { fetchStockData, NotFoundError } = await import('./stock')

const equityQuote = {
  symbol: '005930.KS',
  quoteType: 'EQUITY',
  isYahooFinance: true,
  exchange: 'KSC',
  index: 'quotes',
  score: 100,
}

const quoteData = {
  regularMarketPrice: 75400,
  regularMarketChange: 900,
  regularMarketChangePercent: 1.21,
  regularMarketDayHigh: 76100,
  regularMarketDayLow: 74600,
  shortName: '삼성전자',
}

const historicalData = [
  { close: 74000, date: new Date() },
  { close: 74500, date: new Date() },
  { close: 75000, date: new Date() },
  { close: 75400, date: new Date() },
]

const newsItem = (i: number) => ({
  uuid: String(i),
  title: `뉴스${i}`,
  publisher: 'pub',
  link: `https://news${i}.com`,
  providerPublishTime: new Date(),
  type: 'story',
})

beforeEach(() => {
  mockSearch.mockResolvedValue({ quotes: [equityQuote], news: [newsItem(1)] })
  mockQuote.mockResolvedValue(quoteData)
  mockHistorical.mockResolvedValue(historicalData)
})

describe('fetchStockData — 입력 검증', () => {
  it('빈 쿼리 → NotFoundError', async () => {
    await expect(fetchStockData('')).rejects.toBeInstanceOf(NotFoundError)
  })

  it('20자 초과 쿼리 → NotFoundError', async () => {
    await expect(fetchStockData('A'.repeat(21))).rejects.toBeInstanceOf(NotFoundError)
  })

  it('허용되지 않는 문자 포함 → NotFoundError', async () => {
    await expect(fetchStockData('../etc/passwd')).rejects.toBeInstanceOf(NotFoundError)
  })
})

describe('fetchStockData — EQUITY 필터', () => {
  it('EQUITY 종목이 없을 때 → NotFoundError', async () => {
    mockSearch.mockResolvedValueOnce({ quotes: [], news: [] })
    await expect(fetchStockData('XXXXXX')).rejects.toBeInstanceOf(NotFoundError)
  })

  it('EQUITY 종목 찾으면 해당 ticker를 반환한다', async () => {
    const result = await fetchStockData('005930')
    expect(result.ticker).toBe('005930.KS')
  })
})

describe('fetchStockData — regularMarketPrice 방어', () => {
  it('regularMarketPrice가 falsy이면 → NotFoundError', async () => {
    mockQuote.mockResolvedValueOnce({ ...quoteData, regularMarketPrice: null })
    await expect(fetchStockData('005930')).rejects.toBeInstanceOf(NotFoundError)
  })
})

describe('fetchStockData — 스파크라인 슬라이싱', () => {
  it('historical 25개 → sparkline은 10개 이하로 제한된다', async () => {
    const manyDays = Array.from({ length: 25 }, (_, i) => ({ close: 70000 + i * 100, date: new Date() }))
    mockHistorical.mockResolvedValueOnce(manyDays)
    const result = await fetchStockData('005930')
    expect(result.sparkline.length).toBeLessThanOrEqual(10)
  })

  it('close가 null인 항목은 sparkline에서 제외된다', async () => {
    mockHistorical.mockResolvedValueOnce([
      { close: 74000, date: new Date() },
      { close: null, date: new Date() },
      { close: 75000, date: new Date() },
    ])
    const result = await fetchStockData('005930')
    expect(result.sparkline).not.toContain(null)
    expect(result.sparkline).toHaveLength(2)
  })
})

describe('fetchStockData — 반환값', () => {
  it('StockData 전체 필드가 반환된다', async () => {
    const result = await fetchStockData('005930')
    expect(result).toMatchObject({
      ticker: '005930.KS',
      name: expect.any(String),
      price: expect.any(Number),
      change: expect.any(Number),
      changePct: expect.any(Number),
      high: expect.any(Number),
      low: expect.any(Number),
      sparkline: expect.any(Array),
      news: expect.any(Array),
    })
  })

  it('news 8개 → 5개까지만 반환된다', async () => {
    mockSearch.mockResolvedValueOnce({
      quotes: [equityQuote],
      news: Array.from({ length: 8 }, (_, i) => newsItem(i)),
    })
    const result = await fetchStockData('005930')
    expect(result.news.length).toBeLessThanOrEqual(5)
  })
})
