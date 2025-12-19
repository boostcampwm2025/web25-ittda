FROM node:20-slim AS builder

# 빌드 시점에 전달할 ARG 정의 
ARG NEXT_PUBLIC_MOCK 
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY 
ARG NODE_ENV 

# ARG 값을 ENV로 승격 → 컨테이너 런타임에서도 사용 가능 
ENV NEXT_PUBLIC_MOCK=$NEXT_PUBLIC_MOCK 
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY 
ENV NODE_ENV=$NODE_ENV

WORKDIR /app

# workspace 메타
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY frontend/package.json frontend/package.json

RUN corepack enable && corepack prepare pnpm@10.25.0 --activate

# 소스 복사
COPY frontend frontend

# workspace install
RUN pnpm install --frozen-lockfile

# next build 직접 실행 또는 package.json의 script 확인
RUN pnpm run build:fe


FROM node:20-slim AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@10.25.0 --activate

# 루트 node_modules 복사
COPY --from=builder /app/node_modules ./node_modules
# frontend node_modules 복사
COPY --from=builder /app/frontend/node_modules ./frontend/node_modules

# .next 빌드 결과물 복사
COPY --from=builder /app/frontend/.next ./frontend/.next
# public 폴더 복사
COPY --from=builder /app/frontend/public ./frontend/public
# package.json 복사
COPY --from=builder /app/frontend/package.json ./frontend/package.json
# next.config 파일이 있다면 복사
COPY --from=builder /app/frontend/next.config.* ./frontend/

COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml


WORKDIR /app/frontend

EXPOSE 3000

CMD ["pnpm", "start"]