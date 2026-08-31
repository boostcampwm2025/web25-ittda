# 프론트엔드 테스트 코드 작성 가이드라인

> `frontend/` 전용 가이드라인 (Vitest + Playwright). 백엔드는 Jest 기반으로 별도 적용.

## 1. 도구별 역할 분리

| 도구 | 대상 |
|------|------|
| **Vitest** | 순수 함수, 유틸, 훅, 비즈니스 로직 단위 테스트 (훅 의존성·조건부 렌더링 등 로직이 있는 컴포넌트 포함) |
| **Playwright** | 사용자 흐름 기반 E2E 테스트 (페이지 이동, 실제 인터랙션) |

Playwright를 단위 비즈니스 로직 검증에 쓰지 않는다. 렌더링 없이 검증 가능한 로직은 Vitest로 먼저 커버한다.

컴포넌트 테스트는 페이지 전체가 아니라 **로직이 있는 단위**(훅 의존, 조건부 렌더링, props에 따른 분기 등)에 한정한다. 마크업/스타일만 있는 프레젠테이셔널 컴포넌트는 Vitest 대신 Storybook으로 시각 확인한다 (`STORYBOOK.md` 참고).

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
  components/
    DailyDetailRecordItem.tsx
    DailyDetailRecordItem.test.tsx  ← JSX 포함 시 .tsx
e2e/
  record-create.spec.ts      ← Playwright E2E
  group-invite.spec.ts
```

- Vitest: `*.test.ts`(순수 로직) / `*.test.tsx`(JSX·컴포넌트 포함) — 소스 파일과 같은 폴더
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

### 3-5. 컴포넌트 테스트

렌더링 결과 자체가 아니라 **props/상태에 따른 분기 로직**을 검증한다. 텍스트가 여러 엘리먼트로 쪼개질 수 있으므로 `getByText`의 정확한 문자열 매칭보다 `container.textContent`에 대한 부분 매칭(`toContain`)이 안전할 때가 많다.

```typescript
import { render } from '@testing-library/react';
import { ActivityMessage } from './ActivityMessage';

it('POST_CREATE 타입이면 새 기록 작성 문구와 제목을 표시한다', () => {
  const { container } = render(
    <ActivityMessage
      activity={{
        id: '1',
        type: 'POST_CREATE',
        meta: { title: '첫 기록' },
        createdAt: '2024-06-15T00:00:00.000Z',
        actors: [{ nickname: '테스트유저' }],
      }}
    />,
  );

  expect(container.textContent).toContain('테스트유저');
  expect(container.textContent).toContain('"첫 기록"');
  expect(container.textContent).toContain('작성했습니다');
});
```

외부 네비게이션(`next/navigation`), 소켓, 이미지 로더 등에 의존하는 컴포넌트는 `vi.mock`으로 격리하고, 페이지 전체 흐름(라우팅, 여러 컴포넌트 조합)은 이 계층이 아니라 Playwright에서 검증한다.

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

---

## 7. 실전 교훈

### 7-1. fake timer + React state는 `act`를 반드시 분리

`vi.useFakeTimers()`와 `rerender`를 같은 `act` 블록에 넣으면 타이머 실행 후 React state flush 순서가 꼬여 값이 반영되지 않는다.

```typescript
// ❌ 같은 act 안에서 rerender + advanceTimersByTime
act(() => {
  rerender({ value: '변경' });
  vi.advanceTimersByTime(500);
});
expect(result.current).toBe('변경'); // 실패 — 값이 '초기' 그대로

// ✅ act를 분리
act(() => { rerender({ value: '변경' }); });
act(() => { vi.advanceTimersByTime(500); }); // 타이머 실행 후 React state flush
expect(result.current).toBe('변경'); // 통과
```

### 7-2. DOM ref에 의존하는 훅은 `renderHook` 대신 `render` 사용

`useEffect(fn, [])` 내부에서 `ref.current`를 읽는 훅은 `renderHook`으로 테스트하면 ref가 항상 `null`이다. `renderHook`은 실제 DOM 요소를 렌더링하지 않기 때문이다.

```typescript
// ❌ renderHook — useEffect 시점에 containerRef.current가 null
const { result } = renderHook(() => useScrollDirection());
result.current.containerRef.current = container; // 이미 effect가 종료된 후라 이벤트 리스너가 붙지 않음

// ✅ render로 실제 DOM에 ref 연결 — effect 실행 전에 ref가 채워짐
function TestComponent() {
  const { containerRef, isVisible } = useScrollDirection<HTMLDivElement>();
  return <div ref={containerRef} data-visible={String(isVisible)} />;
}
render(<TestComponent />);
```

### 7-3. JSX를 포함하는 테스트 파일은 `.tsx` 확장자

`.ts` 파일에 JSX를 작성하면 esbuild transform 오류가 발생한다.

```
// ❌ useScrollDirection.test.ts  → "Expected '>' but found 'data'" 오류
// ✅ useScrollDirection.test.tsx → 정상 변환
```

JSX가 없는 순수 로직 테스트는 `.test.ts`, 컴포넌트나 JSX를 포함하면 `.test.tsx`로 작성한다.
