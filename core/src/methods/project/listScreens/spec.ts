import { z } from 'zod';
import type { Result } from '../../../result.js';
import type { Screen } from '../../../screen.js';

// INPUT
export const ListScreensInputSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
});
export type ListScreensInput = z.infer<typeof ListScreensInputSchema>;

// OUTPUT
export type ListScreensOutput = Screen[];

// RESULT
export type ListScreensResult = Result<ListScreensOutput>;

// INTERFACE
export interface ListScreensSpec {
  execute(input: ListScreensInput): Promise<ListScreensResult>;
}
