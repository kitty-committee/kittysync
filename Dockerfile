FROM node:24.21.0-alpine AS build

WORKDIR /build

RUN corepack enable && corepack prepare pnpm@12.16.1 --activate

COPY . .

RUN pnpm install --frozen-lockfile && \
    pnpm common build && \
    pnpm backend build && \
    pnpm frontend build && \
    rm -rf /build/.output && \
    pnpm backend deploy --prod /build/.output

FROM node:24.21.0-alpine

WORKDIR /app

COPY --from=build /build/.output .

COPY --from=build /build/packages/frontend/build /app/public

EXPOSE 3000

CMD ["node", "build/index.js"]