# 프론트엔드 테스트 코드 작성 가이드라인

> `frontend/` 전용 가이드라인 (Vitest + Playwright). 백엔드는 Jest 기반으로 별도 적용.

## 1. 도구별 역할 분리

| 도구 | 대상 |
|------|------|
| **Vitest** | 순수 함수, 유틸, 훅, 비즈니스 로직 단위 테스트 |
| **Playwright** | 사용자 흐름 기반 E2E 테스트 (페이지 이동, 실제 인터랙션) |

Playwright를 단위 비즈니스 로직 검증에 쓰지 않는다. 렌더링 없이 검증 가능한 로직은 Vitest로 먼저 커버한다.

---

## 2. 파일 구조 및 네이밍

```
src/
  lib/
    utils/
      filterLabels.ts
      filterLabels.test.ts   ← 소스 파일 옆에 위치
    date.ts
    date.test.ts
  hooks/
    useDebounce.ts
    useDebounce.test.ts
e2e/
  record-create.spec.ts      ← Playwright E2E
  group-invite.spec.ts
```

- Vitest: `*.test.ts` — 소스 파일과 같은 폴더
- Playwright: `*.spec.ts` — `e2e/` 폴더에 분리

---

## 3. Vitest 작성 규칙

### 3-1. describe/it 구조

```typescript
// src/lib/utils/filterLabels.test.ts
import { makeTagLabel } from './filterLabels';

describe('makeTagLabel', () => {
  it('태그가 없으면 기본값 "태그" 반환', () => {
    expect(makeTagLabel([])).toBe('태그');
  });

  it('태그가 1개이면 태그명 그대로 반환', () => {
    expect(makeTagLabel(['여행'])).toBe('여행');
  });

  it('태그가 2개 이상이면 "첫번째 외 N" 형식 반환', () => {
    expect(makeTagLabel(['여행', '맛집', '카페'])).toBe('여행 외 2');
  });
});
```

- `describe`: 함수/모듈 단위
- `it`: 단일 시나리오. **한국어로** 무엇을 기대하는지 명시
- 하나의 `it` 블록에 하나의 `expect` 원칙 (불가피한 경우 예외)

### 3-2. 경계값과 예외 케이스를 반드시 포함

```typescript
describe('makeDateLabel', () => {
  it('start, end 둘 다 없으면 "날짜" 반환', () => { ... });
  it('start만 있으면 start 반환', () => { ... });
  it('end만 있으면 end 반환', () => { ... });
  it('start와 end 모두 있으면 "start ~ end" 반환', () => { ... });
  it('null을 받으면 기본값 반환', () => { ... }); // ← 경계값
});
```

### 3-3. 외부 의존성은 Mock으로 격리

```typescript
// API 호출, 날짜(Date), 랜덤값은 반드시 mock
vi.useFakeTimers();
vi.setSystemTime(new Date('2025-01-15'));

// fetch/API mock
vi.mock('@/lib/api/record', () => ({
  fetchRecord: vi.fn().mockResolvedValue({ id: '1', title: '테스트' }),
}));
```

- `Date`, `Math.random`, 외부 API는 테스트마다 결과가 달라지므로 mock 필수
- `afterEach(() => vi.restoreAllMocks())` 로 상태 초기화

### 3-4. 훅 테스트

```typescript
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  it('delay 이전에는 초기값 유지', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useDebounce('초기', 500));
    expect(result.current).toBe('초기');
    vi.clearAllTimers();
  });
});
```

---

## 4. Playwright 작성 규칙

### 4-1. 사용자 관점으로 작성

```typescript
// e2e/record-create.spec.ts
test('기록 생성 후 목록에 나타난다', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '기록 추가' }).click();
  await page.getByLabel('제목').fill('제주도 여행');
  await page.getByRole('button', { name: '저장' }).click();

  await expect(page.getByText('제주도 여행')).toBeVisible();
});
```

- `getByRole`, `getByLabel`, `getByText` 우선 — `data-testid`는 최후 수단
- 구현 세부사항(클래스명, DOM 구조)에 의존하지 않음

### 4-2. 페이지 객체 패턴 (Page Object Model)

반복되는 인터랙션은 POM으로 추출:

```typescript
// e2e/pages/RecordPage.ts
export class RecordPage {
  constructor(private page: Page) {}

  async createRecord(title: string) {
    await this.page.getByRole('button', { name: '기록 추가' }).click();
    await this.page.getByLabel('제목').fill(title);
    await this.page.getByRole('button', { name: '저장' }).click();
  }
}
```

### 4-3. 인증 상태 재사용

```typescript
// playwright.config.ts에서 storageState로 로그인 상태 저장
setup('로그인', async ({ page }) => {
  await page.goto('/login');
  // ... 로그인 처리
  await page.context().storageState({ path: 'e2e/.auth/user.json' });
});
```

매 테스트마다 로그인하지 않고 `storageState`를 재사용한다.

### 4-4. 불안정한 패턴 금지

```typescript
// ❌ 금지
await page.waitForTimeout(2000);

// ✅ 대신
await expect(page.getByText('저장됨')).toBeVisible();
await page.waitForResponse('**/api/records');
```

---

## 5. 공통 원칙

| 원칙 | 내용 |
|------|------|
| **AAA 패턴** | Arrange(준비) → Act(실행) → Assert(검증) 순서 유지 |
| **테스트 독립성** | 각 테스트는 다른 테스트의 실행 순서나 상태에 의존하지 않음 |
| **비즈니스 언어 사용** | `it('userId가 null이면...')` 보다 `it('로그인하지 않은 사용자는...')` |
| **커버리지보다 신뢰성** | 100% 커버리지보다 핵심 경로의 신뢰할 수 있는 테스트가 우선 |
| **테스트도 코드다** | 중복 제거, 헬퍼 추출 — 단, 과도한 추상화는 가독성을 해침 |

---

## 6. 우선순위 (무엇부터 테스트할 것인가)

1. **순수 유틸 함수** — `filterLabels`, `date`, `record` 유틸 (가장 쉽고 ROI가 높음)
2. **복잡한 비즈니스 훅** — `useGroupActions`, `useRecordCollaboration`
3. **핵심 사용자 흐름** — 기록 생성/조회, 그룹 초대 (Playwright)
4. **엣지 케이스** — 권한 없는 접근, 네트워크 오류 처리
