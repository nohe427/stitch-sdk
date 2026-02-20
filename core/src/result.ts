import type { StitchError } from './spec/errors.js';

/**
 * Result type for operations that can fail.
 * Use ok() and fail() helpers to construct.
 */
export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: StitchError };

/**
 * Create a successful result.
 */
export function ok<T>(data: T): Result<T> {
  return { success: true, data };
}

/**
 * Create a failure result.
 */
export function fail(error: StitchError): Result<never> {
  return { success: false, error };
}

/**
 * Create a failure result from an unknown error.
 */
export function failFromError(error: unknown): Result<never> {
  return fail({
    code: 'UNKNOWN_ERROR',
    message: error instanceof Error ? error.message : String(error),
    recoverable: false,
  });
}
