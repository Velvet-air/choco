export function WatchlistEmpty() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
      <p className="text-lg">종목을 추가하세요</p>
      <p className="text-sm">위 입력창에 종목코드(예: 005930)를 입력하고 + 버튼을 누르세요</p>
    </div>
  )
}
