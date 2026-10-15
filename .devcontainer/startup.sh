#!/usr/bin/env bash

set -u

SRC="/workspaces/kittysync"
DST="/home/node/kittysync"
LOG=/tmp/sync.log

needs_sync() {
  case "$(stat -f -c %T "$SRC" 2>/dev/null)" in
    v9fs|9p|virtiofs|fuse*|cifs|drvfs) return 0 ;;
    *) return 1 ;;
  esac
}

UNISON_ARGS=(
  "$SRC" "$DST" -batch -auto -silent -times -prefer newer -perms 0
  -ignore 'Name node_modules' -ignore 'Name .svelte-kit'
)

sync_start() {
  if ! needs_sync; then
    if [ -L "$DST" ]; then
      ln -sfnT "$SRC" "$DST"
      return
    fi

    if [ -d "$DST" ]; then
      find "$DST" -mindepth 1 -maxdepth 1 -type l -delete
      rmdir "$DST" 2>/dev/null || mv "$DST" "$DST.old-$(date +%s)"
    fi

    ln -sT "$SRC" "$DST"
  else
    unison "${UNISON_ARGS[@]}" >>"$LOG" 2>&1
    pgrep -x unison >/dev/null && return 0
    setsid nohup bash -c '
      while true; do
        unison "$@" -repeat 2
        echo "unison exited; restarting in 5s" >&2
        sleep 5
      done' _ "${UNISON_ARGS[@]}" >>"$LOG" 2>&1 &
  fi
}

([ -f "$SRC/.env" ] || cp "$SRC/.env.example" "$SRC/.env")
sudo service redis-server start
sudo service postgresql start
sync_start