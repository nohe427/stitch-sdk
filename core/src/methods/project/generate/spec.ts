import { z } from 'zod';
import type { Result } from '../../../result.js';
import type { Screen } from '../../../screen.js';

// INPUT
export const GenerateScreenInputSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  prompt: z.string().min(1, 'Prompt is required'),
  deviceType: z.enum(['DESKTOP', 'MOBILE']).default('DESKTOP'),
});
export type GenerateScreenInput = z.infer<typeof GenerateScreenInputSchema>;

// OUTPUT
export type GenerateScreenOutput = Screen;

// RESULT
export type GenerateScreenResult = Result<GenerateScreenOutput>;

// INTERFACE
export interface GenerateScreenSpec {
  execute(input: GenerateScreenInput): Promise<GenerateScreenResult>;
}
