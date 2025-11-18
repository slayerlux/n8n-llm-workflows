import { readFileSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import type { N8nWorkflow } from '../types.js';
import { isN8nWorkflow } from './type-guards.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function getDefaultWorkflowsDirectory(): string {
  // Go up from src/utils/ to project root, then into workflows/
  return join(__dirname, '../../workflows');
}

export function listWorkflowFiles(directory: string): string[] {
  return readdirSync(directory)
    .filter((file) => file.endsWith('.json'))
    .sort();
}

export function readWorkflowFile(filePath: string): N8nWorkflow {
  const raw = readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(raw) as unknown;

  if (!isN8nWorkflow(parsed)) {
    throw new Error(`Invalid workflow file: ${filePath}`);
  }

  return parsed;
}

type WorkflowForImport = Omit<
  N8nWorkflow,
  'id' | 'active' | 'pinData' | 'meta' | 'tags' | 'versionId'
>;

type WorkflowForUpdate = Omit<N8nWorkflow, 'active' | 'pinData' | 'meta' | 'tags' | 'versionId'>;

export function sanitizeWorkflowForImport(workflow: N8nWorkflow): WorkflowForImport {
  const {
    id: _id,
    active: _active,
    pinData: _pinData,
    meta: _meta,
    tags: _tags,
    versionId: _versionId,
    ...rest
  } = workflow;
  return rest;
}

export function sanitizeWorkflowForUpdate(workflow: N8nWorkflow): WorkflowForUpdate {
  const {
    active: _active,
    pinData: _pinData,
    meta: _meta,
    tags: _tags,
    versionId: _versionId,
    ...rest
  } = workflow;
  return rest;
}
