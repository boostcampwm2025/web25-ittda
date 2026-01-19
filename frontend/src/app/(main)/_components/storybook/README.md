# 홈 페이지 컴포넌트 Storybook

홈 페이지와 관련된 재사용 가능한 컴포넌트들의 Storybook 스토리입니다.

## 📚 포함된 스토리

### 1. RecordList (기록 목록)

- `Default`: 기본 기록 목록 (3개)
- `SingleRecord`: 기록 1개
- `EmptyRecords`: 빈 목록 (추가 버튼 표시)
- `ManyRecords`: 많은 기록 (9개)
- `DarkMode`: 다크 모드

### 2. WeekCalendar (주간 캘린더)

- `Default`: 기본 캘린더
- `DarkMode`: 다크 모드
- `Interactive`: 인터랙티브 기능 설명

> **참고**: Page 컴포넌트(`page.tsx`)는 스토리북에 포함하지 않습니다. Page는 라우팅, 상태 관리 등 의존성이 많아 E2E 테스트가 더 적합합니다.

## 🚀 실행 방법

```bash
# Storybook 실행
pnpm run storybook

# Storybook 빌드
pnpm run build-storybook
```

Storybook은 `http://localhost:6006`에서 실행됩니다.

## 🎨 주요 기능

### WeekCalendar

- **날짜 선택**: 클릭으로 날짜 선택 (미래 날짜 비활성화)
- **스와이프**: 좌우 드래그로 이전/다음 주 이동
- **연월 클릭**: `/my/month/:month` 페이지로 이동
- **시각적 표시**:
  - 오늘: 초록색 배경
  - 선택된 날짜: 검은색(라이트) / 흰색(다크) 배경
  - 일요일: 빨간색 텍스트
  - 토요일: 파란색 텍스트

### RecordList

- **필터링**: 선택된 날짜의 기록만 표시
- **클릭**: 기록 클릭 시 `/record/:id` 페이지로 이동
- **빈 상태**: 기록이 없을 때 "기록 추가하기" 버튼 표시
- **동적 렌더링**: CompactFieldRenderer로 각 필드 타입 렌더링

## 📦 의존성

- `zustand`: WeekCalendar 상태 관리 (useWeekCalendar)
- `framer-motion`: WeekCalendar 애니메이션
- `next/navigation`: 라우팅
- `lucide-react`: 아이콘

## 🔗 관련 파일

- `page.tsx`: 홈 페이지 메인 컴포넌트
- `RecordList.tsx`: 기록 목록 컴포넌트
- `WeekCalendar.tsx`: 주간 캘린더 컴포넌트
- `CompactFieldRenderer.tsx`: 필드 렌더러
- `useWeekCalendar.ts`: 캘린더 상태 관리 훅
