#!/usr/bin/env bash
set -euo pipefail

# Helper for testing the AI Agent chat workflow triggered via Webhook.
# Requirements:
#   - n8n running locally on http://localhost:5678
#   - jq installed for pretty-printing JSON
#
# You can override defaults via environment variables:
#   N8N_URL, WEBHOOK_PATH

N8N_URL=${N8N_URL:-http://localhost:5678}
WEBHOOK_PATH=${WEBHOOK_PATH:-/webhook/agent-chat}

curl -s -X POST "${N8N_URL}${WEBHOOK_PATH}" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Hello from curl. Briefly introduce yourself and say that you are running via the n8n AI Agent chat workflow."
  }' | jq .
