#!/usr/bin/env bash
set -euo pipefail

# Simple helper for testing the Content Summarizer webhook.
# Requirements:
#   - n8n running locally on http://localhost:5678
#   - jq installed for pretty-printing JSON
#
# You can override defaults via environment variables:
#   N8N_URL, WEBHOOK_PATH, MODEL

N8N_URL=${N8N_URL:-http://localhost:5678}
WEBHOOK_PATH=${WEBHOOK_PATH:-/webhook/summarize}
MODEL=${MODEL:-openai/gpt-oss-20b}

curl_json() {
  curl -s -X POST "${N8N_URL}${WEBHOOK_PATH}" \
    -H "Content-Type: application/json" \
    -d "$1" | jq .
}

echo "=== Example 1: Minimal request ==="
BODY_MINIMAL=$(cat <<'JSON'
{
  "text": "Short description of a meeting or email that you want to summarize."
}
JSON
)
curl_json "${BODY_MINIMAL}"

echo ""
echo "=== Example 2: With metadata and language ==="
BODY_WITH_META=$(cat <<JSON
{
  "text": "Weekly sync about product roadmap, priorities, and blockers.",
  "title": "Product Team Weekly Sync",
  "source": "meeting",
  "language": "en",
  "model": "${MODEL}",
  "temperature": 0.2,
  "max_tokens": 400
}
JSON
)
curl_json "${BODY_WITH_META}"
