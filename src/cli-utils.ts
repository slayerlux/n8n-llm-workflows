import dotenv from 'dotenv';
import { loadConfig } from './config.js';
import { N8nClient } from './n8n-client.js';
import type { WorkflowActivationResult, WorkflowImportResult } from './types.js';
import { WORKFLOW_STATUS } from './constants.js';
import { extractErrorMessage, formatAxiosError, isAxiosError } from './utils/error-handling.js';

dotenv.config();

export function createClient(): N8nClient {
  const config = loadConfig();
  return new N8nClient({
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
    sessionCookie: config.sessionCookie,
  });
}

export async function ensureAuthenticated(client: N8nClient): Promise<void> {
  const auth = await client.checkAuth();
  if (!auth.authenticated) {
    exitWithError(
      'Not authenticated to n8n API. Please set N8N_API_KEY or N8N_SESSION_COOKIE environment variable.'
    );
  }
}

export function exitWithError(message: string, error?: unknown): never {
  console.error(`❌ ${message}`);

  if (error) {
    const baseMessage = extractErrorMessage(error);
    let extra = '';
    if (isAxiosError(error)) {
      extra = ` (${formatAxiosError(error)})`;
    }
    console.error(`   Details: ${baseMessage}${extra}`);
  }

  process.exit(1);
}

export function logImportResults(results: WorkflowImportResult[]): void {
  console.log('\n📊 Import Summary:');
  console.log('─'.repeat(50));

  results.forEach((result) => {
    if (result.error) {
      console.log(`❌ ${result.file}: ${result.error}`);
    } else {
      console.log(`✓ ${result.file} → ${result.name} (ID: ${result.id})`);
    }
  });

  const successfulCount = results.filter((r) => !r.error).length;
  console.log(`\n✅ Imported ${successfulCount} workflow(s)`);
}

export function logActivationResults(results: WorkflowActivationResult[]): void {
  console.log('\n📊 Activation Summary:');
  console.log('─'.repeat(50));

  const activated = results.filter((r) => r.status === WORKFLOW_STATUS.ACTIVATED);
  const alreadyActive = results.filter((r) => r.status === WORKFLOW_STATUS.ALREADY_ACTIVE);
  const errors = results.filter((r) => r.status === WORKFLOW_STATUS.ERROR);

  if (activated.length > 0) {
    console.log(`\n✅ Activated ${activated.length} workflow(s):`);
    activated.forEach((r) => console.log(`   - ${r.name}`));
  }

  if (alreadyActive.length > 0) {
    console.log(`\nℹ️  Already active ${alreadyActive.length} workflow(s):`);
    alreadyActive.forEach((r) => console.log(`   - ${r.name}`));
  }

  if (errors.length > 0) {
    console.log(`\n❌ Failed to activate ${errors.length} workflow(s):`);
    errors.forEach((r) => console.log(`   - ${r.name}: ${r.error}`));
  }
}
