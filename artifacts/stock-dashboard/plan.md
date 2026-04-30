# stock-dashboard 구현 계획

## 아키텍처 결정

| 결정 | 선택 | 이유 |
|---|---|---|
| 종목 데이터 소스 | yahoo-finance2 (npm) | 인증 불필요, 한국 주식(.KS/.KQ) 지원 |
| 데이터 페칭 레이어 | Next.js Route Handler `/api/stock/[query]` | yahoo-finance2는 Node.js 전용 — 클라이언트에서 직접 호출 불가 |
| 클라이언트 데이터 요청 | fetch + useState/useEffect | SWR 없이 단순하게 |
| 워치리스트 저장 | localStorage (useWatchlist hook) | 서버 불필요, 브라우저 새로고침 후 복원 |
| 스파크라인 렌더링 | 순수 SVG polyline | 방향만 표시하는 요건에 차트 라이브러리 불필요 |
| 스파크라인 기간 | 최근 7 거래일 종가 | 오늘 분봉은 장외 시간에 의미 없음; 히스토리컬 데이터가 안정적 |
| 뉴스 없는 종목 처리 | "뉴스 없음" 텍스트 표시 | 빈 영역보다 명시적 피드백이 나음 |
| 페이지 컴포넌트 경계 | app/page.tsx(Server) → Dashboard(Client) | 대화형 UI 전체는 Client; 서버 셸은 얇게 |

## 인프라 리소스

None

## 데이터 모델

### StockData
- ticker: string (예: "005930.KS")
- name: string
- price: number
- change: number (등락금액)
- changePct: number (등락퍼센트)
- high: number (금일 최고가)
- low: number (금일 최저가)
- sparkline: number[] (최근 7거래일 종가)
- news: { title: string; url: string }[]

### WatchlistEntry
- ticker: string
- name: string

## 필요 스킬

| 스킬 | 적용 Task | 용도 |
|---|---|---|
| next-best-practices | Task 1, 2 | Route Handler 패턴, RSC/Client 경계 |
| shadcn-guard | Task 3, 4 | shadcn 컴포넌트 사용 규칙 준수 |

## 영향 받는 파일

| 파일 경로 | 변경 유형 | 관련 Task |
|---|---|---|
| `types/stock.ts` | New | Task 1 |
| `services/stock.ts` | New | Task 1 |
| `app/api/stock/[query]/route.ts` | New | Task 1 |
| `hooks/use-watchlist.ts` | New | Task 2 |
| `hooks/use-watchlist.test.ts` | New | Task 2 |
| `components/stock-dashboard/dashboard.tsx` | New | Task 2 |
| `components/stock-dashboard/watchlist-empty.tsx` | New | Task 2 |
| `app/page.tsx` | Modify | Task 2 |
| `components/stock-dashboard/add-ticker-form.tsx` | New | Task 3 |
| `components/stock-dashboard/add-ticker-form.test.tsx` | New | Task 3 |
| `components/stock-dashboard/stock-column.tsx` | New | Task 4 |
| `components/stock-dashboard/stock-column.test.tsx` | New | Task 4 |

## Tasks

### Task 1: 종목 데이터 서비스 + Route Handler (고위험 — 먼저 검증)

- **담당 시나리오**: Scenario 3 (partial — 데이터 구조 확인), Scenario 5 (invalid ticker 404), Scenario 6 (error shape)
- **크기**: M (3 파일 + bun add)
- **의존성**: None
- **참조**:
  - next-best-practices — route-handlers (Dynamic Route, params async, Response.json)
- **구현 대상**:
  - `bun add yahoo-finance2`
  - `types/stock.ts` — StockData, WatchlistEntry 타입
  - `services/stock.ts` — `fetchStockData(query: string): Promise<StockData>` (search → quote + historical + news)
  - `app/api/stock/[query]/route.ts` — 얇은 Route Handler 래퍼
- **수용 기준**:
  - [x] `GET /api/stock/005930` → 200, 응답에 ticker, name, price(number), change, changePct, high, low 포함
  - [x] `GET /api/stock/005930` → sparkline 배열 1개 이상의 숫자 포함
  - [x] `GET /api/stock/005930` → news 배열 각 항목에 title(string), url(string) 포함
  - [x] `GET /api/stock/XXXXXXINVALID` → 404, `{ error: "종목을 찾을 수 없습니다" }`
- **비고**: Yahoo Finance API가 한국어 이름 검색 미지원 → UI에서 티커코드(숫자) 입력 안내 필요
- **검증**: Browser MCP — `http://localhost:3000/api/stock/005930` 응답 확인, 증거 `artifacts/stock-dashboard/evidence/task-1-api.json` 저장 ✅

---

### Checkpoint: Task 1 이후
- [x] `bun run build` 성공 (yahoo-finance2 번들링 오류 없음)
- [x] `GET /api/stock/005930` 실제 응답에 price, sparkline, news 포함 (Browser MCP)

---

### Task 2: 워치리스트 훅 + 빈 상태 화면

- **담당 시나리오**: Scenario 1 (full), Scenario 2 (partial — localStorage 지속성), Scenario 4 (partial — localStorage 삭제)
- **크기**: M (5 파일)
- **의존성**: None (Task 1과 병렬 가능)
- **참조**:
  - next-best-practices — rsc-boundaries (`'use client'` + localStorage)
- **구현 대상**:
  - `hooks/use-watchlist.ts` — add / remove / entries, localStorage 동기화
  - `hooks/use-watchlist.test.ts`
  - `components/stock-dashboard/watchlist-empty.tsx` — "종목을 추가하세요" 화면
  - `components/stock-dashboard/dashboard.tsx` — `'use client'` 대시보드 셸 (+ / − 툴바 포함)
  - `app/page.tsx` — Server Component → `<Dashboard />` 렌더
- **수용 기준**:
  - [x] localStorage가 비어 있을 때 → "종목을 추가하세요" 문구가 화면에 보인다
  - [x] 검색 입력창이 비어 있고 포커스 가능한 상태로 표시된다
  - [x] add("005930", "삼성전자") 호출 후 entries에 해당 항목이 포함된다
  - [x] localStorage에 저장된 항목이 훅 재초기화 시 복원된다
  - [x] remove("005930") 호출 후 재초기화 시 해당 항목이 entries에 없다
- **검증**: `bun run test -- use-watchlist` ✅ 5/5 통과

---

### Task 3: 종목 추가 폼 (검색 + 에러 처리)

- **담당 시나리오**: Scenario 2 (full), Scenario 5 (full)
- **크기**: M (3 파일)
- **의존성**: Task 1 (Route Handler), Task 2 (useWatchlist)
- **참조**:
  - shadcn-guard — Input, Button 컴포넌트 (variant prop 활용)
- **구현 대상**:
  - `components/stock-dashboard/add-ticker-form.tsx`
  - `components/stock-dashboard/add-ticker-form.test.tsx`
  - `components/stock-dashboard/dashboard.tsx` (Modify — 폼 통합)
- **수용 기준**:
  - [x] 유효한 종목코드("005930") 입력 후 추가 → 해당 종목이 워치리스트에 나타난다
  - [x] 추가된 종목은 페이지 새로고침 후에도 워치리스트에 유지된다
  - [x] 이미 추가된 종목을 다시 추가하면 중복 컬럼 없이 기존 컬럼이 유지된다
  - [x] 존재하지 않는 티커 입력 후 추가 → "종목을 찾을 수 없습니다" 메시지가 입력창 아래에 표시된다
  - [x] 에러 메시지 표시 후 기존 워치리스트 종목 컬럼은 그대로 유지된다
- **검증**: `bun run test -- add-ticker-form` ✅ 5/5 통과

---

### Checkpoint: Tasks 1-3 이후
- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] "삼성전자" 추가 → 워치리스트에 나타남, 새로고침 후에도 유지 (Browser MCP — `http://localhost:3000`)

---

### Task 4: 종목 컬럼 컴포넌트 (가격·스파크라인·뉴스·선택·제거)

- **담당 시나리오**: Scenario 3 (full), Scenario 4 (full), Scenario 6 (full)
- **크기**: M (3 파일)
- **의존성**: Task 1 (StockData 타입), Task 2 (useWatchlist.remove)
- **참조**:
  - shadcn-guard — 색상은 className 덮어쓰기 금지, CSS variable 사용
  - `artifacts/stock-dashboard/wireframe.html` — 화면 ②③ 컬럼 레이아웃, 선택 상태, 스파크라인 SVG
- **구현 대상**:
  - `components/stock-dashboard/stock-column.tsx` — 컬럼 전체 (정상·에러·선택 상태 포함)
  - `components/stock-dashboard/stock-column.test.tsx`
  - `components/stock-dashboard/dashboard.tsx` (Modify — 컬럼 목록·선택 상태·− 버튼 활성화)
- **수용 기준**:
  - [x] price=75400 → "75,400원" 텍스트가 화면에 보인다
  - [x] price=75400.7 → "75,401원" (소수점 반올림)으로 표시된다
  - [x] change > 0 → "▲ +900원 / +1.21%" 형식, 빨간색 텍스트로 표시된다
  - [x] change < 0 → "▼ -500원 / -1.20%" 형식, 파란색 텍스트로 표시된다
  - [x] high=76100, low=74600 → "고 76,100", "저 74,600" 텍스트가 표시된다
  - [x] sparkline 배열이 있을 때 SVG polyline 요소가 렌더된다
  - [x] news 2개 → 2개 링크가 target="_blank"로 렌더된다
  - [x] news 6개 이상 → 5개까지만 렌더된다
  - [x] news가 빈 배열 → "뉴스 없음" 텍스트가 표시된다
  - [x] 컬럼 클릭 → onSelect 호출된다
  - [x] 데이터 조회 실패 시 → "데이터를 불러올 수 없습니다" 메시지가 해당 컬럼에 표시된다
- **검증**: `bun run test -- stock-column` ✅ 11/11 통과

---

### Checkpoint: Tasks 1-4 이후 (전체)
- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] 삼성전자·카카오 추가 → 가로 나열, 각각 가격·등락률(색상)·고저가·스파크라인·뉴스 표시 (Browser MCP)
- [ ] X 버튼 → 컬럼 사라짐, 새로고침 후 미복원 (Browser MCP)
- [ ] 증거 `artifacts/stock-dashboard/evidence/task-4-final.png` 저장
- [ ] E2E: `bun run test:e2e`

---

## 미결정 항목

없음 — 모든 항목이 plan 단계에서 결정됨
