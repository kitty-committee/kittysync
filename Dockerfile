FROM node:24.21.0-alpine

WORKDIR /build

RUN corepack enable && corepack prepare pnpm@12.16.1 --activate

COPY . .

RUN pnpm install --frozen-lockfile

CMD ["pnpm", "dev"]
