# frontend/Dockerfile

FROM node:20-alpine AS builder

WORKDIR /app

# pnpm 사용
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# -------------------------

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN npm install -g pnpm

COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./

EXPOSE 3000

CMD ["pnpm", "start"]

# 설계 포인트
# production 빌드
# dev dependency 제거
# next start 사용
# 포트 3000 고정
# standalone 모드도 가능하지만, 지금 단계에서는 단순성이 우선입니다.
# Next.js의 standalone 빌드는 애플리케이션을 실행하는 데 필요한 
# 최소한의 파일과 종속성만 추출하여 배포 준비를 하는 기능
