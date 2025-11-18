#!/usr/bin/env bash
set -euo pipefail

# Helper for testing the Content Q&A from URL webhook.
# Requirements:
#   - n8n running locally on http://localhost:5678
#   - jq installed for pretty-printing JSON
#
# You can override defaults via environment variables:
#   N8N_URL, WEBHOOK_PATH, MODEL

N8N_URL=${N8N_URL:-http://localhost:5678}
WEBHOOK_PATH=${WEBHOOK_PATH:-/webhook/question-url}
MODEL=${MODEL:-openai/gpt-oss-20b}

curl_json() {
  curl -s -X POST "${N8N_URL}${WEBHOOK_PATH}" \
    -H "Content-Type: application/json" \
    -d "$1" | jq .
}

echo "=== Example: Ask a question about a URL ==="
BODY_QNA=$(cat <<JSON
{
  "url": "https://example.com/",
  "question": "What is this site for?",
  "language": "en",
  "model": "${MODEL}"
}
JSON
)
curl_json "${BODY_QNA}"

