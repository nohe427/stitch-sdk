import { z } from 'zod';
import type { Result } from '../../../result.js';

// INPUT
export const GetScreenImageInputSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  screenId: z.string().min(1, 'Screen ID is required'),
});
export type GetScreenImageInput = z.infer<typeof GetScreenImageInputSchema>;

// OUTPUT
export type GetScreenImageOutput = string;

// RESULT
export type GetScreenImageResult = Result<GetScreenImageOutput>;

// INTERFACE
export interface GetScreenImageSpec {
  execute(input: GetScreenImageInput): Promise<GetScreenImageResult>;
}
