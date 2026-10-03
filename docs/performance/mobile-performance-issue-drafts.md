# 모바일 성능 개선 이슈 초안

성능 작업은 이미지 전달과 초기 로딩의 두 이슈로 나눈다. 각 이슈 번호를 받은 뒤 `dev`에서 브랜치를 만든다.

저장소의 과거 Nginx 템플릿과 모바일 허용 목록에 남아 있던 레거시 주소는 현재 Railway 배포 주소가 아니다. 해당 주소의 TLS 검사 결과는 아래 성능 이슈의 근거에서 제외한다.

## Issue 1: 모바일 이미지 전달 파이프라인 최적화

### 제목

`refactor: 모바일 이미지 업로드·변환·전달 파이프라인 최적화`

### 브랜치

`refactor/mobile-image-pipeline-#<issue-number>`

### 🔨 Describe

현재 이미지는 원본 해상도로 업로드된다. 조회할 때마다 Next.js 프록시가 인증 확인, 백엔드 단건 권한 조회, 오브젝트 스토리지 원본 다운로드, Sharp WebP 변환을 수행한다. 화면 크기별 파생 이미지가 없고 응답은 `private, no-cache`여서 모바일에서도 큰 파일과 반복 네트워크 요청이 발생한다.

캐러셀은 모든 슬라이드를 렌더링하고 라이트박스는 모든 이미지를 일반 `<img>`로 생성한다. 모바일 업로드에서는 여러 원본 파일을 동시에 메모리로 읽고 복사하여 저사양 WebView의 메모리와 CPU 사용량을 높일 수 있다.

업로드 시 EXIF를 먼저 추출한 뒤 화면용 파생 이미지를 한 번 생성하고, private CDN의 signed URL 또는 signed cookie로 직접 전달하도록 개선한다.

### ✅ Tasks

- [ ] 인증 홈 피드의 Before Lighthouse 5회 중앙값 기록
- [ ] 사진 1장/5장 업로드 구간별 시간과 최대 메모리 기록
- [ ] EXIF 추출을 리사이즈·압축보다 먼저 수행
- [ ] 업로드 전 클라이언트 이미지 크기와 품질 제한
- [ ] 480/960/1600px WebP 또는 AVIF 파생본 생성
- [ ] 원본과 파생본의 storage key/metadata 스키마 정의
- [ ] 이미지 ID 또는 version을 포함한 immutable URL 설계
- [ ] private CDN signed URL 또는 signed cookie 적용
- [ ] 피드에는 480/960px, 라이트박스에는 1600px 또는 원본 사용
- [ ] 캐러셀은 현재 슬라이드와 앞뒤 슬라이드만 마운트
- [ ] `sizes`와 `srcset`을 실제 레이아웃에 맞게 지정
- [ ] `/api/media-image/:id`의 실시간 Sharp 변환 제거 또는 fallback 제한
- [ ] `Server-Timing`으로 auth/permission/storage/transform 구간 측정
- [ ] 단위 테스트와 모바일 E2E 보강
- [ ] 동일 조건 After Lighthouse 5회 중앙값 기록

### 완료 조건

- 모바일 홈 피드 LCP 5회 중앙값 2.5초 이하를 목표로 한다.
- 첫 화면 이미지 총 전송량이 Before 대비 50% 이상 감소한다.
- 동일 이미지 재방문 시 origin 이미지 변환이 발생하지 않는다.
- 사진 5장 선택 시 UI가 멈추지 않고 업로드 진행 상태를 표시한다.
- 이미지 방향과 EXIF 날짜·위치 추출 기능이 유지된다.
- 비인가 사용자가 CDN URL로 private 이미지를 열 수 없다.

### 🙋🏻 More

OCI Object Storage를 유지한다면 같은 저장소와 가까운 CDN을 우선 검토한다. AWS S3로 이동할 계획이라면 CloudFront OAC와 signed URL/cookie 조합을 사용한다. 현재 인증 프록시에 단순히 `public, immutable`을 붙이면 권한 회수 후 이미지가 캐시에 남을 수 있으므로 적용하지 않는다.

---

## Issue 2: 모바일 초기 번들 및 서드파티 로딩 최적화

### 제목

`refactor: 모바일 초기 JavaScript와 서드파티 스크립트 로딩 최적화`

### 브랜치

`refactor/mobile-initial-load-#<issue-number>`

### 🔨 Describe

운영 로그인 화면의 모바일 Lighthouse 1회 기준 Performance 78, LCP 5.3초, TTI 7.5초, 전체 전송량 약 1,089KiB가 측정됐다. JavaScript는 30개 약 725KiB였고 Google Tag Manager 파일 하나가 약 174KiB를 차지했다.

Root Layout에서 앱 전용 provider와 guard, Kakao SDK, Google Analytics가 모든 경로에 포함된다. Sentry Replay는 실행만 `window.load` 이후로 미뤘고 정적 import이므로 번들 코드 자체는 초기 다운로드 후보에 남는다.

### ✅ Tasks

- [ ] 로그인/public route와 인증 app route의 layout 분리
- [ ] Kakao SDK를 공유 버튼 사용 시점에 동적 로딩
- [ ] Google Analytics를 `lazyOnload` 또는 idle 시점으로 이동
- [ ] Analytics 지연에 따른 이벤트 누락 범위 확인
- [ ] Sentry Replay를 실제 dynamic import 방식으로 변경
- [ ] Sentry client/server trace sample rate 조정
- [ ] production `enableLogs` 필요성 재검토
- [ ] 로그인 화면의 불필요한 app provider/guard 제거
- [ ] bundle analyzer로 초기 route chunk 비교
- [ ] Noto Sans KR과 시스템 폰트의 LCP/CLS 비교
- [ ] Before/After Lighthouse 5회 중앙값 기록

### 완료 조건

- 로그인 화면 LCP 2.5초 이하를 목표로 한다.
- 초기 JavaScript 전송량이 Before 대비 30% 이상 감소한다.
- GA/Kakao/Replay가 초기 렌더링과 경쟁하지 않는다.
- 로그인, OAuth, 공유, 오류 수집 기능에 회귀가 없다.

---

## 권장 진행 순서

1. Issue 1에서 이미지 Before 측정과 `Server-Timing` 계측부터 추가한다.
2. 이미지 파생본 생성과 CDN 직접 전달을 작은 커밋으로 나눈다.
3. Issue 1의 Before/After 결과를 PR 본문에 첨부한다.
4. Issue 2에서 초기 번들을 별도로 최적화한다.

## 권장 커밋 메시지

```text
perf: 이미지 처리 구간별 Server-Timing 계측 추가 (#<issue-number>)
perf: 업로드 이미지 리사이즈 및 압축 적용 (#<issue-number>)
feat: 피드용 이미지 파생본 생성 및 저장 (#<issue-number>)
refactor: signed CDN 이미지 전달로 프록시 제거 (#<issue-number>)
perf: 캐러셀 이미지 마운트 범위 최적화 (#<issue-number>)
test: 모바일 이미지 업로드와 권한 회귀 테스트 추가 (#<issue-number>)
docs: 모바일 성능 Before/After 결과 기록 (#<issue-number>)
```

## 권장 PR 제목

`refactor: 모바일 이미지 전달 파이프라인 최적화 (#<issue-number>)`
