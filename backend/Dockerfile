# backend/Dockerfile

FROM node:20-alpine AS builder

WORKDIR /app

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

COPY --from=builder /app/dist ./dist

EXPOSE 4000

CMD ["node", "dist/main.js"]

# 설계 포인트
# build / runtime 분리
# dist/main.js 실행
# 포트 4000 고정

# --prod (또는 --production): devDependencies에 포함된 패키지(개발용 라이브러리)를 제외하고, 
# 오직 dependencies에 명시된 프로덕션 환경에 필요한 패키지만 설치

# --frozen-lockfile: pnpm-lock.yaml 파일이 이미 존재할 경우, 
# 해당 파일의 내용을 절대 변경하지 않고 파일에 명시된 버전 그대로 설치합니다.
