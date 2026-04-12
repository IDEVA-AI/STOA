#!/bin/bash
# yt2bunny — Download YouTube video and upload to Bunny.net Stream
# Usage: ./scripts/yt2bunny.sh <youtube-url> [block-id]
#
# If block-id is provided, updates the lesson block in production DB automatically.
#
# Env vars (set in .env or export):
#   BUNNY_API_KEY      — Bunny.net API key
#   BUNNY_LIBRARY_ID   — Bunny Stream library ID

set -euo pipefail

# ── Config ──
BUNNY_API="https://video.bunnycdn.com"
BUNNY_API_KEY="${BUNNY_API_KEY:-3af9df65-6f4f-492e-85671c457204-7972-4890}"
BUNNY_LIBRARY_ID="${BUNNY_LIBRARY_ID:-624525}"
SERVER="deploy@178.156.252.78"

# ── Args ──
URL="${1:-}"
BLOCK_ID="${2:-}"

if [ -z "$URL" ]; then
  echo "Usage: $0 <youtube-url> [block-id]"
  echo ""
  echo "Examples:"
  echo "  $0 https://www.youtube.com/watch?v=pSJz4DzvbFI"
  echo "  $0 https://www.youtube.com/watch?v=pSJz4DzvbFI 107"
  exit 1
fi

# Extract video ID (macOS compatible)
VIDEO_ID=$(echo "$URL" | sed -n 's/.*[?&]v=\([a-zA-Z0-9_-]\{11\}\).*/\1/p')
if [ -z "$VIDEO_ID" ]; then
  VIDEO_ID=$(echo "$URL" | sed -n 's/.*youtu\.be\/\([a-zA-Z0-9_-]\{11\}\).*/\1/p')
fi

if [ -z "$VIDEO_ID" ]; then
  echo "ERROR: Could not extract YouTube video ID from URL"
  exit 1
fi

echo "==> Video ID: $VIDEO_ID"

# ── Step 1: Download ──
TMPFILE="/tmp/yt2bunny-${VIDEO_ID}.mp4"
echo ""
echo "==> Downloading from YouTube..."
yt-dlp \
  -f "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best" \
  --merge-output-format mp4 \
  --newline \
  -o "$TMPFILE" \
  "$URL"

if [ ! -f "$TMPFILE" ]; then
  echo "ERROR: Download failed — file not found"
  exit 1
fi

FILESIZE=$(stat -f%z "$TMPFILE" 2>/dev/null || stat --format=%s "$TMPFILE" 2>/dev/null)
echo "==> Downloaded: $(echo "scale=1; $FILESIZE / 1048576" | bc)MB"

# ── Step 2: Create video on Bunny Stream ──
echo ""
echo "==> Creating video on Bunny Stream..."
CREATE_RESPONSE=$(curl -s -X POST \
  "${BUNNY_API}/library/${BUNNY_LIBRARY_ID}/videos" \
  -H "AccessKey: ${BUNNY_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"title\": \"youtube-${VIDEO_ID}\"}")

GUID=$(echo "$CREATE_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['guid'])" 2>/dev/null)

if [ -z "$GUID" ]; then
  echo "ERROR: Failed to create video on Bunny"
  echo "Response: $CREATE_RESPONSE"
  rm -f "$TMPFILE"
  exit 1
fi

echo "==> Bunny GUID: $GUID"

# ── Step 3: Upload to Bunny Stream ──
echo ""
echo "==> Uploading to Bunny Stream..."
UPLOAD_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT \
  "${BUNNY_API}/library/${BUNNY_LIBRARY_ID}/videos/${GUID}" \
  -H "AccessKey: ${BUNNY_API_KEY}" \
  -H "Content-Type: application/octet-stream" \
  --data-binary "@${TMPFILE}")

HTTP_CODE=$(echo "$UPLOAD_RESPONSE" | tail -1)

if [ "$HTTP_CODE" != "200" ]; then
  echo "ERROR: Upload failed (HTTP $HTTP_CODE)"
  echo "$UPLOAD_RESPONSE"
  rm -f "$TMPFILE"
  exit 1
fi

echo "==> Upload complete!"

# ── Step 4: Cleanup ──
rm -f "$TMPFILE"

# ── Result ──
PLAYER_URL="https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${GUID}"

echo ""
echo "========================================="
echo "  DONE!"
echo "========================================="
echo ""
echo "  Player URL (embed):"
echo "  $PLAYER_URL"
echo ""
echo "  YouTube ID: $VIDEO_ID"
echo "  Bunny GUID: $GUID"
echo ""

# ── Step 5: Update DB if block-id provided ──
if [ -n "$BLOCK_ID" ]; then
  echo "==> Updating block $BLOCK_ID in production DB..."
  ssh "$SERVER" "docker exec \$(docker ps -q -f name=nexo_stoa) node -e \"
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    pool.query('SELECT content FROM lesson_blocks WHERE id = \$1', [${BLOCK_ID}]).then(async r => {
      if (!r.rows[0]) { console.log('Block not found'); pool.end(); return; }
      const content = typeof r.rows[0].content === 'string' ? JSON.parse(r.rows[0].content) : r.rows[0].content;
      content.url = '${PLAYER_URL}';
      content.youtube_url = '${URL}';
      content.bunny_video_id = '${GUID}';
      content.import_status = 'completed';
      content.import_error = null;
      await pool.query('UPDATE lesson_blocks SET content = \$1 WHERE id = \$2', [JSON.stringify(content), ${BLOCK_ID}]);
      console.log('OK: Block ${BLOCK_ID} updated');
      pool.end();
    });
  \""
  echo ""
fi

echo "  Cola essa URL no bloco de video do STOA."
