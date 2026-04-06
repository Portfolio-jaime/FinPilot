FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@9

COPY package.json pnpm-workspace.yaml turbo.json ./
COPY packages/tsconfig ./packages/tsconfig
COPY packages/types ./packages/types
COPY packages/simulator ./packages/simulator
COPY apps/api ./apps/api

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @finpilot/types build
RUN pnpm --filter @finpilot/simulator build
RUN pnpm --filter @finpilot/api build

FROM node:20-alpine AS runner
WORKDIR /app
RUN npm install -g pnpm@9

COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/types/package.json ./packages/types/package.json
COPY --from=builder /app/packages/simulator/dist ./packages/simulator/dist
COPY --from=builder /app/packages/simulator/package.json ./packages/simulator/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

RUN pnpm install --frozen-lockfile --prod

WORKDIR /app/apps/api
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
