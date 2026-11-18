#!/usr/bin/env bash
# ==========================================================================
#  installer-nercel.sh — Nercel v1.0
#
#  Extrait nercel-1.0.tar.gz et lance la plateforme (orchestrateur + edge).
#  AUCUNE COMPILATION nécessaire : Nercel est 100% Python stdlib,
#  donc "installer" = extraire + rendre exécutable + lancer.
#
#  Usage :
#    bash installer-nercel.sh            # extraire + installer + démarrer
#    bash installer-nercel.sh --status   # voir l'état des serveurs
#    bash installer-nercel.sh --stop     # tout arrêter proprement
#    bash installer-nercel.sh --restart  # arrêter puis redémarrer
#
#  L'archive est cherchée automatiquement dans :
#    ~/Bureau  ~/Desktop  ~/Téléchargements  ~/Downloads  ~  .
# ==========================================================================
set -u

ARCHIVE_NAME="nercel-1.0.tar.gz"
INSTALL_DIR="${NERCEL_INSTALL_DIR:-$HOME/nercel}"
DATA_DIR="$HOME/.nercel"
ORCH_PORT=3923
EDGE_PORT=8765

# $'...' : vrais octets ESC dans les variables → couleurs OK partout (y compris heredoc)
GREEN=$'\033[0;32m'; RED=$'\033[0;31m'; CYAN=$'\033[0;36m'
YELLOW=$'\033[1;33m'; DIM=$'\033[2m'; BOLD=$'\033[1m'; NC=$'\033[0m'

ok()   { printf "${GREEN}✓${NC} %s\n" "$*"; }
err()  { printf "${RED}✗ %s${NC}\n" "$*" >&2; }
info() { printf "${CYAN}▸${NC} %s\n" "$*"; }
dim()  { printf "${DIM}  %s${NC}\n" "$*"; }
head() { printf "\n${BOLD}${CYAN}▲ NERCEL${NC} ${BOLD}v1.0 — installer${NC}\n\n"; }

# --------------------------------------------------------------------------
# Python disponible ? (requis)
# --------------------------------------------------------------------------
find_python() {
  PY=""
  for c in python3 python; do
    if command -v "$c" >/dev/null 2>&1; then
      if "$c" -c 'import sys; sys.exit(0 if sys.version_info >= (3,8) else 1)' 2>/dev/null; then
        PY="$c"; return 0
      fi
    fi
  done
  return 1
}

# --------------------------------------------------------------------------
# Port ouvert ? (0 = oui)
# --------------------------------------------------------------------------
port_up() {
  "$PY" -c "import socket,sys
s = socket.socket(); s.settimeout(0.5)
sys.exit(0 if s.connect_ex(('127.0.0.1', $1)) == 0 else 1)" 2>/dev/null
}

# --------------------------------------------------------------------------
# --stop : arrête les projets via l'API, puis les 2 serveurs
# --------------------------------------------------------------------------
stop_all() {
  info "Arrêt des projets en cours d'exécution…"
  "$PY" - "$ORCH_PORT" <<'PYEOF' 2>/dev/null
import sys, json, urllib.request
port = sys.argv[1]
try:
    d = json.load(urllib.request.urlopen(f"http://127.0.0.1:{port}/api/status", timeout=2))
    for p in d.get("projects", []):
        if p.get("status") == "running":
            try:
                req = urllib.request.Request(f"http://127.0.0.1:{port}/api/stop/{p['name']}", method="POST")
                urllib.request.urlopen(req, timeout=3)
                print(f"  projet arrêté : {p['name']}")
            except Exception:
                pass
except Exception:
    pass
PYEOF

  for f in "$DATA_DIR/nercel.pid" "$DATA_DIR/nexusd.pid"; do
    if [ -f "$f" ]; then
      pid=$(cat "$f" 2>/dev/null)
      if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        kill "$pid" 2>/dev/null && ok "serveur arrêté (PID $pid — $(basename "$f" .pid))"
      fi
      rm -f "$f"
    fi
  done

  # Filet de sécurité : processus encore vivants ?
  for pat in "python3 .*nercel\.py" "python3 .*nexusd\.py"; do
    pkill -f "$pat" 2>/dev/null
  done
  sleep 1
  ok "Nercel est arrêté."
}

# --------------------------------------------------------------------------
# --status : état des deux serveurs + projets
# --------------------------------------------------------------------------
show_status() {
  printf "\n${BOLD}▲ NERCEL — état${NC}\n\n"
  if port_up "$ORCH_PORT"; then
    ok "Orchestrateur  : http://127.0.0.1:$ORCH_PORT/  (en ligne)"
    "$PY" - "$ORCH_PORT" <<'PYEOF' 2>/dev/null
import sys, json, urllib.request
port = sys.argv[1]
try:
    d = json.load(urllib.request.urlopen(f"http://127.0.0.1:{port}/api/status", timeout=2))
    projects = d.get("projects", [])
    print(f"  projets en base : {len(projects)}")
    for p in projects:
        icon = {"running":"●","building":"◐","error":"✗","stopped":"○"}.get(p["status"], "·")
        print(f"    {icon} {p['name']:<20} {p['status']:<10} port={p['port'] or '—'}")
except Exception as e:
    print(f"  (API injoignable : {e})")
PYEOF
  else
    err "Orchestrateur : hors ligne (port $ORCH_PORT)"
  fi
  if port_up "$EDGE_PORT"; then
    ok "Edge proxy     : http://127.0.0.1:$EDGE_PORT/  (en ligne)"
  else
    err "Edge proxy : hors ligne (port $EDGE_PORT)"
  fi
  printf "\n"
}

# ==========================================================================
# Mode d'emploi
# ==========================================================================
case "${1:-}" in
  --stop)    find_python || { err "Python 3.8+ requis"; exit 1; }
             head; stop_all; exit 0 ;;
  --status)  find_python || { err "Python 3.8+ requis"; exit 1; }
             show_status; exit 0 ;;
  --restart) find_python || { err "Python 3.8+ requis"; exit 1; }
             head; stop_all; ;;
esac

head

# --------------------------------------------------------------------------
# 1. Refuser root (règle d'or n°3)
# --------------------------------------------------------------------------
if [ "$(id -u)" = "0" ]; then
  err "Nercel refuse de tourner en root. Lance ce script avec ton utilisateur normal."
  exit 1
fi

# --------------------------------------------------------------------------
# 2. Trouver l'archive
# --------------------------------------------------------------------------
SRC=""
for d in "$HOME/Bureau" "$HOME/Desktop" "$HOME/Téléchargements" "$HOME/Downloads" "$HOME" "$PWD"; do
  if [ -f "$d/$ARCHIVE_NAME" ]; then
    SRC="$d/$ARCHIVE_NAME"
    break
  fi
done

if [ -z "$SRC" ]; then
  err "Archive '$ARCHIVE_NAME' introuvable."
  dim "Place-la dans ~/Bureau ou ~/Téléchargements, puis relance :"
  dim "  bash installer-nercel.sh"
  exit 1
fi
ok "Archive trouvée : $SRC ($(du -h "$SRC" | cut -f1))"

# --------------------------------------------------------------------------
# 3. Vérifier les prérequis
# --------------------------------------------------------------------------
command -v tar >/dev/null 2>&1 || { err "tar manquant (sudo apt install tar)"; exit 1; }
find_python || { err "Python 3.8+ requis (sudo apt install python3)"; exit 1; }
ok "Python : $($PY --version 2>&1)"

# --------------------------------------------------------------------------
# 4. Extraire vers ~/nercel
# --------------------------------------------------------------------------
mkdir -p "$INSTALL_DIR"
tar -xzf "$SRC" -C "$INSTALL_DIR"
chmod +x "$INSTALL_DIR"/nercel.py "$INSTALL_DIR"/nexusd.py "$INSTALL_DIR"/install.sh 2>/dev/null
ok "Extrait dans : $INSTALL_DIR"
dim "contenu : $(ls "$INSTALL_DIR" | tr '\n' ' ')"

# --------------------------------------------------------------------------
# 5. Arrêter une éventuelle instance déjà en marche (relance propre)
# --------------------------------------------------------------------------
if port_up "$ORCH_PORT" || port_up "$EDGE_PORT"; then
  info "Instance déjà en marche → relance propre…"
  stop_all
fi

# --------------------------------------------------------------------------
# 6. Démarrer orchestrateur + edge (nohup : survit à la fermeture du terminal)
# --------------------------------------------------------------------------
mkdir -p "$DATA_DIR/logs"
info "Démarrage de l'orchestrateur (port $ORCH_PORT)…"
nohup "$PY" "$INSTALL_DIR/nercel.py" >>"$DATA_DIR/nercel.log" 2>&1 &
echo $! > "$DATA_DIR/nercel.pid"
info "Démarrage du proxy edge NEXUS (port $EDGE_PORT)…"
nohup "$PY" "$INSTALL_DIR/nexusd.py" >>"$DATA_DIR/nexusd.log" 2>&1 &
echo $! > "$DATA_DIR/nexusd.pid"

# --------------------------------------------------------------------------
# 7. Vérifier que tout est en ligne
# --------------------------------------------------------------------------
ORCH_OK=0; EDGE_OK=0
for i in $(seq 1 15); do
  port_up "$ORCH_PORT" && ORCH_OK=1
  port_up "$EDGE_PORT" && EDGE_OK=1
  [ "$ORCH_OK" = "1" ] && [ "$EDGE_OK" = "1" ] && break
  sleep 1
done

if [ "$ORCH_OK" = "1" ] && [ "$EDGE_OK" = "1" ]; then
  cat <<EOF

 $(ok "Nercel est en ligne !")

  $(printf "%b" "${BOLD}Dashboard${NC}   :  http://127.0.0.1:$ORCH_PORT/")
  $(printf "%b" "${BOLD}Edge proxy${NC}  :  http://127.0.0.1:$EDGE_PORT/")
  $(printf "%b" "${BOLD}Données${NC}     :  $DATA_DIR  (deploy.db, logs, projets)")

 ${DIM}  Arrêter      :  bash $(basename "$0") --stop${NC}
 ${DIM}  État         :  bash $(basename "$0") --status${NC}
 ${DIM}  Logs serveur :  tail -f $DATA_DIR/nercel.log${NC}
EOF
  # Ouvrir le navigateur (best effort)
  if command -v xdg-open >/dev/null 2>&1; then
    ( sleep 0.5 && xdg-open "http://127.0.0.1:$ORCH_PORT/" >/dev/null 2>&1 ) &
  fi
else
  err "Un serveur n'a pas démarré. Dernières lignes des logs :"
  dim "--- nercel.log ---";  tail -5 "$DATA_DIR/nercel.log" 2>/dev/null | sed 's/^/  /'
  dim "--- nexusd.log ---"; tail -5 "$DATA_DIR/nexusd.log" 2>/dev/null | sed 's/^/  /'
  exit 1
fi
