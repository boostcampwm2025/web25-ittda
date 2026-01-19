# 전체 감정 목록 컴포넌트 Storybook

전체 감정 페이지(`/profile/all-emotions`)의 재사용 가능한 컴포넌트 스토리입니다.

## 📚 포함된 스토리

### EmotionList (감정 목록)

- `Default`: 기본 감정 목록 (최근 사용한 탭)
- `RecentTab`: 최근 사용한 감정 탭
- `FrequentTab`: 자주 사용한 감정 탭
- `FewEmotions`: 감정이 적은 경우 (2개)
- `EmptyEmotions`: 감정이 없는 경우
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

### EmotionList

- **탭 전환**: 최근 사용한 / 자주 사용한 감정
- **감정 표시**: 이모지와 감정명, 사용 횟수
- **검색 이동**: 감정 클릭 시 검색 페이지로 이동 (`/search?emotion=감정명`)
- **스크롤**: 긴 목록 스크롤 가능 (스크롤바 숨김)
- **반응형**: Active 상태 배경색 변경

## 📦 의존성

- `lucide-react`: 아이콘 (ChevronRight)
- `next/navigation`: 라우팅
- `@/lib/types/profile`: ProfileEmotion 타입

## 🔗 관련 파일

### 메인 컴포넌트

- `page.tsx`: 전체 감정 페이지
- `EmotionList.tsx`: 감정 목록 컴포넌트
- `ProfileAllEmotionsHeaderActions.tsx`: 헤더 액션

## 💡 스토리북 작성 팁

### 재사용 가능한 컴포넌트만 포함

- ✅ EmotionList (props를 받는 컴포넌트)
- ❌ AllEmotionsPage (page.tsx)

### 다양한 상태 테스트

- Default, Empty, FewEmotions
- DarkMode, LightMode
- RecentTab, FrequentTab
