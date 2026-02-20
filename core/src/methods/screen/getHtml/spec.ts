import { z } from 'zod';
import type { Result } from '../../../result.js';

// INPUT
export const GetScreenHtmlInputSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  screenId: z.string().min(1, 'Screen ID is required'),
});
export type GetScreenHtmlInput = z.infer<typeof GetScreenHtmlInputSchema>;

// OUTPUT
export type GetScreenHtmlOutput = string;

// RESULT
export type GetScreenHtmlResult = Result<GetScreenHtmlOutput>;

// INTERFACE
export interface GetScreenHtmlSpec {
  execute(input: GetScreenHtmlInput): Promise<GetScreenHtmlResult>;
}
