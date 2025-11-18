#!/usr/bin/env tsx

import {
  createClient,
  ensureAuthenticated,
  exitWithError,
  logActivationResults,
  logImportResults,
} from '../src/cli-utils.js';

async function main(): Promise<void> {
  console.log('🚀 Setting up workflows (import + activate)...\n');

  try {
    const client = createClient();
    await ensureAuthenticated(client);

    // Step 1: Import all workflows
    console.log('📥 Step 1: Importing workflows...\n');
    const importResults = await client.importAllWorkflows();
    logImportResults(importResults);

    // Step 2: Activate all workflows
    console.log('⚡ Step 2: Activating workflows...\n');
    const activateResults = await client.activateAllWorkflows();
    logActivationResults(activateResults);

    console.log('\n🎉 Setup complete!');
  } catch (error) {
    exitWithError('Error while setting up workflows', error);
  }
}

void main();
