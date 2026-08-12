# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY packages/types/package.json packages/types/package.json
RUN pnpm install --filter @nora/web...

FROM deps AS build
COPY packages packages
COPY apps/web apps/web
RUN pnpm --filter @nora/web build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo/apps/web/.next apps/web/.next
COPY --from=build /repo/apps/web/public apps/web/public
COPY --from=build /repo/apps/web/node_modules apps/web/node_modules
COPY --from=build /repo/apps/web/package.json apps/web/package.json
COPY --from=build /repo/node_modules node_modules
WORKDIR /repo/apps/web
EXPOSE 3000
CMD ["node_modules/.bin/next", "start"]
