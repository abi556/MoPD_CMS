# MoPD CMS Web — production image (Next.js standalone).
# Build from monorepo root:
#   docker build -f apps/web/Dockerfile --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1 -t mopd-cms-web .

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.18.0 --activate
WORKDIR /app

FROM base AS builder
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY apps/web ./apps/web
COPY packages/shared ./packages/shared
ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm install --frozen-lockfile --ignore-scripts --filter @mopd-cms/web...
RUN pnpm --filter @mopd-cms/web run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs nextjs
USER nextjs
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "apps/web/server.js"]
