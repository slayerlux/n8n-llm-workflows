#!/usr/bin/env tsx

import fs from 'node:fs';
import path from 'node:path';
import axios from 'axios';
import dotenv from 'dotenv';
import { loadConfig } from '../src/config.js';

dotenv.config();

interface SampleTarget {
  name: string;
  endpoint: string;
  payload: Record<string, unknown>;
}

const config = loadConfig();
const N8N_URL = config.baseUrl;

function createAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (config.apiKey) {
    headers['X-N8N-API-KEY'] = config.apiKey;
  }

  if (config.sessionCookie) {
    headers['Cookie'] = config.sessionCookie;
  }

  return headers;
}

const headers = createAuthHeaders();

const SAMPLE_DIR = path.resolve('tests/output/samples');

const SAMPLE_TARGETS: SampleTarget[] = [
  {
    name: '01-deterministic-text-summarizer',
    endpoint: '/webhook/summarize',
    payload: {
      text: 'This is a test text about AI transforming industries. Include multiple sentences so the summary has content.',
      title: 'AI Impact',
      language: 'en',
    },
  },
  {
    name: '02-deterministic-url-summarizer',
    endpoint: '/webhook/summarize-url',
    payload: {
      url: 'https://example.com/',
      language: 'en',
    },
  },
  {
    name: '03-deterministic-url-qna',
    endpoint: '/webhook/question-url',
    payload: {
      url: 'https://example.com/',
      question: 'What is the purpose of this site?',
      language: 'en',
    },
  },
  {
    name: '04-agentic-chat',
    endpoint: '/webhook/agent-chat',
    payload: {
      input: 'Hello! Introduce yourself.',
    },
  },
  {
    name: '05-agentic-url-tools',
    endpoint: '/webhook/agent-url-tools',
    payload: {
      url: 'https://example.com/',
      question: 'Summarize this website.',
    },
  },
];

async function main(): Promise<void> {
  if (!fs.existsSync(SAMPLE_DIR)) {
    fs.mkdirSync(SAMPLE_DIR, { recursive: true });
  }

  for (const target of SAMPLE_TARGETS) {
    const url = `${N8N_URL}${target.endpoint}`;
    const outputPath = path.join(SAMPLE_DIR, `${target.name}-${Date.now()}.json`);

    process.stdout.write(`↻ ${target.name} → ${url} ... `);
    try {
      const response = await axios.post(url, target.payload, {
        headers,
        timeout: 60000,
        validateStatus: () => true,
      });

      const record = {
        metadata: {
          name: target.name,
          endpoint: target.endpoint,
          status: response.status,
          timestamp: new Date().toISOString(),
        },
        request: target.payload,
        response: response.data as unknown,
      };

      fs.writeFileSync(outputPath, JSON.stringify(record, null, 2), 'utf8');
      process.stdout.write(`saved → ${outputPath}\n`);
    } catch (error) {
      process.stdout.write('failed\n');
      console.error(`   Error sampling ${target.name}:`, error);
    }
  }

  console.log('\n✅ Sampling complete. See tests/output/samples for payloads.');
}

main().catch((error) => {
  console.error('Sampling failed:', error);
  process.exit(1);
});
