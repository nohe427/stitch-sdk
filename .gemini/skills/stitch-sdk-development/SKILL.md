---
name: stitch-sdk-development
description: Contribute to the Stitch SDK codebase. Use when adding new operations, fixing bugs, or understanding the SDK architecture. Follows the Spec & Handler zero-contention pattern.
---

# Developing the Stitch SDK

This skill covers contributing to the Stitch SDK codebase.

## Architecture Overview

The SDK uses a **Spec & Handler** pattern for zero-contention development:

```
core/src/
├── methods/                    # All operations by domain
│   ├── stitch/                 # Stitch-level (connect, projects)
│   │   └── {operation}/
│   │       ├── spec.ts         # Input/output schemas
│   │       └── handler.ts      # Implementation
│   ├── project/                # Project-level (generate, screens)
│   └── screen/                 # Screen-level (getHtml, getImage)
├── proxy/                      # MCP Proxy server
└── spec/                       # Shared specifications
```

## Adding a New Operation

### 1. Create the Folder

```bash
mkdir -p core/src/methods/{domain}/{operationName}
```

### 2. Create spec.ts

```typescript
import { z } from 'zod';
import type { Result } from '../../../result.js';

// Input schema
export const MyOperationInputSchema = z.object({
  projectId: z.string(),
  // ... other fields
});

// Types
export type MyOperationInput = z.infer<typeof MyOperationInputSchema>;
export type MyOperationResult = Result<YourReturnType>;

// Interface
export interface MyOperationSpec {
  execute(input: MyOperationInput): Promise<MyOperationResult>;
}
```

### 3. Create handler.ts

```typescript
import type { StitchMCPClient } from '../../../client.js';
import type { MyOperationSpec, MyOperationInput, MyOperationResult } from './spec.js';
import { ok, failFromError } from '../../../result.js';

export class MyOperationHandler implements MyOperationSpec {
  constructor(private client: StitchMCPClient) {}

  async execute(input: MyOperationInput): Promise<MyOperationResult> {
    try {
      const response = await this.client.callTool('tool_name', {
        // map input to tool params
      });
      return ok(response);
    } catch (error) {
      return failFromError(error);
    }
  }
}
```

### 4. Update Barrel Exports

```bash
bun scripts/generate-barrels.ts
```

Or manually add to `core/src/methods/index.ts`.

### 5. Add to Wrapper Class

In the appropriate class (`sdk.ts`, `project.ts`, or `screen.ts`):

```typescript
import { MyOperationHandler } from './methods/{domain}/{operation}/handler.js';

export class Project {
  private _myOperation: MyOperationHandler;

  constructor(private client: StitchMCPClient) {
    this._myOperation = new MyOperationHandler(client);
  }

  async myOperation(param: string): Promise<Result<ReturnType>> {
    return this._myOperation.execute({ projectId: this.id, param });
  }
}
```

### 6. Create Test

```typescript
// core/test/unit/methods/{domain}/{operation}.test.ts
import { describe, it, expect, vi } from 'vitest';
import { MyOperationHandler } from '../../../../src/methods/{domain}/{operation}/handler.js';

describe('MyOperationHandler', () => {
  it('returns success with expected data', async () => {
    const mockClient = {
      callTool: vi.fn().mockResolvedValue({ /* mock response */ }),
    };

    const handler = new MyOperationHandler(mockClient as any);
    const result = await handler.execute({ projectId: 'test' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeDefined();
    }
  });

  it('returns failure on error', async () => {
    const mockClient = {
      callTool: vi.fn().mockRejectedValue(new Error('API error')),
    };

    const handler = new MyOperationHandler(mockClient as any);
    const result = await handler.execute({ projectId: 'test' });

    expect(result.success).toBe(false);
  });
});
```

## Running Tests

```bash
# All tests
npm test

# Specific test file
npx vitest run test/unit/methods/stitch/connect.test.ts
```

## Building

```bash
npm run build
```

## Key Patterns

### Result Type

Always return `Result<T>`, never throw:

```typescript
import { ok, fail, failFromError } from '../../../result.js';

// Success
return ok(data);

// Known error
return fail({ code: 'NOT_FOUND', message: 'Project not found', recoverable: false });

// Unknown error
return failFromError(error);
```

### Thin Wrappers

Public classes delegate to handlers:

```typescript
class Screen {
  private _getHtml: GetScreenHtmlHandler;

  async getHtml(): Promise<Result<string>> {
    return this._getHtml.execute({ projectId: this.projectId, screenId: this.id });
  }
}
```

### Import Paths

Use `.js` extensions for ESM compatibility:

```typescript
import { ok } from '../../../result.js';  // ✓
import { ok } from '../../../result';     // ✗
```
