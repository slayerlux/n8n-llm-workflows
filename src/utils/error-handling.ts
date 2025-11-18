import type { AxiosError } from 'axios';

/**
 * Extract a human-readable error message from an unknown error value.
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/**
 * Narrow unknown error to AxiosError when possible.
 */
export function isAxiosError(error: unknown): error is AxiosError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    Boolean((error as { isAxiosError?: boolean }).isAxiosError)
  );
}

/**
 * Format AxiosError details for logging.
 */
export function formatAxiosError(error: AxiosError): string {
  const status = error.response?.status;
  const data = error.response?.data;
  const parts: string[] = [];

  if (status !== undefined) {
    parts.push(`status=${status}`);
  }

  if (data !== undefined) {
    try {
      parts.push(`data=${JSON.stringify(data)}`);
    } catch {
      parts.push('data=[unserializable]');
    }
  }

  return parts.length > 0 ? parts.join(' ') : 'no response data';
}
