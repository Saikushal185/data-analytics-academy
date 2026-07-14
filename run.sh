#!/usr/bin/env bash
# ──────────────────────────────────────────────
# run.sh — Start the Data Analytics Academy
# Usage:  ./run.sh          (runs server + client)
#         ./run.sh server   (server only)
#         ./run.sh client   (client only)
#         ./run.sh stop     (kill both)
# ──────────────────────────────────────────────
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
SERVER_PORT="${PORT:-3001}"
CLIENT_PORT=5173

red()   { printf '\033[0;31m%s\033[0m\n' "$*"; }
green() { printf '\033[0;32m%s\033[0m\n' "$*"; }
cyan()  { printf '\033[0;36m%s\033[0m\n' "$*"; }

kill_port() {
  local pids
  pids=$(lsof -t -i:"$1" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "$pids" | xargs kill -9 2>/dev/null || true
    echo "  Killed process(es) on port $1"
  fi
}

install_deps() {
  # Install root deps (if needed)
  if [ ! -d "$ROOT/node_modules" ]; then
    cyan "Installing root dependencies..."
    cd "$ROOT" && npm install
  fi
  # Install server deps
  if [ ! -d "$ROOT/server/node_modules" ]; then
    cyan "Installing server dependencies..."
    cd "$ROOT/server" && npm install
  fi
  # Install client deps
  if [ ! -d "$ROOT/client/node_modules" ]; then
    cyan "Installing client dependencies..."
    cd "$ROOT/client" && npm install
  fi
}

start_server() {
  cyan "Starting server on port $SERVER_PORT..."
  cd "$ROOT" && node server/index.js &
  SERVER_PID=$!
  sleep 1
  if kill -0 "$SERVER_PID" 2>/dev/null; then
    green "✓ Server running (PID $SERVER_PID) → http://localhost:$SERVER_PORT"
  else
    red "✗ Server failed to start. Check logs above."
    exit 1
  fi
}

start_client() {
  cyan "Starting client dev server..."
  cd "$ROOT/client" && npx vite --port "$CLIENT_PORT" &
  CLIENT_PID=$!
  sleep 2
  if kill -0 "$CLIENT_PID" 2>/dev/null; then
    green "✓ Client running (PID $CLIENT_PID) → http://localhost:$CLIENT_PORT"
  else
    red "✗ Client failed to start. Check logs above."
    exit 1
  fi
}

cleanup() {
  echo ""
  cyan "Shutting down..."
  kill_port "$SERVER_PORT"
  kill_port "$CLIENT_PORT"
  green "Done."
}

# ── Main ──────────────────────────────────────
case "${1:-all}" in
  stop)
    cyan "Stopping all services..."
    kill_port "$SERVER_PORT"
    kill_port "$CLIENT_PORT"
    green "All stopped."
    exit 0
    ;;
  server)
    kill_port "$SERVER_PORT"
    install_deps
    trap cleanup EXIT INT TERM
    start_server
    wait "$SERVER_PID"
    ;;
  client)
    kill_port "$CLIENT_PORT"
    install_deps
    trap cleanup EXIT INT TERM
    start_client
    wait "$CLIENT_PID"
    ;;
  all|"")
    kill_port "$SERVER_PORT"
    kill_port "$CLIENT_PORT"
    install_deps
    trap cleanup EXIT INT TERM

    echo ""
    green "════════════════════════════════════════"
    green "  Data Analytics Academy"
    green "════════════════════════════════════════"
    echo ""

    start_server
    start_client

    echo ""
    green "────────────────────────────────────────"
    green "  All services running!"
    green "  App:    http://localhost:$CLIENT_PORT"
    green "  API:    http://localhost:$SERVER_PORT"
    green "  Press Ctrl+C to stop everything."
    green "────────────────────────────────────────"
    echo ""

    wait
    ;;
  *)
    echo "Usage: $0 [server|client|stop|all]"
    exit 1
    ;;
esac
