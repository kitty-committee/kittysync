#!/usr/bin/env bash

set -u

remote_fs() {
  case "$(stat -f -c %T . 2>/dev/null)" in
    v9fs|9p|virtiofs|fuse*|cifs|drvfs|nfs|nfs4) return 0 ;;
    *) return 1 ;;
  esac
}

if remote_fs; then
  cat <<'EOF' >&2
 
 
d88888b d8888b. d8888b.  .d88b.  d8888b.
88'     88  `8D 88  `8D .8P  Y8. 88  `8D
88ooooo 88oobY' 88oobY' 88    88 88oobY'
88~~~~~ 88`8b   88`8b   88    88 88`8b  
88.     88 `88. 88 `88. `8b  d8' 88 `88.
Y88888P 88   YD 88   YD  `Y88P'  88   YD

KittySync cannot be run on a remote filesystem.
If you are using Windows, please move the project
inside your WSL2 filesystem and try again.
 
 
EOF
  exit 1
fi

([ -f ".env" ] || cp ".env.example" ".env")
sudo service redis-server start
sudo service postgresql start