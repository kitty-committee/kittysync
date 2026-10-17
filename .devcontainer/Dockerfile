FROM mcr.microsoft.com/devcontainers/javascript-node:5-24-trixie

USER root
RUN apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      postgresql postgresql-client redis-server unison \
 && rm -rf /var/lib/apt/lists/*

# Create the role and database at build time, so there is nothing to do at startup
RUN service postgresql start \
 && su postgres -c "psql -c \"CREATE ROLE kittysync LOGIN PASSWORD 'password' CREATEDB\"" \
 && su postgres -c "createdb -O kittysync kittysync" \
 && service postgresql stop

COPY . /.devcontainer

USER node
RUN mkdir -p /home/node/kittysync
RUN pnpx playwright@1.64.0 install --with-deps