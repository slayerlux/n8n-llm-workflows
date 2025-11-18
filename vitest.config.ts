import dotenv from 'dotenv';
import { defineConfig } from 'vitest/config';

// Load environment variables from .env so Vitest-based tests
// can access N8N_URL, N8N_API_KEY, OPENAI_* and others.
dotenv.config();

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 120000, // 2 minutes for LLM responses
    hookTimeout: 30000,
    teardownTimeout: 10000,
  },
});
