#!/usr/bin/env bash
# PC-to-VPS TradingView CDP Bridge Supervisor for Linux/macOS
# Maintains reverse SSH tunnel: VPS 127.0.0.1:9333 -> PC 127.0.0.1:9333

set -euo pipefail

VPS_HOST="${TDV_VPS_HOST:-${1:-}}"
VPS_USER="${TDV_VPS_USER:-${2:-}}"
VPS_PORT="${TDV_VPS_SSH_PORT:-22}"
IDENTITY_FILE="${TDV_VPS_SSH_KEY:-}"
LOCAL_PORT="${LOCAL_CDP_PORT:-9333}"
REMOTE_PORT="${REMOTE_CDP_PORT:-9333}"

if [ -z "$VPS_HOST" ]; then
  echo "Error: VPS host required. Set TDV_VPS_HOST or pass as first argument." >&2
  exit 1
fi

DESTINATION="$VPS_HOST"
if [ -n "$VPS_USER" ]; then
  DESTINATION="${VPS_USER}@${VPS_HOST}"
fi

SSH_ARGS=(
  -N
  -T
  -R "127.0.0.1:${REMOTE_PORT}:127.0.0.1:${LOCAL_PORT}"
  -p "$VPS_PORT"
  -o "ServerAliveInterval=15"
  -o "ServerAliveCountMax=3"
  -o "ExitOnForwardFailure=yes"
  -o "StrictHostKeyChecking=accept-new"
)

if [ -n "$IDENTITY_FILE" ] && [ -f "$IDENTITY_FILE" ]; then
  SSH_ARGS+=(-i "$IDENTITY_FILE")
fi

SSH_ARGS+=("$DESTINATION")

DELAY=3
while true; do
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [CDP-BRIDGE] Connecting to $DESTINATION (VPS 127.0.0.1:${REMOTE_PORT} -> PC 127.0.0.1:${LOCAL_PORT})..."
  ssh "${SSH_ARGS[@]}" || true
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [CDP-BRIDGE] Connection dropped. Reconnecting in ${DELAY}s..."
  sleep "$DELAY"
  DELAY=$(( DELAY < 30 ? DELAY * 2 : 30 ))
done
