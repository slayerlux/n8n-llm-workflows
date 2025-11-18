#!/usr/bin/env bash
set -euo pipefail

# Helper for testing the Agent URL Tools workflow (AI Agent with HTTP tool).
# Requirements:
#   - n8n running locally on http://localhost:5678
#   - jq installed for pretty-printing JSON
#
# You can override defaults via environment variables:
#   N8N_URL, WEBHOOK_PATH

N8N_URL=${N8N_URL:-http://localhost:5678}
WEBHOOK_PATH=${WEBHOOK_PATH:-/webhook/agent-url-tools}

curl_json() {
  curl -s -X POST "${N8N_URL}${WEBHOOK_PATH}" \
    -H "Content-Type: application/json" \
    -d "$1" | jq .
}

echo "=== Example: Ask a question about a URL (Agent decides when to fetch) ==="
BODY_AGENT=$(cat <<'JSON'
{
  "url": "https://example.com/",
  "question": "What is this site about?"
}
JSON
)
curl_json "${BODY_AGENT}"

