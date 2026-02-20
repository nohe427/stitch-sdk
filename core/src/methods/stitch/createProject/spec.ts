import { z } from 'zod';
import type { Result } from '../../../result.js';
import type { Project } from '../../../project.js';

// INPUT
export const CreateProjectInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
});
export type CreateProjectInput = z.infer<typeof CreateProjectInputSchema>;

// OUTPUT
export type CreateProjectOutput = Project;

// RESULT
export type CreateProjectResult = Result<CreateProjectOutput>;

// INTERFACE
export interface CreateProjectSpec {
  execute(input: CreateProjectInput): Promise<CreateProjectResult>;
}
