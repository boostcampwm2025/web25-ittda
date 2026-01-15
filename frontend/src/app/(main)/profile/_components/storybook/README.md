# 마이페이지 컴포넌트 Storybook

마이페이지와 관련된 재사용 가능한 컴포넌트들의 Storybook 스토리입니다.

## 📚 포함된 스토리

### 1. Profile (프로필 카드)

- `Default`: 기본 프로필 카드
- `DarkMode`: 다크 모드
- `Interactive`: 인터랙티브 기능 설명

### 2. TagDashboard (태그 대시보드)

- `Default`: 기본 태그 대시보드
- `RecentTab`: 최근 사용 태그 탭
- `FrequentTab`: 자주 사용 태그 탭
- `EmptyTags`: 태그가 없는 경우
- `FewTags`: 태그가 적은 경우 (2개)
- `DarkMode`: 다크 모드
- `WithComboSearch`: 조합 검색 기능 포함

### 3. RecordStatistics (기록 통계)

- `Default`: 기본 통계 (접힌 상태)
- `Collapsed`: 접힌 상태
- `Expanded`: 펼쳐진 상태 (차트 표시)
- `DarkMode`: 다크 모드
- `Interactive`: 인터랙티브 기능 설명

### 4. Setting (설정)

- `Default`: 기본 설정
- `LightMode`: 라이트 모드 (태양 아이콘)
- `DarkMode`: 다크 모드 (달 아이콘)
- `Interactive`: 인터랙티브 기능 설명
- `WithdrawalDrawer`: 탈퇴 확인 Drawer

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

### Profile

- **프로필 정보**: 이미지, 이름, 이메일 표시
- **수정 버튼**: `/profile/edit` 페이지로 이동
- **반응형**: Active 상태 스케일 애니메이션

### TagDashboard

- **탭 전환**: 최근 사용 / 자주 사용 태그
- **태그 표시**: 최대 5개까지 표시
- **조합 검색**: Drawer UI로 여러 태그 선택 후 검색
  - 태그 선택/해제
  - 선택된 태그 수 표시
  - 초기화 버튼
  - 검색 페이지로 이동 (쿼리 파라미터 전달)
- **모두 보기**: `/profile/all-tags` 페이지로 이동

### RecordStatistics

- **기본 통계**: WritingRecordStatistics 항상 표시
- **토글 기능**: "통계 더보기" / "접기" 버튼
- **확장 통계**:
  - MonthlyUsageChart: 월별 사용량
  - PlaceDashboard: 장소별 통계
  - EmotionDashboard: 감정별 통계
- **애니메이션**: 부드러운 expand/collapse

## 📦 의존성

- `@radix-ui/react-dialog`: Drawer UI (TagDashboard)
- `lucide-react`: 아이콘
- `next/navigation`: 라우팅
- `next/image`: 이미지 최적화

## 🔗 관련 파일

### 메인 컴포넌트

- `page.tsx`: 마이페이지 메인
- `Profile.tsx`: 프로필 카드
- `TagDashboard.tsx`: 태그 대시보드
- `RecordStatistics.tsx`: 기록 통계 컨테이너

### 하위 컴포넌트

- `WritingRecordStatistics.tsx`: 작성 통계
- `MonthlyUsageChart.tsx`: 월별 차트
- `PlaceDashboard.tsx`: 장소 대시보드
- `EmotionDashboard.tsx`: 감정 대시보드
- `Setting.tsx`: 설정
- `ProfileHeaderActions.tsx`: 헤더 액션

## 💡 스토리북 작성 팁

### 재사용 가능한 컴포넌트만 포함

- ✅ Profile, TagDashboard, RecordStatistics
- ❌ ProfilePage (page.tsx)

### Props를 받는 컴포넌트 우선

- `TagDashboard`: tags prop
- `RecordList`: records prop

### 다양한 상태 테스트

- Default, Empty, Loading, Error
- DarkMode, LightMode
- Collapsed, Expanded
