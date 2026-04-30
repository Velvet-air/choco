import { renderHook, act } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useWatchlist } from './use-watchlist'

const STORAGE_KEY = 'stock-dashboard-watchlist'

beforeEach(() => {
  localStorage.clear()
})

describe('useWatchlist', () => {
  it('localStorage가 비어 있으면 entries가 빈 배열이다', () => {
    const { result } = renderHook(() => useWatchlist())
    expect(result.current.entries).toEqual([])
  })

  it('add() 호출 후 entries에 항목이 포함된다', () => {
    const { result } = renderHook(() => useWatchlist())
    act(() => {
      result.current.add('005930', '삼성전자')
    })
    expect(result.current.entries).toEqual([{ ticker: '005930', name: '삼성전자' }])
  })

  it('add()는 localStorage에 저장하여 재초기화 시 복원된다', () => {
    const { result: r1 } = renderHook(() => useWatchlist())
    act(() => {
      r1.current.add('005930', '삼성전자')
    })

    const { result: r2 } = renderHook(() => useWatchlist())
    expect(r2.current.entries).toEqual([{ ticker: '005930', name: '삼성전자' }])
  })

  it('이미 있는 ticker를 add()해도 중복 추가되지 않는다', () => {
    const { result } = renderHook(() => useWatchlist())
    act(() => {
      result.current.add('005930', '삼성전자')
      result.current.add('005930', '삼성전자')
    })
    expect(result.current.entries).toHaveLength(1)
  })

  it('remove() 호출 후 재초기화 시 해당 항목이 없다', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ ticker: '005930', name: '삼성전자' }]))

    const { result } = renderHook(() => useWatchlist())
    act(() => {
      result.current.remove('005930')
    })

    const { result: r2 } = renderHook(() => useWatchlist())
    expect(r2.current.entries).toEqual([])
  })
})
