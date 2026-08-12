# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim AS base
RUN apt-get update \
	&& apt-get install -y --no-install-recommends openssl \
	&& rm -rf /var/lib/apt/lists/* \
	&& corepack enable
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/types/package.json packages/types/package.json
RUN pnpm install --frozen-lockfile --filter @nora/api... --filter @nora/types 2>/dev/null || pnpm install --filter @nora/api... --filter @nora/types

FROM deps AS build
COPY tsconfig.base.json ./
COPY database database
COPY packages packages
COPY apps/api apps/api
RUN pnpm --filter @nora/types build
RUN pnpm --filter @nora/api exec prisma generate --schema ../../database/schema.prisma
RUN pnpm --filter @nora/api build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo/package.json /repo/pnpm-workspace.yaml ./
COPY --from=build /repo/apps/api/package.json apps/api/package.json
COPY --from=build /repo/packages/types packages/types
COPY --from=build /repo/apps/api/dist apps/api/dist
COPY --from=build /repo/apps/api/node_modules apps/api/node_modules
COPY --from=build /repo/database/generated database/generated
COPY --from=build /repo/database/schema.prisma database/schema.prisma
COPY --from=build /repo/database/migrations database/migrations
COPY --from=build /repo/node_modules node_modules
EXPOSE 4000
# Runs pending migrations against the live DATABASE_URL, then starts the API. Baked in
# here (rather than left to an external deploy hook) so any host running this image
# boots correctly without extra configuration. The first Render boot left the safety
# migration in a failed state before its prerequisites were ordered correctly; clear
# only that failed record so Prisma can apply the repaired migration sequence.
CMD ["sh", "-c", "(pnpm --filter @nora/api exec prisma migrate resolve --rolled-back 20260811210000_safety_checkins --schema ../../database/schema.prisma || true) && pnpm --filter @nora/api exec prisma migrate deploy --schema ../../database/schema.prisma && node apps/api/dist/main.js"]
