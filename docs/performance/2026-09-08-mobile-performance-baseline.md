# 모바일 성능 기준선 측정 기록

- 측정일: 2026-09-08 (KST)
- 측정 대상: `https://ittda.vercel.app/login`
- 기준 커밋: `3ee3078f`
- 목적: 모바일 초기 로딩과 이미지 전달 구조의 개선 전 기준선을 남긴다.
- 주의: 인증이 필요한 홈/피드가 아니라 공개 로그인 화면의 실험실 측정이다. 이미지 피드의 결론은 네트워크 실측과 코드 경로 분석을 함께 사용했다.

## 측정 결과

| 지표                           |           측정값 |
| ------------------------------ | ---------------: |
| Lighthouse Performance         |               78 |
| First Contentful Paint (FCP)   |            2.2초 |
| Largest Contentful Paint (LCP) |            5.3초 |
| Speed Index                    |            2.6초 |
| Total Blocking Time (TBT)      |             80ms |
| Time to Interactive (TTI)      |            7.5초 |
| Cumulative Layout Shift (CLS)  |            0.038 |
| 전체 요청 수                   |             59개 |
| 전체 전송량                    |      약 1,089KiB |
| JavaScript                     | 30개 / 약 725KiB |
| Font                           | 12개 / 약 209KiB |
| Image                          |  4개 / 약 113KiB |
| Stylesheet                     |   2개 / 약 49KiB |

LCP 요소는 첫 화면의 `사진 한 장이면 날짜와 장소가 자동으로 기록되고...` 문장이었다. LCP 5.3초 중 약 4.54초(85%)가 element render delay로 분류됐다.

Google Tag Manager 스크립트는 약 174KiB를 전송했고 메인 스레드를 약 127ms 사용했다. 측정된 단일 리소스 중 전송량이 가장 컸다.

## 측정 방법

### Lighthouse 모바일 시뮬레이션

저장소에 설치된 LHCI 0.15.1과 로컬 Chrome을 사용했다.

```bash
pnpm --filter frontend exec lhci collect \
  --url=https://ittda.vercel.app/login \
  --numberOfRuns=1 \
  --settings.formFactor=mobile \
  --settings.screenEmulation.mobile=true \
  --settings.throttlingMethod=simulate \
  --settings.onlyCategories=performance \
  --chromePath='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
```

이번 진단은 빠른 방향 확인을 위해 1회 실행했다. 공식 Before/After 기록에서는 `--numberOfRuns=5`로 실행하고 중앙값을 사용한다. LHCI는 명령을 실행한 현재 디렉터리의 `.lighthouseci/` 아래에 HTML과 JSON 보고서를 만든다.

이번 임시 보고서:

- `/private/tmp/.lighthouseci/lhr-1788794294299.html`
- `/private/tmp/.lighthouseci/lhr-1788794294299.json`

### 동적 HTML TTFB 반복 측정

```bash
for i in 1 2 3 4 5; do
  curl -sS -L --compressed -o /dev/null \
    -w "run=$i code=%{http_code} ttfb=%{time_starttransfer} total=%{time_total} bytes=%{size_download}\n" \
    https://ittda.vercel.app/login
done
```

- 별도 최초 요청 TTFB: 약 1.21초
- 연속 5회 TTFB: 약 0.37~0.43초
- 응답 헤더: `cache-control: private, no-cache, no-store, max-age=0, must-revalidate`
- Vercel 응답: `x-vercel-cache: MISS`

### 개별 리소스 측정

```bash
curl -sS -L --compressed -o /dev/null \
  -w 'code=%{http_code} bytes=%{size_download} ttfb=%{time_starttransfer} total=%{time_total}\n' \
  '<RESOURCE_URL>'
```

Next.js CSS, preload 폰트, Google Analytics, Kakao SDK와 정적 이미지를 확인했다. `/base.png`는 약 2.04MB였고 운영에서 약 1.10초에 내려받았다. 현재는 주로 mock 데이터에 사용되므로 실제 사용자 피드 병목과는 구분한다.

### 레거시 주소 확인 — 현재 운영 진단에서 제외

저장소의 과거 Nginx 템플릿과 모바일 앱 허용 목록에서 발견한 주소를 확인했으나, 이후 사용자 확인을 통해 현재 Railway 백엔드 배포 주소가 아닌 레거시 주소임을 확인했다. 따라서 이 결과는 현재 운영 장애나 모바일 성능 원인의 근거로 사용하지 않는다.

저장소의 로컬 `frontend/.env`는 localhost만 가리키며, 이 작업 환경에서는 Railway 프로젝트 및 Vercel 운영 환경 변수에 연결되어 있지 않아 실제 운영 API 주소는 확인하지 못했다.

## 코드 경로 분석 결과

### 이미지 조회

1. 브라우저가 `/api/media-image/:id` 요청
2. Next.js 서버에서 세션/쿠키 확인
3. NestJS에 단건 이미지 권한과 presigned URL 요청
4. 오브젝트 스토리지에서 원본 전체 다운로드
5. Sharp로 원본 해상도 WebP 재인코딩
6. `private, no-cache`로 브라우저에 반환

프록시 이미지는 `next/image` 최적화를 끄며 Sharp 변환에도 화면 크기별 리사이즈가 없다. 따라서 `width={780}`을 지정해도 실제 전송 데이터는 780px 파생본이 아니다.

### 이미지 업로드

- 파일당 최대 10MB 원본을 압축 없이 직접 업로드한다.
- 여러 파일의 크기 확인과 업로드를 동시에 수행한다.
- draft 모드는 파일을 `ArrayBuffer`로 읽고 `File`과 `Blob` 복사본을 만든다.
- 일반 모드는 Data URL을 만들어 더 큰 문자열을 메모리에 유지한다.

### 초기 자바스크립트와 폰트

- Root Layout이 인증, 테마, 내비게이션, PWA, 네트워크 감지, 알림 처리 등을 모든 페이지에 포함한다.
- Google Analytics와 Kakao SDK가 전역에서 예약된다.
- Sentry Replay 실행은 `window.load` 이후지만 정적 import이므로 코드 자체는 초기 번들 후보에 남는다.
- Sentry trace sample rate는 클라이언트와 서버 모두 `1`이다.
- production build의 Noto Sans KR은 WOFF2 조각 124개, 총 약 3.36MB이지만 브라우저는 `unicode-range`에 맞는 조각만 받는다. 이번 측정 전송량은 12개, 약 209KiB였다.

## Before/After 기록 규칙

- 같은 URL과 동일한 테스트 계정/데이터 사용
- 같은 기기·네트워크·CPU 시뮬레이션 사용
- 모바일 Lighthouse 5회 실행 후 중앙값 사용
- cold cache와 warm cache 분리
- 로그인 화면과 인증된 홈 피드 별도 측정
- 테스트 데이터의 게시글 수, 사진 수, 원본 용량 기록
- LCP/FCP/CLS/TBT/TTFB, 요청 수, 이미지 총 전송량 기록
- 사진 5장 업로드 완료 시간과 최대 메모리 사용량 기록
- 변경 전·후 Lighthouse HTML/JSON을 CI artifact로 보관

서버에는 `Server-Timing`을 추가해 `auth`, `permission`, `storage`, `sharp` 시간을 분리하면 병목 개선을 명확히 증명할 수 있다.

## 이번 진단에서 실행한 작업

- `rg`, `sed`, `find`, `stat`, `du`로 소스와 production build 산출물을 읽었다.
- `curl`로 운영 HTML, 정적·서드파티 파일의 헤더, TTFB, 전송량을 읽었다.
- LHCI와 Chrome headless로 공개 로그인 화면을 1회 측정했다.
- `jq`로 Lighthouse JSON의 지표와 리소스 유형별 전송량을 집계했다.
- `openssl`로 저장소에서 발견한 레거시 도메인의 인증서 CN/SAN을 확인했으나, 현재 운영 주소가 아니므로 진단 결과에서 제외했다.
- Railway 상태 조회를 시도했지만 저장소가 Railway 프로젝트에 연결되어 있지 않아 서비스 로그·CPU·메모리는 조회하지 못했다.
- 브라우저 UI 연결과 웹 문서 열기를 시도했지만 사용 가능한 브라우저가 없어 중단했다.

진단 과정에서는 애플리케이션 코드, Git 브랜치, 배포 설정, Railway 리소스를 변경하지 않았다. `/private/tmp`에 Lighthouse 보고서와 임시 HTTP 응답 파일만 생성했다.
