# n8n LLM Workflows

![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

TypeScript toolkit for managing, testing, and deploying [n8n](https://n8n.io) workflows at scale. Includes a collection of 5 example workflows for LLM automation (summarization, Q&A, chat) and a typed client for bulk workflow operations. Compatible with any OpenAI-compatible API backend.

---

## Table of Contents

- [Workflows](#workflows)
- [Setup](#setup)
- [Usage](#usage)
- [Requirements](#requirements)
- [Testing](#testing)
- [Tooling](#tooling)
- [Authentication](#authentication)
- [License](#license)

---

## Workflows

Workflows are stored as **JSON files** in the `workflows/` directory. Each workflow contains a Webhook node that exposes an HTTP endpoint. The TypeScript tooling imports these JSON files into n8n and manages them in bulk.

**Example Workflows:**

| #   | Workflow            | Endpoint                        | Required Fields   | Key Nodes                                                                    |
| --- | ------------------- | ------------------------------- | ----------------- | ---------------------------------------------------------------------------- |
| 01  | **Text Summarizer** | `POST /webhook/summarize`       | `text`            | Webhook → Function → HTTP Request → Function → Set                           |
| 02  | **URL Summarizer**  | `POST /webhook/summarize-url`   | `url`             | Webhook → Function → HTTP Request → Function → HTTP Request → Function → Set |
| 03  | **URL Q&A**         | `POST /webhook/question-url`    | `url`, `question` | Webhook → Function → HTTP Request → Function → HTTP Request → Function → Set |
| 04  | **Agent Chat**      | `POST /webhook/agent-chat`      | `input`           | Webhook → Agent Node → OpenAI Model → Set                                    |
| 05  | **Agent URL Tools** | `POST /webhook/agent-url-tools` | `url`, `question` | Webhook → Function → HTTP Request → Function → Agent Node → Set              |

**Workflow types:**

- **01-03**: Deterministic LLM workflows (Function nodes for request building, HTTP Request for LLM calls)
- **04-05**: Agentic workflows (n8n Agent node with OpenAI Chat Model)

**How it works:**

- **Workflow files**: JSON files in `workflows/` directory (e.g., `01-deterministic-text-summarizer.json`)
- **Webhook nodes**: Each workflow contains a Webhook node that creates an HTTP endpoint (e.g., `/webhook/summarize`)
- **Deployment**: The TypeScript tooling reads JSON files and imports them into n8n via API
- **Bulk management**: Import, activate, and test multiple workflows at once

**Adding your own workflows:**

1. Export workflow JSON from n8n (or create manually)
2. Place it in the `workflows/` directory
3. Run `pnpm run workflows:import` to deploy to n8n
4. Use `pnpm run workflows:activate` to activate in bulk

---

## Setup

### 1. Start n8n

```bash
docker compose up -d
```

Open `http://localhost:5678` in your browser.

### 2. Create Admin Account

On first launch, n8n will prompt you to create an admin account:

- Enter your email and password
- Complete the setup wizard

**Note:** For local installations, API keys are available by default. For cloud instances, API access requires a paid plan.

### 3. Create API Key

1. In n8n, go to **Settings** (gear icon) → **n8n API**
2. Click **Create API Key**
3. Enter a label (e.g., "CLI Tools")
4. Set expiration (optional)
5. Click **Create** and **copy the key** (it won't be shown again)

**Alternative:** You can also use session cookie authentication (see [Authentication](#authentication) section).

**Documentation:** [n8n API Authentication](https://docs.n8n.io/api/authentication/)

### 4. Install Dependencies and Import Workflows

```bash
pnpm install
cp env.example .env
```

Add your API key to `.env`:

```bash
N8N_API_KEY=your-api-key-here
```

Import and activate workflows:

```bash
pnpm run workflows:setup
```

### 5. Configure LLM Backend

Edit `docker-compose.yml`:

```yaml
environment:
  - OPENAI_API_BASE=http://host.docker.internal:1234/v1 # LM Studio default
  - OPENAI_API_KEY=lm-studio
  - OPENAI_MODEL=openai/gpt-oss-20b
```

For other providers (OpenAI, OpenRouter, etc.), update these values and restart:

```bash
docker compose restart
```

**Documentation:** [n8n Docker Setup](https://docs.n8n.io/hosting/installation/docker/)

---

## Usage

### Example: Text Summarization

```bash
curl -X POST http://localhost:5678/webhook/summarize \
  -H "Content-Type: application/json" \
  -d '{"text": "Your text here", "language": "en"}'
```

**Response:**

```json
{
  "prompt_tokens": 158,
  "completion_tokens": 159,
  "total_tokens": 317,
  "summary": "AI is rapidly reshaping a wide range of sectors...",
  "raw_choice": "<|channel|>analysis<|message|>Need to summarize...",
  "model": "openai/gpt-oss-20b",
  "endpoint": "http://host.docker.internal:1234/v1/completions"
}
```

### Example: URL Q&A

```bash
curl -X POST http://localhost:5678/webhook/question-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "question": "What is the purpose of this site?", "language": "en"}'
```

**Response:**

```json
{
  "summary": "The example domain serves purely as a placeholder used in technical documentation...",
  "raw_choice": "<|channel|>analysis<|message|>Need answer...",
  "model": "openai/gpt-oss-20b",
  "endpoint": "http://host.docker.internal:1234/v1/completions",
  "prompt_tokens": 176,
  "completion_tokens": 122,
  "total_tokens": 298
}
```

### Example: Agent Chat

```bash
curl -X POST http://localhost:5678/webhook/agent-chat \
  -H "Content-Type: application/json" \
  -d '{"input": "Hello! Introduce yourself."}'
```

**Response:**

```json
{
  "answer": "Hey there! I'm ChatGPT—an AI language model built by OpenAI..."
}
```

### TypeScript Example

```typescript
import axios from 'axios';

const { data } = await axios.post('http://localhost:5678/webhook/summarize', {
  text: 'Your text here',
  language: 'en',
});

console.log(data.summary);
```

**Response fields:**

- `summary` / `answer` - Human-readable output
- `raw_choice` - Raw LLM response (debugging)
- `model`, `endpoint` - Resolved model and API endpoint
- `*_tokens` - Token usage metrics

---

## Requirements

- **Docker** and Docker Compose
- **Node.js** ≥ 20.0.0
- **pnpm** ≥ 8.0.0
- **OpenAI-compatible LLM endpoint** (LM Studio, OpenAI, OpenRouter, etc.)
- **n8n** (provided via docker-compose.yml)

---

## Testing

```bash
pnpm test  # Automated tests
```

Manual test scripts are in `tests/manual/`.

---

## Tooling

This toolkit provides **bulk workflow management** capabilities:

- **Import/update workflows** from `workflows/` directory (idempotent)
- **Activate/deactivate workflows** in bulk
- **Generate sample responses** to `tests/output/samples/` for testing
- **Automated testing** of all workflow endpoints
- **TypeScript client** for programmatic workflow management

### CLI Scripts

```bash
pnpm run workflows:setup    # Import and activate all workflows from workflows/
pnpm run workflows:import   # Import/update all workflows (idempotent)
pnpm run workflows:activate # Activate all project workflows in bulk
pnpm run workflows:sample   # Generate sample responses to tests/output/samples/
pnpm run check              # Type check, lint, format validation
pnpm run test               # Run automated tests for all workflows
```

### TypeScript Client

```typescript
import { createClient } from './src/cli-utils.js';

const client = createClient(); // Loads config from env vars

// Bulk operations
await client.importAllWorkflows();
await client.activateProjectWorkflows();

// Individual workflow
await client.importOrUpdateWorkflow(
  'workflows/01-deterministic-text-summarizer.json',
  '01 - Text Summarizer (Deterministic LLM)'
);
```

For custom configuration, use `new N8nClient({ baseUrl, apiKey })` directly. See `src/n8n-client.ts` for API reference.

---

## Authentication

For automation scripts, set either:

```bash
export N8N_API_KEY=your-api-key-here
# or
export N8N_SESSION_COOKIE="n8n-auth-token=your-token-here"
```

**Getting session cookie:**

1. Log into n8n in your browser
2. Open browser DevTools → Application/Storage → Cookies
3. Copy the `n8n-auth-token` value
4. Use format: `n8n-auth-token=<value>`

**Documentation:** [n8n API Authentication](https://docs.n8n.io/api/authentication/)

---

## License

MIT
