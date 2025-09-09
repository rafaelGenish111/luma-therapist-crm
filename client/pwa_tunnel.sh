#!/usr/bin/env bash
set -euo pipefail

# ===== Settings you can tweak =====
PREVIEW_PORT="${PREVIEW_PORT:-4173}"     # פורט של vite preview
TUNNEL_TOOL="${TUNNEL_TOOL:-cloudflared}" # cloudflared | ngrok
PREVIEW_CMD="${PREVIEW_CMD:-npm run preview}" # אם שינית סקריפט, עדכן כאן
# ==================================

echo "▶ Building production assets…"
npm run build

echo "▶ Starting Vite preview on port ${PREVIEW_PORT}…"
# נרים את הפריוויו ברקע
# אם יש לך preview קבוע על פורט אחר, אפשר: npm run preview -- --port ${PREVIEW_PORT}
${PREVIEW_CMD} -- --port "${PREVIEW_PORT}" >/tmp/vite_preview.log 2>&1 &

PREVIEW_PID=$!
cleanup() {
  echo ""
  echo "⏹ Stopping preview (PID ${PREVIEW_PID})…"
  kill "${PREVIEW_PID}" >/dev/null 2>&1 || true
}
trap cleanup EXIT

# קטן: מחכים שהפורט ייפתח
echo -n "⏳ Waiting for preview to be reachable"
for i in {1..30}; do
  if curl -s -o /dev/null "http://127.0.0.1:${PREVIEW_PORT}"; then
    echo " ✓"
    break
  fi
  echo -n "."
  sleep 0.5
done

start_cloudflared() {
  if ! command -v cloudflared >/dev/null 2>&1; then
    echo "❌ cloudflared not found. Install: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation"
    exit 1
  fi
  echo "▶ Opening Cloudflare Tunnel to http://127.0.0.1:${PREVIEW_PORT} …"
  # נפעיל את הטאנל ונחטוף את ה-URL מהלוגים
  cloudflared tunnel --url "http://127.0.0.1:${PREVIEW_PORT}" 2>&1 | awk '
    /trycloudflare\.com/ {
      for(i=1;i<=NF;i++){
        if ($i ~ /^https:\/\/.*trycloudflare\.com/) {
          url=$i
          gsub(/\x1b\[[0-9;]*m/, "", url) # remove ANSI colors if any
          print "🔗 Public HTTPS URL:", url
          print "📱 Open this on your phone to install the PWA."
          print "   (Chrome Android: ⋮ → Install app | iOS Safari: Share → Add to Home Screen)"
          print ""
        }
      }
    }
    { print }
  '
}

start_ngrok() {
  if ! command -v ngrok >/dev/null 2>&1; then
    echo "❌ ngrok not found. Install: https://ngrok.com/download"
    exit 1
  fi
  echo "▶ Opening ngrok Tunnel to http://127.0.0.1:${PREVIEW_PORT} …"
  # --log=stdout מאפשר לנו לתפוס את ה-URL מהפלט
  ngrok http "${PREVIEW_PORT}" --log=stdout 2>&1 | awk '
    /url=https:\/\// && /lvl=info/ && /msg="started tunnel"/ {
      for(i=1;i<=NF;i++){
        if ($i ~ /^url=https:\/\//) {
          split($i, a, "="); url=a[2]
          print "🔗 Public HTTPS URL:", url
          print "📱 Open this on your phone to install the PWA."
          print "   (Chrome Android: ⋮ → Install app | iOS Safari: Share → Add to Home Screen)"
          print ""
        }
      }
    }
    { print }
  '
}

echo "▶ Tunnel tool: ${TUNNEL_TOOL}"
case "${TUNNEL_TOOL}" in
  cloudflared) start_cloudflared ;;
  ngrok) start_ngrok ;;
  *)
    echo "❌ Unknown TUNNEL_TOOL='${TUNNEL_TOOL}'. Use 'cloudflared' or 'ngrok'."
    exit 1
    ;;
esac
