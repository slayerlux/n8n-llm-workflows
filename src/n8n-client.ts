import axios, { AxiosInstance } from 'axios';
import type {
  AuthCheckResult,
  N8nClientOptions,
  N8nWorkflow,
  WorkflowActivationResult,
  WorkflowImportResult,
} from './types.js';
import { loadConfig } from './config.js';
import {
  getDefaultWorkflowsDirectory,
  listWorkflowFiles,
  readWorkflowFile,
  sanitizeWorkflowForImport,
  sanitizeWorkflowForUpdate,
} from './utils/file-operations.js';
import { assertNonEmptyString } from './utils/validation.js';
import { isAxiosError } from './utils/error-handling.js';

/**
 * n8n API Client for workflow management
 */
export class N8nClient {
  private baseUrl: string;
  private apiKey?: string;
  private sessionCookie?: string;
  private client: AxiosInstance;

  constructor(options: N8nClientOptions = {}) {
    const config = loadConfig();
    this.baseUrl = options.baseUrl || config.baseUrl;
    this.apiKey = options.apiKey || config.apiKey;
    this.sessionCookie = options.sessionCookie || config.sessionCookie;

    // Create axios instance with default config
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'X-N8N-API-KEY': this.apiKey }),
      },
      withCredentials: true,
    });

    // Add session cookie if provided
    if (this.sessionCookie) {
      this.client.defaults.headers.common['Cookie'] = this.sessionCookie;
    }
  }

  /**
   * Get authentication status
   */
  async checkAuth(): Promise<AuthCheckResult> {
    try {
      // Use workflows endpoint to check auth since /api/v1/me may not exist in all n8n versions
      await this.client.get<{ data: N8nWorkflow[] }>('/api/v1/workflows');
      return { authenticated: true };
    } catch (error) {
      if (isAxiosError(error)) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          return { authenticated: false, error: 'Not authenticated' };
        }
      }
      throw error;
    }
  }

  /**
   * List all workflows
   */
  async listWorkflows(): Promise<N8nWorkflow[]> {
    const response = await this.client.get<{ data: N8nWorkflow[] }>('/api/v1/workflows');
    return response.data.data;
  }

  /**
   * Get workflow by ID
   */
  async getWorkflow(id: string): Promise<N8nWorkflow> {
    assertNonEmptyString(id, 'Workflow ID');
    const response = await this.client.get<N8nWorkflow>(`/api/v1/workflows/${id}`);
    return response.data;
  }

  /**
   * Import workflow from JSON file
   */
  async importWorkflow(filePath: string): Promise<N8nWorkflow> {
    const workflowData = readWorkflowFile(filePath);
    const workflowToImport = sanitizeWorkflowForImport(workflowData);

    const response = await this.client.post<N8nWorkflow>('/api/v1/workflows', workflowToImport);
    return response.data;
  }

  /**
   * Update existing workflow
   */
  async updateWorkflow(id: string, filePath: string): Promise<N8nWorkflow> {
    assertNonEmptyString(id, 'Workflow ID');
    const workflowData = readWorkflowFile(filePath);
    const workflowToUpdate = sanitizeWorkflowForUpdate(workflowData);

    const response = await this.client.put<N8nWorkflow>(
      `/api/v1/workflows/${id}`,
      workflowToUpdate
    );
    return response.data;
  }

  /**
   * Activate workflow
   */
  async activateWorkflow(id: string): Promise<N8nWorkflow> {
    assertNonEmptyString(id, 'Workflow ID');
    const response = await this.client.post<N8nWorkflow>(`/api/v1/workflows/${id}/activate`);
    return response.data;
  }

  /**
   * Deactivate workflow
   */
  async deactivateWorkflow(id: string): Promise<N8nWorkflow> {
    assertNonEmptyString(id, 'Workflow ID');
    const response = await this.client.post<N8nWorkflow>(`/api/v1/workflows/${id}/deactivate`);
    return response.data;
  }

  /**
   * Delete workflow
   */
  async deleteWorkflow(id: string): Promise<void> {
    assertNonEmptyString(id, 'Workflow ID');
    await this.client.delete(`/api/v1/workflows/${id}`);
  }

  /**
   * Import or update workflow (idempotent)
   */
  async importOrUpdateWorkflow(filePath: string, workflowName: string): Promise<N8nWorkflow> {
    assertNonEmptyString(workflowName, 'Workflow name');
    try {
      // Try to find existing workflow by name
      const workflows = await this.listWorkflows();
      const existing = workflows.find((w) => w.name === workflowName);

      const existingId = existing?.id;
      if (existingId) {
        console.log(`Updating existing workflow: ${workflowName} (ID: ${existingId})`);
        return await this.updateWorkflow(existingId, filePath);
      } else {
        console.log(`Importing new workflow: ${workflowName}`);
        return await this.importWorkflow(filePath);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error importing/updating workflow ${workflowName}:`, errorMessage);
      throw error;
    }
  }

  /**
   * Import all workflows from directory
   */
  async importAllWorkflows(
    workflowsDir: string = getDefaultWorkflowsDirectory()
  ): Promise<WorkflowImportResult[]> {
    const workflows: WorkflowImportResult[] = [];

    const files = listWorkflowFiles(workflowsDir);

    for (const file of files) {
      const filePath = `${workflowsDir}/${file}`;
      const workflowData = readWorkflowFile(filePath);
      const workflowName = workflowData.name;

      try {
        const result = await this.importOrUpdateWorkflow(filePath, workflowName);
        workflows.push({ file, name: workflowName, id: result.id, active: result.active });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Failed to import ${file}:`, errorMessage);
        workflows.push({ file, name: workflowName, error: errorMessage });
      }
    }

    return workflows;
  }

  /**
   * Activate workflows that match the given filter predicate
   */
  private async activateWorkflowsWithFilter(
    filter: (workflow: N8nWorkflow) => boolean
  ): Promise<WorkflowActivationResult[]> {
    const workflows = await this.listWorkflows();
    const results: WorkflowActivationResult[] = [];

    for (const workflow of workflows) {
      if (!filter(workflow)) {
        continue;
      }

      const workflowId = workflow.id;
      if (!workflowId) {
        continue; // Skip workflows without ID
      }

      if (!workflow.active) {
        try {
          await this.activateWorkflow(workflowId);
          results.push({ name: workflow.name, id: workflowId, status: 'activated' });
          console.log(`✓ Activated: ${workflow.name}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          results.push({
            name: workflow.name,
            id: workflowId,
            status: 'error',
            error: errorMessage,
          });
          console.error(`✗ Failed to activate ${workflow.name}:`, errorMessage);
        }
      } else {
        results.push({ name: workflow.name, id: workflowId, status: 'already active' });
        console.log(`- Already active: ${workflow.name}`);
      }
    }

    return results;
  }

  /**
   * Activate all workflows by name pattern
   */
  async activateAllWorkflows(): Promise<WorkflowActivationResult[]> {
    return this.activateWorkflowsWithFilter(() => true);
  }

  /**
   * Activate only workflows from project directory (01-05)
   */
  async activateProjectWorkflows(
    workflowsDir: string = getDefaultWorkflowsDirectory()
  ): Promise<WorkflowActivationResult[]> {
    const files = listWorkflowFiles(workflowsDir);

    // Get workflow names from our project files
    const projectWorkflowNames = new Set<string>();
    for (const file of files) {
      const filePath = `${workflowsDir}/${file}`;
      const workflowData = readWorkflowFile(filePath);
      projectWorkflowNames.add(workflowData.name);
    }

    return this.activateWorkflowsWithFilter((workflow) => projectWorkflowNames.has(workflow.name));
  }
}
