# 프론트엔드 Storybook 작성 가이드라인

> `frontend/` 전용 가이드라인. 프레임워크: `@storybook/nextjs-vite` + MSW + TanStack Query.

---

## 1. Storybook의 역할

Storybook은 컴포넌트를 **실제 페이지 맥락 없이** 독립적으로 확인하고 문서화하는 도구다.

| 용도 | 설명 |
|------|------|
| **시각적 문서화** | 컴포넌트가 어디서 쓰이는지, 어떤 상태가 존재하는지 한눈에 파악 |
| **인터랙션 확인** | Controls 패널로 props를 바꿔가며 렌더링 결과를 즉시 확인 |
| **회귀 방지** | Chromatic 등 비주얼 회귀 도구와 연동해 의도치 않은 UI 변경 감지 |

---

## 2. 파일 구조 및 네이밍

```
src/
  app/
    (main)/
      _components/
        RecordList.tsx
        storybook/
          RecordList.stories.tsx   ← 컴포넌트와 같은 도메인 폴더 안
  components/
    BlockContent.tsx
    storybook/
      BlockContent.stories.tsx
```

- 파일명: `{컴포넌트명}.stories.tsx`
- 위치: 컴포넌트 파일과 같은 디렉토리의 `storybook/` 하위 폴더
- `title`: `'도메인/컴포넌트명'` 형식 (예: `'Record/RecordList'`, `'Calendar/WeekCalendar'`)

---

## 3. 설명(description) 작성 규칙

모든 스토리 파일은 **두 레벨**의 설명을 포함한다.

### 3-1. 컴포넌트 레벨 — `docs.description.component` (meta에 작성)

Docs 탭 상단에 표시된다. 다음 내용을 마크다운으로 작성한다.

- **어디서 쓰이는지**: 어느 페이지·탭·섹션에서 렌더링되는지
- **주요 동작**: 사용자가 상호작용하면 무슨 일이 일어나는지
- **주요 prop**: 시각적 변화를 일으키는 prop이 있으면 한 줄 설명

```tsx
const meta = {
  title: 'Record/RecordList',
  component: RecordList,
  parameters: {
    docs: {
      description: {
        component: `
홈 화면과 그룹 홈의 **피드 탭**에서 날짜별 기록 목록을 표시하는 컴포넌트.

WeekCalendar에서 날짜를 선택하면 해당 날짜의 기록이 이 컴포넌트를 통해 렌더링된다.
카드를 클릭하면 기록 상세 페이지(\`/record/:id\`)로 이동한다.
        `,
      },
    },
  },
} satisfies Meta<typeof RecordList>;
```

### 3-2. 스토리 레벨 — `docs.description.story` (각 Story에 작성)

| 스토리 | 설명 내용 |
|--------|-----------|
| **Default** | 컴포넌트의 주요 동작과 클릭 이벤트를 불릿으로 함께 기술 |
| 그 외 상태 | 해당 상태가 언제 보이는지 한 줄 |

**Interactive 스토리는 따로 만들지 않는다.** 클릭 이벤트·드로어·팝오버 동작 설명은 Default 스토리의 `docs.description.story`에 함께 작성한다. 별도 Interactive 스토리는 Default와 내용이 중복되고, 읽는 사람이 두 곳을 오가야 하는 불편이 생긴다.

```tsx
export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: `
오늘 날짜 기준 기록 목록 — 개인/그룹 기록이 혼합된 기본 상태.

- **카드 클릭**: 기록 상세 페이지(\`/record/:id\`)로 이동
- **imageLayout 변경** (Controls 패널):
  - \`tile\` — 이미지 그리드로 한 번에 표시
  - \`carousel\` — 이미지를 한 장씩 슬라이드로 표시
        `,
      },
    },
  },
};
```

---

## 4. Controls(args) 작동 규칙

### 4-1. `experimentalRSC` 비활성화 유지

`.storybook/main.ts`에서 `experimentalRSC: true`를 설정하면 Controls(args) 변경 시
서버 재렌더링이 트리거되지 않아 prop 제어가 동작하지 않는다.
**실제 서버 컴포넌트(RSC) 스토리가 없는 한 이 옵션은 활성화하지 않는다.**

### 4-2. `render(args)` 패턴으로 props 직접 전달

Controls로 prop을 제어할 때는 `render` 함수의 첫 번째 인자 `args`를 컴포넌트에 직접 넘긴다.

```tsx
export const Default: Story = {
  args: { imageLayout: 'tile' },
  // ✅ args를 컴포넌트에 직접 전달 — Controls 변경 시 즉시 반영됨
  render: (args) => <RecordList imageLayout={args.imageLayout} />,
};
```

`useArgs()` 훅은 사용하지 않는다 — Storybook hook 컨텍스트 제약이 까다롭고, `render(args)` 패턴으로 충분히 해결된다.

---

## 5. 다크 모드 패턴

### 5-1. DarkMode 스토리를 만들지 않는다

`preview.tsx`의 전역 데코레이터가 모든 스토리에 ThemeProvider를 제공하고,
우상단 툴바의 **Light / Dark 토글**로 어떤 스토리든 즉시 테마를 전환할 수 있다.
별도 DarkMode 스토리는 중복이다.

특정 스토리를 다크 모드로 시작하고 싶다면 `parameters.globals.theme`을 지정한다.

```tsx
// ✅ 스토리 초기 테마 지정
export const SomeDarkFirst: Story = {
  parameters: {
    globals: { theme: 'dark' },
    backgrounds: { default: 'dark' },
  },
};

// ❌ DarkMode 스토리를 별도로 만들지 않는다
export const DarkMode: Story = { ... };
```

### 5-2. 전역 ThemeProvider — 스토리에서 따로 감싸지 않는다

`preview.tsx`가 전역으로 `ThemeProvider`를 제공하므로, 개별 스토리에서 `ThemeProvider`를 다시 감쌀 필요 없다. `forcedTheme={context.globals.theme}`으로 스토리 간 `html.dark` 오염도 차단된다.

```tsx
// preview.tsx — 전역 설정 (건드리지 않는다)
const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme ?? 'light';
  return (
    <ThemeProvider attribute="class" forcedTheme={theme} enableSystem={false}>
      <Story />
    </ThemeProvider>
  );
};
```

### 5-3. wrapper div에 `dark:bg-` 추가

스토리의 배경이 툴바 테마 전환에 반응하도록 wrapper div에 항상 dark 배경을 함께 지정한다.

```tsx
// ✅ 툴바 전환 시 배경도 함께 반응
<div className="max-w-2xl mx-auto p-5 bg-[#F9F9F9] dark:bg-[#121212]">
```

---

## 6. MSW + TanStack Query 패턴

### 6-1. QueryClient는 모듈 레벨에서 한 번만 생성

decorator 함수 안에서 QueryClient를 생성하면 args 변경 때마다 새 인스턴스가 만들어져 loading 플래시가 발생한다.

```tsx
// ✅ 모듈 레벨에서 한 번만 생성
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: 0 } },
});
```

### 6-2. 내부에서 데이터를 fetch하는 컴포넌트 — pre-seed 패턴

`useSuspenseQuery` / `useQuery` / `useInfiniteQuery`를 **컴포넌트 내부에서 직접 호출**하는 경우,
MSW 인터셉트 대신 `client.setQueryData`로 캐시를 미리 채운다.
Storybook에서 인증 헤더가 없어 API 호출이 실패하는 문제를 피할 수 있고,
데이터가 즉시 표시되어 로딩 플래시도 없다.

```tsx
// ✅ pre-seed 패턴 (useSuspenseQuery 컴포넌트)
function makeClient() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  // queryKey는 실제 queryOptions의 queryKey와 정확히 일치해야 한다
  client.setQueryData(['profile', 'me'], mockProfile);
  return client;
}

const clients = {
  default: makeClient(),
  // 스토리마다 독립적인 QueryClient 인스턴스 사용
};

export const Default: Story = {
  decorators: [
    (Story) => (
      <QueryClientProvider client={clients.default}>
        <Suspense fallback={<div>로딩 중...</div>}>
          <Story />
        </Suspense>
      </QueryClientProvider>
    ),
  ],
};
```

`useSuspenseQuery`를 사용하는 컴포넌트는 반드시 `<Suspense>`로 감싼다.

### 6-3. MSW 핸들러는 각 스토리의 `parameters.msw.handlers`에 선언

외부 API를 mock할 때(인증이 필요 없는 경우)는 MSW를 사용한다.
스토리별로 다른 응답이 필요하면 각 스토리에서 핸들러를 덮어쓴다.

```tsx
export const EmptyRecords: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/feed', () =>
          HttpResponse.json({ success: true, data: [], error: null }),
        ),
      ],
    },
  },
};
```

### 6-4. mock 데이터는 `src/lib/mocks/mock.ts`에서 가져온다

```tsx
// ✅
import { createMockRecordPreviews } from '@/lib/mocks/mock';

// ❌ handlers.ts는 mock 함수를 re-export하지 않음
import { createMockRecordPreviews } from '@/lib/mocks/handlers';
```

---

## 7. 스토리 구성 순서

같은 파일 안에서 스토리를 아래 순서로 배치한다.

1. **Default** — 가장 일반적인 상태 + 주요 인터랙션 설명 포함
2. **상태 변형** — 데이터 개수, 조건 분기, 권한 차이 등 (예: `EmptyRecords`, `ViewerRole`)
3. **그룹/개인 분기** — 그룹/개인 모드가 있는 경우 (예: `GroupRecords`)

---

## 8. 공통 원칙

| 원칙 | 내용 |
|------|------|
| **한국어 설명** | `docs.description`은 한국어로 작성 — 비즈니스 언어 사용 |
| **mock은 현실에 가깝게** | 실제 API 응답 타입과 필드명을 정확히 사용 |
| **props 변화가 보이게** | imageLayout 같은 prop은 2장 이상의 이미지 mock으로 차이가 보이도록 |
| **`inline: false` 지양** | Docs 뷰에서 iframe이 생성되어 툴바 globals(theme 등)가 전달되지 않을 수 있음 |

---

## 9. 실전 교훈

### 9-1. 컴포넌트 props 타입을 반드시 확인한다

스토리 작성 전에 컴포넌트의 실제 props 인터페이스를 확인한다.
타입이 다르면 런타임 에러가 발생하거나 데이터가 렌더링되지 않는다.

```ts
// ❌ ProfileTag(객체)를 넘겼으나 컴포넌트는 TagStatSummary를 기대함
args: { tags: { recent: [...], frequent: [...], all: [] } }

// ✅ 실제 타입 확인 후 적용
args: { tags: { recentTags: [...], frequentTags: [...] } }
```

필드명도 컴포넌트 코드에서 직접 확인한다 (`tag.name` vs `tag.tag` 등).

### 9-2. 필수 props 누락은 즉시 런타임 에러로 나타난다

`me`, `groupId` 같은 필수 prop을 빠뜨리면 컴포넌트 내부에서 `undefined.role` 형태의 에러가 발생한다. 에러 메시지의 컴포넌트명을 보고 해당 컴포넌트의 props 인터페이스를 확인한다.

### 9-3. `groupName` 등 선택적 필드를 빠뜨리면 UI가 비어 보인다

`scope: 'GROUP'`인 기록의 mock에 `groupName`을 넣지 않으면 `{record.groupName}` 렌더가 빈 문자열로 표시된다. mock 작성 시 컴포넌트가 실제로 렌더링하는 필드를 빠짐없이 채운다.

### 9-4. `__dirname is not defined` — `viteFinal`에서 define 설정

`next-auth` 내부 의존(`ua-parser-js`)이 CJS 빌드에서 `__dirname`을 사용한다.
`.storybook/main.ts`의 `viteFinal`에서 `__dirname`을 빈 문자열로 주입한다.

```ts
viteFinal: async (config) => {
  config.define = { ...config.define, __dirname: JSON.stringify('') };
  return config;
},
```

### 9-5. SVG 기반 차트는 `resolvedTheme` + `key`로 다크 모드 적용

Recharts 등 SVG 기반 차트의 tick/label 색상은 Tailwind `dark:` 클래스로 제어할 수 없다.
`useTheme().resolvedTheme`으로 색상을 분기하고, `key={resolvedTheme}`으로 테마 변경 시 차트를 리마운트한다.

```tsx
const { resolvedTheme } = useTheme();

<ResponsiveContainer key={resolvedTheme}>
  <RadarChart>
    <PolarAngleAxis
      tick={{ fill: resolvedTheme === 'dark' ? '#E6E7EB' : '#333333' }}
    />
  </RadarChart>
</ResponsiveContainer>
```
