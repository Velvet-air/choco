import { fetchStockData, NotFoundError } from '@/services/stock'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ query: string }> }
) {
  const { query } = await params

  try {
    const data = await fetchStockData(decodeURIComponent(query))
    return Response.json(data)
  } catch (err) {
    if (err instanceof NotFoundError) {
      return Response.json({ error: err.message }, { status: 404 })
    }
    return Response.json({ error: '데이터를 불러올 수 없습니다' }, { status: 500 })
  }
}
