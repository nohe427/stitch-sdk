import { z } from 'zod';
import type { Result } from '../../../result.js';
import type { Project } from '../../../project.js';

// INPUT
export const ListProjectsInputSchema = z.object({});
export type ListProjectsInput = z.infer<typeof ListProjectsInputSchema>;

// OUTPUT
export type ListProjectsOutput = Project[];

// RESULT
export type ListProjectsResult = Result<ListProjectsOutput>;

// INTERFACE
export interface ListProjectsSpec {
  execute(input: ListProjectsInput): Promise<ListProjectsResult>;
}
