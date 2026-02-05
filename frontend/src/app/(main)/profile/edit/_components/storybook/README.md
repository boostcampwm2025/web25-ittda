# 프로필 편집 컴포넌트 Storybook

프로필 편집 페이지(`/profile/edit`)의 재사용 가능한 컴포넌트 스토리입니다.

## 📚 포함된 스토리

### ProfileInfo (프로필 정보 편집)

- `Default`: 기본 프로필 편집 (이미지 + 닉네임)
- `WithEmail`: 이메일 표시 포함
- `EmptyNickname`: 닉네임 미입력 상태
- `LongNickname`: 긴 닉네임과 이메일
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

### ProfileInfo

- **프로필 이미지 변경**:
  - 카메라 아이콘 버튼
  - 파일 선택 시 즉시 미리보기
  - Active 상태 스케일 애니메이션
- **닉네임 편집**:
  - 실시간 입력
  - X 버튼으로 전체 삭제
  - 포커스 시 초록색 보더
  - 플레이스홀더와 안내 텍스트
- **이메일 표시 (선택적)**:
  - `showEmail` prop으로 제어
  - 읽기 전용
  - 회색 배경 비활성 스타일

## 📦 의존성

- `lucide-react`: 아이콘 (Camera, X)
- `next/image`: 이미지 최적화
- `ProfileEditContext`: 프로필 편집 상태 관리
  - `nickname`, `setNickname`
  - `image`, `setImage`
  - `email` (읽기 전용)

## 🔗 관련 파일

### 메인 컴포넌트

- `ProfileInfo.tsx`: 프로필 정보 편집 컴포넌트
- `ProfileEditContext.tsx`: 프로필 편집 Context Provider
- `ProfileEditHeaderActions.tsx`: 헤더 액션 (취소/완료)

### Page

- `page.tsx`: 프로필 편집 페이지
- `ProfileEditClient.tsx`: 클라이언트 컴포넌트

## 💡 스토리북 작성 팁

### Context Provider 사용

ProfileInfo는 ProfileEditContext를 필요로 하므로, 모든 스토리에 decorator로 ProfileEditProvider를 감싸야 합니다.

```tsx
decorators: [
  (Story, context) => (
    <ProfileEditProvider
      initialNickname={context.args.initialNickname || '사용자'}
      initialImage={context.args.profileImage}
      email={context.args.email}
    >
      <Story />
    </ProfileEditProvider>
  ),
],
```

### 다양한 상태 테스트

- Default, WithEmail, EmptyNickname
- LongNickname (오버플로우 테스트)
- DarkMode, LightMode

### Props 전달

- `profileImage`: 초기 프로필 이미지 URL
- `showEmail`: 이메일 필드 표시 여부
- `initialNickname`: 초기 닉네임 (Context에 전달)
- `email`: 이메일 주소 (Context에 전달)
