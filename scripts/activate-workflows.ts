#!/usr/bin/env tsx

import {
  createClient,
  ensureAuthenticated,
  exitWithError,
  logActivationResults,
} from '../src/cli-utils.js';

async function main(): Promise<void> {
  console.log('🚀 Activating workflows in n8n...\n');

  try {
    const client = createClient();
    await ensureAuthenticated(client);

    // Activate only project workflows (01-05)
    const results = await client.activateProjectWorkflows();
    logActivationResults(results);
  } catch (error) {
    exitWithError('Error while activating workflows', error);
  }
}

void main();
