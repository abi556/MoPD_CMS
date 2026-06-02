# MoPD CMS API — production image.
# Build from monorepo root:
#   docker build -f apps/api/Dockerfile -t mopd-cms-api .

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.18.0 --activate
WORKDIR /app

FROM base AS builder
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared
RUN pnpm install --frozen-lockfile --ignore-scripts --filter @mopd-cms/api...
ENV DATABASE_URL=postgresql://docker:docker@localhost:5432/docker?schema=public
RUN pnpm --filter @mopd-cms/api run prisma:generate
RUN pnpm --filter @mopd-cms/api run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs nestjs
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/prisma ./apps/api/prisma
WORKDIR /app/apps/api
USER nestjs
EXPOSE 3001
CMD ["node", "dist/main.js"]
