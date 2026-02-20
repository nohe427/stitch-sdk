import { z } from 'zod';

/**
 * Exhaustive error codes for Stitch operations.
 * Add new codes here as needed.
 */
export const StitchErrorCode = z.enum([
  'AUTH_FAILED',
  'NOT_FOUND',
  'PERMISSION_DENIED',
  'RATE_LIMITED',
  'NETWORK_ERROR',
  'VALIDATION_ERROR',
  'UNKNOWN_ERROR',
]);

export type StitchErrorCode = z.infer<typeof StitchErrorCode>;

/**
 * Structured error with code, message, and recovery hints.
 */
export const StitchError = z.object({
  code: StitchErrorCode,
  message: z.string(),
  suggestion: z.string().optional(),
  recoverable: z.boolean(),
});

export type StitchError = z.infer<typeof StitchError>;
