# 프로젝트 개요

web25 부스트캠프 그룹 프로젝트. Next.js(프론트엔드) + NestJS(백엔드) 모노레포 구조.

- 패키지 매니저: pnpm workspace
- 프론트엔드: `frontend/` — Next.js 16, React 19, TailwindCSS 4, Zustand, TanStack Query
- 백엔드: `backend/` — NestJS 11, TypeORM, PostgreSQL
- 모바일: `mobile-app/` — Capacitor 기반

## 주요 커맨드

```bash
pnpm dev:fe          # 프론트 개발 서버
pnpm dev:be          # 백엔드 개발 서버
pnpm infra:up        # 개발용 Docker 인프라 시작
pnpm test:fe         # 프론트 단위 테스트 (Vitest)
pnpm test:fe:e2e     # 프론트 E2E 테스트 (Playwright)
pnpm test:be         # 백엔드 단위 테스트 (Jest)
pnpm test:be:e2e     # 백엔드 E2E 테스트
```

---

# 프론트엔드 테스트 가이드라인

> 백엔드(`backend/`)는 Jest를 사용하며 별도 가이드라인 적용. 아래는 `frontend/` 전용.

자세한 내용은 [TESTING.md](./TESTING.md) 참고.

## 요약

- **Vitest**: 순수 함수, 유틸, 훅 단위 테스트. 파일 위치는 소스 옆 (`*.test.ts`)
- **Playwright**: 사용자 흐름 E2E 테스트. `e2e/` 폴더에 `*.spec.ts`로 분리
- `getByRole` / `getByLabel` 우선, `data-testid`는 최후 수단
- `waitForTimeout` 금지 — `expect(...).toBeVisible()` 또는 `waitForResponse` 사용
- 외부 의존성(`Date`, API)은 반드시 mock 격리
- `it` 설명은 한국어로, 비즈니스 언어 사용
