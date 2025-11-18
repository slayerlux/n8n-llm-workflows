#!/usr/bin/env tsx

import {
  createClient,
  ensureAuthenticated,
  exitWithError,
  logActivationResults,
  logImportResults,
} from '../src/cli-utils.js';

async function main(): Promise<void> {
  console.log('🧪 Full setup test: Delete → Import → Activate → Test\n');

  try {
    const client = createClient();
    await ensureAuthenticated(client);

    // Step 1: List and delete all workflows
    console.log('🗑️  Step 1: Deleting all existing workflows...\n');
    const workflows = await client.listWorkflows();
    console.log(`Found ${workflows.length} workflow(s)`);

    for (const workflow of workflows) {
      if (workflow.id) {
        try {
          await client.deleteWorkflow(workflow.id);
          console.log(`  ✓ Deleted: ${workflow.name}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`  ✗ Failed to delete ${workflow.name}: ${errorMessage}`);
        }
      }
    }

    // Step 2: Import all workflows
    console.log('\n📥 Step 2: Importing workflows...\n');
    const importResults = await client.importAllWorkflows();
    logImportResults(importResults);

    // Step 3: Activate all workflows
    console.log('\n⚡ Step 3: Activating workflows...\n');
    const activateResults = await client.activateProjectWorkflows();
    logActivationResults(activateResults);

    // Step 4: Verify workflows are active
    console.log('\n✅ Step 4: Verifying workflows...\n');
    const finalWorkflows = await client.listWorkflows();
    const activeCount = finalWorkflows.filter((w) => w.active).length;
    console.log(`Total workflows: ${finalWorkflows.length}`);
    console.log(`Active workflows: ${activeCount}`);

    if (activeCount < 5) {
      console.warn('⚠️  Warning: Expected at least 5 active workflows');
    }

    console.log('\n🎉 Full setup test complete!');
    console.log('\n💡 Next step: Run "pnpm test" to test the endpoints');
  } catch (error) {
    exitWithError('Error during full setup test', error);
  }
}

void main();
