#!/usr/bin/env bash
# Restart the HARNESS dev server (port 3100) and nothing else. Lives in its own
# file so the pkill pattern cannot match the shell that invokes it. The pattern
# names the harness config, so a normal `yarn start` on 3000 — someone signed
# in to staging — is never touched.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
PORT="${PROFOLIO_PORT:-3100}"
pkill -f "harness.vite.config.mjs" 2>/dev/null
sleep 1
cd "$HERE/.." || exit 1
( KEEP_SERVER=1 node -e "import('./harness/serve.mjs').then(async (m) => { await m.serve(); setInterval(() => {}, 1 << 30); })" > "$HERE/vite.log" 2>&1 & )
for i in $(seq 1 120); do
  sleep 1
  if curl -s -o /dev/null --max-time 2 "http://127.0.0.1:$PORT/"; then echo "harness vite up after ${i}s"; exit 0; fi
done
echo "harness vite did not come up:"; tail -20 "$HERE/vite.log"; exit 1
