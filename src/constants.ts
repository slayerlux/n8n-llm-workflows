export const WORKFLOW_STATUS = {
  ACTIVATED: 'activated',
  ALREADY_ACTIVE: 'already active',
  ERROR: 'error',
} as const;

export type WorkflowStatus = (typeof WORKFLOW_STATUS)[keyof typeof WORKFLOW_STATUS];
