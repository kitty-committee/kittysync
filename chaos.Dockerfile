FROM mcr.microsoft.com/devcontainers/javascript-node:5-24-trixie

RUN corepack enable && corepack prepare pnpm@12.16.1 --activate \
    && pnpx playwright@1.64.0 install --with-deps

RUN apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      postgresql postgresql-client redis-server unison \
 && rm -rf /var/lib/apt/lists/*

# Create the role and database at build time
RUN service postgresql start \
 && su postgres -c "psql -c \"CREATE ROLE kittysync LOGIN PASSWORD 'password' CREATEDB\"" \
 && su postgres -c "createdb -O kittysync kittysync" \
 && service postgresql stop

COPY . .

COPY .env.example .env

RUN pnpm install --frozen-lockfile

ENV FC_SEED=20261109
ENV FC_RUNS=100

CMD ["/bin/bash", "-c", "set -a && . .env && set +a && service redis-server start && service postgresql start && pnpm chaos run check:chaos && pnpm chaos run check:test && printf '\\n\\033[1;32m=============================================\\033[0m\\n\\033[1;32m             CHAOS TESTS PASSED         \\033[0m\\n\\033[1;32m=============================================\\033[0m\\n'"]