import { z } from 'zod';
import type { Result } from '../../../result.js';
import type { Project } from '../../../project.js';

// INPUT
export const GetProjectInputSchema = z.object({
  id: z.string().min(1, 'Project ID is required'),
});
export type GetProjectInput = z.infer<typeof GetProjectInputSchema>;

// OUTPUT
export type GetProjectOutput = Project;

// RESULT
export type GetProjectResult = Result<GetProjectOutput>;

// INTERFACE
export interface GetProjectSpec {
  execute(input: GetProjectInput): Promise<GetProjectResult>;
}
