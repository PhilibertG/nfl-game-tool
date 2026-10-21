#!/usr/bin/env bash
# One command to go from nothing to the running app:
#   1. Python virtual env + dependencies (pandas, numpy, scikit-learn)
#   2. download the NFL tracking data (first run only)
#   3. run the analysis pipeline (writes web/public/data/data.json)
#   4. install and build the web app (React + Tailwind + shadcn/ui)
#   5. serve it on http://localhost:$PORT
#
# Options:  --no-build   skip steps 1-3 and reuse the committed web/public/data/data.json
#           PORT=9000 ./run.sh       change the port
#           NO_BROWSER=1 ./run.sh    do not open the browser
# Needs: python3 >= 3.10, git, node >= 18.
set -euo pipefail
cd "$(dirname "$0")"

PORT="${PORT:-8000}"
DATA_REPO="https://github.com/ThompsonJamesBliss/nfl-big-data-bowl-regional-event-data.git"
PYTHON="${PYTHON:-python3}"

step() { printf '\n\033[1;32m==> %s\033[0m\n' "$1"; }

if [ "${1:-}" != "--no-build" ]; then
  step "Python environment"
  [ -d .venv ] || "$PYTHON" -m venv .venv
  .venv/bin/pip install -q --disable-pip-version-check -r requirements.txt

  if [ ! -d raw_data/data/tracking ]; then
    step "Downloading the dataset (~1 GB, first run only)"
    git clone --depth 1 "$DATA_REPO" raw_data
  fi

  step "Running the analysis pipeline"
  .venv/bin/python -m pipeline
fi

step "Building the web app"
command -v npm >/dev/null || { echo "npm not found: install Node.js >= 18"; exit 1; }
[ -d web/node_modules ] || npm --prefix web ci --no-fund --no-audit
npm --prefix web run build --silent

URL="http://localhost:$PORT"
step "Web app ready at $URL  (Ctrl+C to stop)"
open_browser() {
  sleep 2
  if command -v xdg-open >/dev/null; then xdg-open "$URL"
  elif command -v open >/dev/null; then open "$URL"
  fi
}
[ -n "${NO_BROWSER:-}" ] || open_browser >/dev/null 2>&1 &
npm --prefix web run preview --silent -- --port "$PORT" --strictPort
