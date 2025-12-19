FROM node:20-slim AS builder

WORKDIR /app

# workspace 메타
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY backend/package.json backend/package.json

RUN corepack enable && corepack prepare pnpm@10.25.0 --activate

# 소스 복사
COPY backend backend

# workspace install
RUN pnpm install --frozen-lockfile

# next build 직접 실행 또는 package.json의 script 확인
RUN pnpm run build:be


FROM node:20-slim AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@10.25.0 --activate

# 루트 node_modules 복사
COPY --from=builder /app/node_modules ./node_modules
# backend node_modules 복사
COPY --from=builder /app/backend/node_modules ./backend/node_modules

# dist 빌드 결과물 복사
COPY --from=builder /app/backend/dist ./backend/dist
# package.json 복사
COPY --from=builder /app/backend/package.json ./backend/package.json
# tsconfig.json복사
COPY --from=builder /app/backend/tsconfig.json ./backend/tsconfig.json
COPY --from=builder /app/backend/tsconfig.build.json ./backend/tsconfig.build.json

COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# 복사 확인 (디버깅용)
RUN ls -la /app/backend/dist

WORKDIR /app/backend

EXPOSE 4000

CMD ["node", "dist/main.js"]
# nest start는 기본적으로 소스 코드(src/main.ts)를 실행