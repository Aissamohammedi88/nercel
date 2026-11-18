#!/usr/bin/env bash
# =============================================================================
# installateur-nercel-v2.sh — NERCEL v2.0
# Trouve nercel-2.0.tar.gz, l'extrait vers ~/nercel-2.0 et lance.
# Aucune dépendance pip : Python 3.8+ stdlib.
#
# Utilisation :
#   bash installateur-nercel-v2.sh           # installation + lanceur
#   bash installateur-nercel-v2.sh --stop    # arrêt
#   bash installateur-nercel-v2.sh --status  # état
# =============================================================================
set -u

ARCHIVE_NAME="nercel-2.0.tar.gz"
INSTALL_DIR="${NERCEL_INSTALL_DIR:-$HOME/nercel-2.0}"
DATA_DIR="$HOME/.nercel"

GREEN='\033[0;32m'; RED='\033[0;31m'; CYAN='\033[0;36m'; DIM='\033[2m'; B='\033[1m'; NC='\033[0m'
ok()   { printf "${GREEN}✓${NC} %s\n" "$*"; }
err()  { printf "${RED}✗ %s${NC}\n" "$*" >&2; }
info() { printf "${CYAN}▸${NC} %s\n" "$*"; }
header() { printf "\n${B}${CYAN}▲ NERCEL${NC} ${B}v2.0 — installer${NC}\n\n"; }

PY=""
for c in python3 python; do
  command -v "$c" >/dev/null 2>&1 && "$c" -c 'import sys;sys.exit(0 if sys.version_info>=(3,8)else 1)' 2>/dev/null && { PY="$c"; break; }
done

port_up() { "$PY" -c "import socket,sys;s=socket.socket();s.settimeout(0.5);sys.exit(0 if s.connect_ex(('127.0.0.1', $1))==0 else 1)" 2>/dev/null; }

# --stop / --status
case "${1:-}" in
  --stop|--status)
    [ -z "$PY" ] && { err "Python 3.8+ requis"; exit 1; }
    if [ -x "$INSTALL_DIR/start.sh" ]; then
      exec bash "$INSTALL_DIR/start.sh" "$1"
    else
      for f in "$DATA_DIR/nercel.pid" "$DATA_DIR/nexusd.pid"; do
        [ -f "$f" ] && kill "$(cat "$f" 2>/dev/null)" 2>/dev/null && rm -f "$f"
      done
      pkill -f "server\.py" 2>/dev/null; pkill -f "nexusd\.py" 2>/dev/null
      ok "NERCEL arrêté"; exit 0
    fi
    ;;
esac

header

[ "$(id -u)" = "0" ] && { err "Ne lance pas NERCEL en root."; exit 1; }
[ -z "$PY" ] && { err "Python 3.8+ requis (apt install python3)"; exit 1; }

# 1. Trouver l'archive
SRC=""
for d in "$HOME/Bureau" "$HOME/Desktop" "$HOME/Téléchargements" "$HOME/Downloads" "$HOME" "$PWD"; do
  [ -f "$d/$ARCHIVE_NAME" ] && { SRC="$d/$ARCHIVE_NAME"; break; }
done

if [ -z "$SRC" ]; then
  err "Archive '$ARCHIVE_NAME' introuvable."
  printf "${DIM}Place-la dans ~/Bureau ou ~/Téléchargements, puis relance.${NC}\n"
  exit 1
fi
ok "Archive trouvée : $SRC ($(du -h "$SRC" | cut -f1))"

# 2. Extraire
command -v tar >/dev/null 2>&1 || { err "tar manquant"; exit 1; }
rm -rf "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
tar -xzf "$SRC" -C "$INSTALL_DIR" --strip-components=1
ok "Extrait dans : $INSTALL_DIR"
chmod +x "$INSTALL_DIR/start.sh" "$INSTALL_DIR/nercel" "$INSTALL_DIR/server.py" "$INSTALL_DIR/nexusd.py" 2>/dev/null
printf "${DIM}contenu : $(ls "$INSTALL_DIR" | tr '\n' ' ')${NC}\n"

# 3. Lancer via start.sh
info "Lancement..."
bash "$INSTALL_DIR/start.sh"
