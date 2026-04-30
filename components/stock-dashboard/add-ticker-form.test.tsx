import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AddTickerForm } from './add-ticker-form'

const mockOnAdd = vi.fn()

beforeEach(() => {
  mockOnAdd.mockClear()
  vi.stubGlobal('fetch', vi.fn())
})

function mockFetchOk(data: object) {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: true,
    json: async () => data,
  } as Response)
}

function mockFetchError(status: number, error: string) {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: false,
    json: async () => ({ error }),
    status,
  } as Response)
}

describe('AddTickerForm', () => {
  it('유효한 티커 입력 후 + 클릭 → onAdd가 ticker와 name으로 호출된다', async () => {
    mockFetchOk({ ticker: '005930', name: '삼성전자', price: 75400 })
    render(<AddTickerForm onAdd={mockOnAdd} />)

    fireEvent.change(screen.getByPlaceholderText(/종목코드/), { target: { value: '005930' } })
    fireEvent.click(screen.getByTitle('종목 추가'))

    await waitFor(() => {
      expect(mockOnAdd).toHaveBeenCalledWith('005930', '삼성전자')
    })
  })

  it('유효한 티커 추가 후 입력창이 비워진다', async () => {
    mockFetchOk({ ticker: '005930', name: '삼성전자', price: 75400 })
    render(<AddTickerForm onAdd={mockOnAdd} />)

    const input = screen.getByPlaceholderText(/종목코드/)
    fireEvent.change(input, { target: { value: '005930' } })
    fireEvent.click(screen.getByTitle('종목 추가'))

    await waitFor(() => {
      expect((input as HTMLInputElement).value).toBe('')
    })
  })

  it('존재하지 않는 티커 → "종목을 찾을 수 없습니다" 에러가 표시된다', async () => {
    mockFetchError(404, '종목을 찾을 수 없습니다')
    render(<AddTickerForm onAdd={mockOnAdd} />)

    fireEvent.change(screen.getByPlaceholderText(/종목코드/), { target: { value: 'XXXXXX' } })
    fireEvent.click(screen.getByTitle('종목 추가'))

    await waitFor(() => {
      expect(screen.getByText('종목을 찾을 수 없습니다')).toBeInTheDocument()
    })
    expect(mockOnAdd).not.toHaveBeenCalled()
  })

  it('에러 상태에서 새 입력 시작 시 에러가 초기화된다', async () => {
    mockFetchError(404, '종목을 찾을 수 없습니다')
    render(<AddTickerForm onAdd={mockOnAdd} />)

    fireEvent.change(screen.getByPlaceholderText(/종목코드/), { target: { value: 'XXXXXX' } })
    fireEvent.click(screen.getByTitle('종목 추가'))

    await waitFor(() => {
      expect(screen.getByText('종목을 찾을 수 없습니다')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByPlaceholderText(/종목코드/), { target: { value: '0' } })
    expect(screen.queryByText('종목을 찾을 수 없습니다')).not.toBeInTheDocument()
  })

  it('Enter 키로도 추가할 수 있다', async () => {
    mockFetchOk({ ticker: '035420', name: '카카오', price: 42000 })
    render(<AddTickerForm onAdd={mockOnAdd} />)

    const input = screen.getByPlaceholderText(/종목코드/)
    fireEvent.change(input, { target: { value: '035420' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => {
      expect(mockOnAdd).toHaveBeenCalledWith('035420', '카카오')
    })
  })
})
