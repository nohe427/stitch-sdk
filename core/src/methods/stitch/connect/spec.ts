import { z } from 'zod';
import type { Result } from '../../../result.js';

// INPUT
export const ConnectInputSchema = z.object({});
export type ConnectInput = z.infer<typeof ConnectInputSchema>;

// OUTPUT
export type ConnectOutput = void;

// RESULT
export type ConnectResult = Result<ConnectOutput>;

// INTERFACE
export interface ConnectSpec {
  execute(input: ConnectInput): Promise<ConnectResult>;
}
