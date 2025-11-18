/**
 * Type definitions for n8n API and workflow management
 */

export interface N8nUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface N8nConnectionTarget {
  node: string;
  type: string;
  index: number;
}

export type N8nConnections = Record<string, Record<string, N8nConnectionTarget[][]>>;

export interface N8nWorkflow {
  id?: string; // Optional: workflows exported from n8n may not have id
  name: string;
  active?: boolean; // Optional: exported workflows may not have active
  nodes: N8nNode[];
  connections: N8nConnections;
  settings?: Record<string, unknown>;
  staticData?: Record<string, unknown> | null;
  tags?: Array<{ id?: string; name: string }>;
  createdAt?: string;
  updatedAt?: string;
  pinData?: Record<string, unknown>; // Optional: not accepted by API on import
  meta?: Record<string, unknown>; // Optional: not accepted by API on import
  versionId?: string; // Optional: not accepted by API on import
}

export interface N8nWorkflowImport {
  name: string;
  nodes: N8nNode[];
  connections: N8nConnections;
  settings?: Record<string, unknown>;
  staticData?: Record<string, unknown> | null;
  tags?: Array<{ id?: string; name: string }>;
}

export interface N8nClientOptions {
  baseUrl?: string;
  apiKey?: string;
  sessionCookie?: string;
}

export interface WorkflowImportResult {
  file: string;
  name: string;
  id?: string;
  active?: boolean;
  error?: string;
}

export interface WorkflowActivationResult {
  name: string;
  id: string;
  status: 'activated' | 'already active' | 'error';
  error?: string;
}

export interface AuthCheckResult {
  authenticated: boolean;
  user?: N8nUser;
  error?: string;
}
