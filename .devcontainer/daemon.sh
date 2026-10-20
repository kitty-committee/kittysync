#!/usr/bin/env bash
exec 9>/tmp/sync.lock
flock -n 9 || exit 0

while true; do
  echo "$(date '+%F %T') starting unison" >&2
  unison "$@" -repeat 2
  echo "$(date '+%F %T') unison exited ($?); restarting in 5s" >&2
  sleep 5
done