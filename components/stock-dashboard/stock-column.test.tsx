import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StockColumn } from './stock-column'

const mockOnSelect = vi.fn()

const baseData = {
  ticker: '005930',
  name: '삼성전자',
  price: 75400,
  change: 900,
  changePct: 1.21,
  high: 76100,
  low: 74600,
  sparkline: [74000, 74500, 75000, 75400],
  news: [
    { title: '뉴스1', url: 'https://a.com' },
    { title: '뉴스2', url: 'https://b.com' },
  ],
}

beforeEach(() => {
  mockOnSelect.mockClear()
  vi.stubGlobal('fetch', vi.fn())
})

function mockFetchOk(data: object) {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: true,
    json: async () => data,
  } as Response)
}

function mockFetchFail() {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: false,
    json: async () => ({ error: '데이터를 불러올 수 없습니다' }),
    status: 500,
  } as Response)
}

describe('StockColumn — 가격 표시', () => {
  it('price=75400 → "75,400원" 텍스트가 표시된다', async () => {
    mockFetchOk(baseData)
    render(<StockColumn ticker="005930" name="삼성전자" selected={false} onSelect={mockOnSelect} />)
    await waitFor(() => expect(screen.getByText('75,400원')).toBeInTheDocument())
  })

  it('price=75400.7 → "75,401원" (소수점 반올림)으로 표시된다', async () => {
    mockFetchOk({ ...baseData, price: 75400.7 })
    render(<StockColumn ticker="005930" name="삼성전자" selected={false} onSelect={mockOnSelect} />)
    await waitFor(() => expect(screen.getByText('75,401원')).toBeInTheDocument())
  })
})

describe('StockColumn — 등락 표시', () => {
  it('change > 0 → "▲ +900원 / +1.21%" 형식으로 표시된다', async () => {
    mockFetchOk(baseData)
    render(<StockColumn ticker="005930" name="삼성전자" selected={false} onSelect={mockOnSelect} />)
    await waitFor(() => expect(screen.getByText(/▲.*\+900원.*\+1\.21%/)).toBeInTheDocument())
  })

  it('change < 0 → "▼ -500원 / -1.20%" 형식으로 표시된다', async () => {
    mockFetchOk({ ...baseData, change: -500, changePct: -1.2 })
    render(<StockColumn ticker="005930" name="삼성전자" selected={false} onSelect={mockOnSelect} />)
    await waitFor(() => expect(screen.getByText(/▼.*-500원.*-1\.20%/)).toBeInTheDocument())
  })
})

describe('StockColumn — 고저가', () => {
  it('high=76100, low=74600 → "고 76,100", "저 74,600" 텍스트가 표시된다', async () => {
    mockFetchOk(baseData)
    render(<StockColumn ticker="005930" name="삼성전자" selected={false} onSelect={mockOnSelect} />)
    await waitFor(() => {
      expect(screen.getByText(/고.*76,100/)).toBeInTheDocument()
      expect(screen.getByText(/저.*74,600/)).toBeInTheDocument()
    })
  })
})

describe('StockColumn — 스파크라인', () => {
  it('sparkline 배열이 있을 때 SVG polyline 요소가 렌더된다', async () => {
    mockFetchOk(baseData)
    const { container } = render(
      <StockColumn ticker="005930" name="삼성전자" selected={false} onSelect={mockOnSelect} />,
    )
    await waitFor(() => {
      expect(container.querySelector('polyline')).toBeInTheDocument()
    })
  })
})

describe('StockColumn — 뉴스', () => {
  it('news 2개 → 2개 링크가 target="_blank"로 렌더된다', async () => {
    mockFetchOk(baseData)
    render(<StockColumn ticker="005930" name="삼성전자" selected={false} onSelect={mockOnSelect} />)
    await waitFor(() => {
      const links = screen.getAllByRole('link')
      expect(links).toHaveLength(2)
      links.forEach((l) => expect(l).toHaveAttribute('target', '_blank'))
    })
  })

  it('news 6개 이상 → 5개까지만 렌더된다', async () => {
    const manyNews = Array.from({ length: 6 }, (_, i) => ({
      title: `뉴스${i + 1}`,
      url: `https://news${i + 1}.com`,
    }))
    mockFetchOk({ ...baseData, news: manyNews })
    render(<StockColumn ticker="005930" name="삼성전자" selected={false} onSelect={mockOnSelect} />)
    await waitFor(() => {
      expect(screen.getAllByRole('link')).toHaveLength(5)
    })
  })

  it('news가 빈 배열 → "뉴스 없음" 텍스트가 표시된다', async () => {
    mockFetchOk({ ...baseData, news: [] })
    render(<StockColumn ticker="005930" name="삼성전자" selected={false} onSelect={mockOnSelect} />)
    await waitFor(() => expect(screen.getByText('뉴스 없음')).toBeInTheDocument())
  })
})

describe('StockColumn — 에러', () => {
  it('데이터 조회 실패 → "데이터를 불러올 수 없습니다" 표시', async () => {
    mockFetchFail()
    render(<StockColumn ticker="005930" name="삼성전자" selected={false} onSelect={mockOnSelect} />)
    await waitFor(() =>
      expect(screen.getByText('데이터를 불러올 수 없습니다')).toBeInTheDocument(),
    )
  })
})

describe('StockColumn — 선택', () => {
  it('컬럼 클릭 → onSelect가 호출된다', async () => {
    mockFetchOk(baseData)
    render(<StockColumn ticker="005930" name="삼성전자" selected={false} onSelect={mockOnSelect} />)
    await waitFor(() => screen.getByText('75,400원'))
    fireEvent.click(screen.getByText('삼성전자'))
    expect(mockOnSelect).toHaveBeenCalledTimes(1)
  })
})
