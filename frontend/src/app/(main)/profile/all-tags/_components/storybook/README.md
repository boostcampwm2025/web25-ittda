# 전체 태그 목록 컴포넌트 Storybook

전체 태그 페이지(`/profile/all-tags`)의 재사용 가능한 컴포넌트 스토리입니다.

## 📚 포함된 스토리

### TagList (태그 목록)

- `Default`: 기본 태그 목록 (최근 사용한 탭)
- `RecentTab`: 최근 사용한 태그 탭
- `FrequentTab`: 자주 사용한 태그 탭
- `FewTags`: 태그가 적은 경우 (2개)
- `EmptyTags`: 태그가 없는 경우
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

### TagList

- **탭 전환**: 최근 사용한 / 자주 사용한 태그
- **태그 표시**: # 기호와 태그명, 사용 횟수
- **검색 이동**: 태그 클릭 시 검색 페이지로 이동 (`/search?tag=태그명`)
- **스크롤**: 긴 목록 스크롤 가능 (스크롤바 숨김)
- **반응형**: Active 상태 배경색 변경

## 📦 의존성

- `lucide-react`: 아이콘 (ChevronRight)
- `next/navigation`: 라우팅
- `@/lib/types/profile`: ProfileTag 타입

## 🔗 관련 파일

### 메인 컴포넌트

- `page.tsx`: 전체 태그 페이지
- `TagList.tsx`: 태그 목록 컴포넌트
- `ProfileAllTagsHeaderActions.tsx`: 헤더 액션

## 💡 스토리북 작성 팁

### 재사용 가능한 컴포넌트만 포함

- ✅ TagList (props를 받는 컴포넌트)
- ❌ AllTagsPage (page.tsx)

### 다양한 상태 테스트

- Default, Empty, FewTags
- DarkMode, LightMode
- RecentTab, FrequentTab
