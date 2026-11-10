FROM node:24.21.0-alpine AS build

WORKDIR /build

RUN corepack enable && corepack prepare pnpm@12.16.1 --activate

COPY . .

RUN pnpm install --frozen-lockfile

RUN pnpm run build && pnpm backend deploy --prod ./dist

FROM node:24.21.0-alpine

WORKDIR /app

COPY --from=build /build/dist .

CMD ["node", "build/index.js"]