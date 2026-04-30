# stock-dashboard learnings

---
category: tooling
applied: not-yet
---
## yahoo-finance2 v3는 클래스 인스턴스가 필요하다

**상황**: Task 1, `services/stock.ts` 작성 중. 공식 문서 예제(v2 스타일)대로 `yahooFinance.search()` 정적 호출을 시도했더니 TypeScript가 `never` 타입으로 거부.

**판단**: `import YahooFinance from 'yahoo-finance2'`로 가져온 것은 클래스(생성자)이고 인스턴스가 아님. `const yf = new YahooFinance()` 후 `yf.search()`, `yf.quote()`, `yf.historical()`로 호출해야 함. 빌드 직전에 발견해서 수정 비용이 낮았음.

**다시 마주칠 가능성**: 높음 — yahoo-finance2를 다시 쓰거나 다른 팀원이 쓸 때 같은 함정에 빠질 가능성이 큼.

---

---
category: spec-ambiguity
applied: not-yet
---
## Yahoo Finance는 한국어 검색어를 지원하지 않는다

**상황**: Task 1 검증 단계. `GET /api/stock/삼성전자`가 500을 반환. `yf.search('삼성전자')`가 내부에서 에러를 던짐.

**판단**: Yahoo Finance API가 한국어 검색을 지원하지 않음. 티커코드(예: 005930)는 정상 동작. UI 레이어에서 "종목코드 입력 (예: 005930)" 플레이스홀더로 사용자를 안내하는 것으로 해결. spec에 "종목명 입력"이라고 되어 있었지만 기술적 제약으로 티커코드 전용으로 축소. 사용자와 협의 없이 결정했고, 사용자가 이후 승인.

**다시 마주칠 가능성**: 중간 — Yahoo Finance 기반 기능 확장 시 재발 가능. 한국어 검색이 필요하면 별도 종목코드 매핑 테이블이 필요함.

---

---
category: task-ordering
applied: discarded
---
## 고위험 Task(데이터 서비스)를 첫 번째로 배치한 판단은 옳았다

**상황**: Step 2, Task 순서 결정. plan.md가 Task 1을 "고위험 — 먼저 검증"으로 표시.

**판단**: 실제로 yahoo-finance2 API 변경(v3 클래스 방식), 한국어 검색 미지원 두 가지 위험을 Task 1에서 모두 발견. 이후 Task들이 이 타입과 API 응답에 의존하므로, 순서 변경 없이 진행할 수 있었음. Task 4까지 재작업 없음.

**다시 마주칠 가능성**: 낮음 — 이 판단 자체는 plan.md 원칙에 이미 반영돼 있어 메모 수준으로 충분.

---

---
category: tooling
applied: not-yet
---
## vitest.config.ts에서 e2e/ 디렉토리를 명시적으로 제외해야 한다

**상황**: Task 4 완료 후 `bun run test` 실행 시 Playwright 테스트 파일(`e2e/smoke.spec.ts`)을 Vitest가 실행하려다 실패.

**판단**: vitest.config.ts의 `exclude`에 `"e2e/**"`를 추가해서 해결. Playwright 테스트는 별도 `bun run test:e2e`로 실행됨. 새 Next.js 프로젝트에는 항상 이 설정이 필요할 것.

**다시 마주칠 가능성**: 높음 — e2e 테스트가 있는 모든 Next.js 프로젝트에서 동일 문제 발생.

---

---
category: code-review
applied: rule
---
## 외부 API 입력 검증은 서비스 레이어 진입점에서 수행해야 한다

**상황**: Step 4, code-reviewer가 `services/stock.ts`에서 `query`를 그대로 `yf.search()`에 전달하는 것을 Critical로 분류.

**판단**: `QUERY_MAX_LEN = 20`, `QUERY_RE = /^[A-Za-z0-9.\-]+$/` 검증을 `fetchStockData` 첫 줄에 추가. Route Handler에서 `decodeURIComponent`도 제거(Next.js App Router가 이미 디코딩함). 반영: `services/stock.ts`.

**다시 마주칠 가능성**: 높음 — 외부 API를 wrapping하는 서비스에서 반복 발생.

---

---
category: code-review
applied: not-yet
---
## localStorage JSON.parse는 항상 타입 검증 후 사용해야 한다

**상황**: code-reviewer가 `useWatchlist`의 `JSON.parse(stored)` 결과를 `WatchlistEntry[]`라 가정한 것을 Important로 분류.

**판단**: `Array.isArray` + 필드별 `typeof` 검증 추가. 오래된 스키마나 오염된 데이터가 들어올 때 자동으로 걸러짐.

**다시 마주칠 가능성**: 높음 — localStorage 사용 훅은 프로젝트 어디에서나 재발 가능.

---

---
category: code-review
applied: not-yet
---
## 모듈 레벨 인스턴스는 vi.hoisted + 클래스 mock이 필요하다

**상황**: `services/stock.ts`가 모듈 최상단에서 `const yf = new YahooFinance()`를 실행. vi.mock 팩토리에서 `vi.fn()` 반환 시 "is not a constructor" 오류 발생.

**판단**: `vi.hoisted`로 mock 함수를 호이스팅하고, vi.mock 팩토리에서 `class { search = mockSearch; ... }`로 실제 생성자처럼 구성. 10개 테스트 정상 동작.

**다시 마주칠 가능성**: 중간 — 모듈 레벨에서 외부 라이브러리 인스턴스를 만드는 패턴(싱글턴)에서 재발.

---
