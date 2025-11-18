import type { N8nWorkflow } from '../types.js';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isN8nWorkflow(value: unknown): value is N8nWorkflow {
  if (!isRecord(value)) {
    return false;
  }

  const { id, name, nodes, connections } = value;

  // id is optional (workflows exported from n8n may not have id)
  if (id !== undefined && typeof id !== 'string') {
    return false;
  }

  if (typeof name !== 'string') {
    return false;
  }

  if (!Array.isArray(nodes)) {
    return false;
  }

  if (!isRecord(connections)) {
    return false;
  }

  return true;
}
