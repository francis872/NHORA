# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/types/package.json packages/types/package.json
RUN pnpm install --frozen-lockfile --filter @nora/api... 2>/dev/null || pnpm install --filter @nora/api...

FROM deps AS build
COPY database database
COPY packages packages
COPY apps/api apps/api
RUN pnpm --filter @nora/api exec prisma generate --schema ../../database/schema.prisma
RUN pnpm --filter @nora/api build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo/apps/api/dist apps/api/dist
COPY --from=build /repo/apps/api/node_modules apps/api/node_modules
COPY --from=build /repo/database/generated database/generated
COPY --from=build /repo/database/schema.prisma database/schema.prisma
COPY --from=build /repo/database/migrations database/migrations
COPY --from=build /repo/node_modules node_modules
EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]
