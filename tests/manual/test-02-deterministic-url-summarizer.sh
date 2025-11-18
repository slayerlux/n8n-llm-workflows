#!/usr/bin/env bash
set -euo pipefail

# Simple helper for testing the Content Summarizer from URL webhook.
# Requirements:
#   - n8n running locally on http://localhost:5678
#   - jq installed for pretty-printing JSON
#
# You can override defaults via environment variables:
#   N8N_URL, WEBHOOK_PATH, MODEL

N8N_URL=${N8N_URL:-http://localhost:5678}
WEBHOOK_PATH=${WEBHOOK_PATH:-/webhook/summarize-url}
MODEL=${MODEL:-openai/gpt-oss-20b}

curl_json() {
  curl -s -X POST "${N8N_URL}${WEBHOOK_PATH}" \
    -H "Content-Type: application/json" \
    -d "$1" | jq .
}

# Example 1: HTML page
echo "=== Example 1: Summarize from URL (example.com HTML) ==="
BODY_HTML=$(cat <<'JSON'
{
  "url": "https://example.com/"
}
JSON
)
curl_json "${BODY_HTML}"

echo ""
echo "=== Example 2: Summarize from URL with title and language (JSON placeholder) ==="
BODY_JSON=$(cat <<JSON
{
  "url": "https://jsonplaceholder.typicode.com/posts/1",
  "title": "Sample JSON post",
  "language": "en",
  "model": "${MODEL}"
}
JSON
)
curl_json "${BODY_JSON}"
