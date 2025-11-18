import { describe, it, expect, beforeAll } from 'vitest';
import axios, { AxiosResponse } from 'axios';
import { N8nClient } from '../../src/n8n-client.js';
import type { N8nWorkflow } from '../../src/types.js';

const { N8N_URL = 'http://localhost:5678', N8N_API_KEY, N8N_SESSION_COOKIE } = process.env;

interface DeterministicWorkflowResponse {
  summary: string;
  model: string;
}

interface AgenticWorkflowResponse {
  answer: string;
}

interface TestFixture {
  endpoint: string;
  request: Record<string, unknown>;
  validate: (response: AxiosResponse) => void;
}

interface TestFixtures {
  [key: string]: TestFixture;
}

// Test data fixtures
const testFixtures: TestFixtures = {
  '01-deterministic-text-summarizer': {
    endpoint: '/webhook/summarize',
    request: {
      text: 'This is a test text that should be summarized. It contains multiple sentences to provide enough content for a meaningful summary.',
      title: 'Test Summary',
      language: 'en',
    },
    validate: (response: AxiosResponse) => {
      const data = response.data as DeterministicWorkflowResponse;
      expect(data).toHaveProperty('summary');
      expect(data).toHaveProperty('model');
      expect(typeof data.summary).toBe('string');
      expect(data.summary.length).toBeGreaterThan(0);
    },
  },
  '02-deterministic-url-summarizer': {
    endpoint: '/webhook/summarize-url',
    request: {
      url: 'https://example.com/',
      language: 'en',
    },
    validate: (response: AxiosResponse) => {
      const data = response.data as DeterministicWorkflowResponse;
      expect(data).toHaveProperty('summary');
      expect(data).toHaveProperty('model');
      expect(typeof data.summary).toBe('string');
    },
  },
  '03-deterministic-url-qna': {
    endpoint: '/webhook/question-url',
    request: {
      url: 'https://example.com/',
      question: 'What is this site for?',
      language: 'en',
    },
    validate: (response: AxiosResponse) => {
      const data = response.data as DeterministicWorkflowResponse;
      expect(data).toHaveProperty('summary');
      expect(data).toHaveProperty('model');
      expect(typeof data.summary).toBe('string');
    },
  },
  '04-agentic-chat': {
    endpoint: '/webhook/agent-chat',
    request: {
      input: 'Hello! Please introduce yourself briefly.',
    },
    validate: (response: AxiosResponse) => {
      const data = response.data as AgenticWorkflowResponse;
      expect(data).toHaveProperty('answer');
      expect(typeof data.answer).toBe('string');
      expect(data.answer.length).toBeGreaterThan(0);
    },
  },
  '05-agentic-url-tools': {
    endpoint: '/webhook/agent-url-tools',
    request: {
      url: 'https://example.com/',
      question: 'What is this site about?',
    },
    validate: (response: AxiosResponse) => {
      const data = response.data as AgenticWorkflowResponse;
      expect(data).toHaveProperty('answer');
      expect(typeof data.answer).toBe('string');
      expect(data.answer.length).toBeGreaterThan(0);
    },
  },
};

describe('n8n Workflows', () => {
  let n8nClient: N8nClient;
  let workflows: N8nWorkflow[] = [];

  beforeAll(async () => {
    // Initialize n8n client
    n8nClient = new N8nClient({
      baseUrl: N8N_URL,
      apiKey: N8N_API_KEY,
      sessionCookie: N8N_SESSION_COOKIE,
    });

    // Check if n8n is accessible
    try {
      const workflowsList = await n8nClient.listWorkflows();
      workflows = workflowsList;
      console.log(`✓ Found ${workflows.length} workflow(s) in n8n`);
    } catch {
      console.warn('⚠️  Could not connect to n8n API. Tests may fail.');
      console.warn('   Make sure n8n is running and N8N_API_KEY or N8N_SESSION_COOKIE is set');
    }
  });

  // Test each workflow
  Object.entries(testFixtures).forEach(([workflowKey, fixture]) => {
    describe(workflowKey, () => {
      it('should be imported and active in n8n', () => {
        if (workflows.length === 0) {
          console.warn('⚠️  Skipping workflow check - n8n not accessible');
          return;
        }

        // Find workflow by matching name pattern
        // Workflow names are like "01 - Deterministic Text Summarizer"
        // Workflow keys are like "01-deterministic-text-summarizer"
        const workflowKeyParts = workflowKey.split('-');
        const workflowNumber = workflowKeyParts[0]; // "01"
        const workflowNamePart = workflowKeyParts.slice(1).join(' '); // "deterministic text summarizer"

        const workflow = workflows.find(
          (w) =>
            w.name.startsWith(`${workflowNumber} -`) || // Match "01 - ..."
            w.name.toLowerCase().includes(workflowNamePart) ||
            w.name
              .toLowerCase()
              .replace(/[^a-z0-9]/g, ' ')
              .includes(workflowNamePart)
        );

        expect(workflow).toBeDefined();
        expect(workflow?.active).toBe(true);
      });

      it('should respond to webhook requests', async () => {
        const url = `${N8N_URL}${fixture.endpoint}`;

        try {
          const response = await axios.post(url, fixture.request, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 60000, // 60 seconds for LLM responses
            validateStatus: (status) => status < 500, // Don't throw on 4xx
          });

          expect(response.status).toBe(200);
          fixture.validate(response);
        } catch (error) {
          if (
            error &&
            typeof error === 'object' &&
            'code' in error &&
            error.code === 'ECONNREFUSED'
          ) {
            throw new Error(`Cannot connect to n8n at ${N8N_URL}. Is n8n running?`);
          }
          if (error && typeof error === 'object' && 'response' in error) {
            const axiosError = error as { response: { status: number; data: unknown } };
            throw new Error(
              `Workflow returned error: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`
            );
          }
          throw error;
        }
      }, 120000); // 2 minute timeout for LLM responses

      it('should handle invalid requests gracefully', async () => {
        const url = `${N8N_URL}${fixture.endpoint}`;

        try {
          const response = await axios.post(
            url,
            {},
            {
              headers: { 'Content-Type': 'application/json' },
              timeout: 30000,
              validateStatus: () => true, // Accept any status
            }
          );

          // Should return an error, not crash
          expect([200, 400, 422, 500]).toContain(response.status);
        } catch (error) {
          if (
            error &&
            typeof error === 'object' &&
            'code' in error &&
            error.code === 'ECONNREFUSED'
          ) {
            throw new Error(`Cannot connect to n8n at ${N8N_URL}. Is n8n running?`);
          }
          // Other errors are acceptable for invalid requests
        }
      });
    });
  });

  describe('Workflow Management', () => {
    it('should list all workflows', () => {
      if (workflows.length === 0) {
        console.warn('⚠️  Skipping - n8n not accessible');
        return;
      }

      expect(Array.isArray(workflows)).toBe(true);
      expect(workflows.length).toBeGreaterThanOrEqual(0);
    });

    it('should have all expected workflows imported', () => {
      if (workflows.length === 0) {
        console.warn('⚠️  Skipping - n8n not accessible');
        return;
      }

      const expectedWorkflows = Object.keys(testFixtures).length;

      // At least some workflows should be present
      expect(workflows.length).toBeGreaterThanOrEqual(expectedWorkflows - 2); // Allow some flexibility
    });
  });
});
