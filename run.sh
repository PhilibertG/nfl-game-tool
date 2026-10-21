#!/usr/bin/env bash
# One command to go from nothing to the running app:
#   1. create a Python virtual env and install dependencies
#   2. download the NFL tracking data (first run only)
#   3. run the analysis pipeline (writes web/data/data.json)
#   4. serve the web app on http://localhost:$PORT
#
# Options:  --no-build   skip step 3 and reuse the existing web/data/data.json
#           PORT=9000 ./run.sh   to change the port
set -euo pipefail
cd "$(dirname "$0")"

PORT="${PORT:-8000}"
DATA_REPO="https://github.com/ThompsonJamesBliss/nfl-big-data-bowl-regional-event-data.git"
PYTHON="${PYTHON:-python3}"

step() { printf '\n\033[1;32m==> %s\033[0m\n' "$1"; }

step "Python environment"
[ -d .venv ] || "$PYTHON" -m venv .venv
.venv/bin/pip install -q --disable-pip-version-check -r requirements.txt

if [ "${1:-}" != "--no-build" ]; then
  if [ ! -d raw_data/data/tracking ]; then
    step "Downloading the dataset (~1 GB, first run only)"
    git clone --depth 1 "$DATA_REPO" raw_data
  fi
  step "Running the analysis pipeline"
  .venv/bin/python -m pipeline
fi

URL="http://localhost:$PORT"
step "Web app ready at $URL  (Ctrl+C to stop)"
open_browser() {
  sleep 1
  if command -v xdg-open >/dev/null; then xdg-open "$URL"
  elif command -v open >/dev/null; then open "$URL"
  fi
}
[ -n "${NO_BROWSER:-}" ] || open_browser >/dev/null 2>&1 &
.venv/bin/python -m http.server "$PORT" --directory web
