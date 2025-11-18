#!/usr/bin/env tsx

import {
  createClient,
  ensureAuthenticated,
  exitWithError,
  logImportResults,
} from '../src/cli-utils.js';

async function main(): Promise<void> {
  console.log('🚀 Importing workflows to n8n...\n');

  try {
    const client = createClient();
    await ensureAuthenticated(client);

    // Import all workflows
    const results = await client.importAllWorkflows();
    logImportResults(results);
  } catch (error) {
    exitWithError('Error while importing workflows', error);
  }
}

void main();
