---
name: stitch-sdk-usage
description: Use the Stitch SDK to generate UI screens from text prompts, manage projects, and retrieve screen HTML/images. Use when the user wants to consume the SDK in their application.
---

# Using the Stitch SDK

The Stitch SDK provides a TypeScript interface for Google Stitch, an AI-powered UI generation service.

## Installation

```bash
npm install @google/stitch-sdk
```

## Environment Variables

```bash
export STITCH_API_KEY="your-api-key"
```

## Quick Start

```typescript
import { stitch } from '@google/stitch-sdk';

// Connect to Stitch
await stitch.connect();

// List all projects
const projectsResult = await stitch.projects();
if (projectsResult.success) {
  console.log(projectsResult.data);
}
```

## Result Type

All SDK operations return a `Result<T>` type:

```typescript
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: StitchError };
```

**Always check `result.success` before accessing `result.data`:**

```typescript
const result = await stitch.projects();
if (result.success) {
  for (const project of result.data) {
    console.log(project.id);
  }
} else {
  console.error(result.error.message);
}
```

## Working with Projects

```typescript
// List all projects
const projectsResult = await stitch.projects();

// Access a specific project by ID
const projectResult = stitch.project("project-id");

// Create a new project
const createResult = await stitch.createProject("My App");
```

## Generating Screens

```typescript
const projectResult = stitch.project("project-id");
if (!projectResult.success) return;
const project = projectResult.data;

// Generate a new screen from a prompt
const screenResult = await project.generate(
  "Login page with email and password fields",
  "DESKTOP"  // or "MOBILE"
);

if (screenResult.success) {
  const screen = screenResult.data;
  console.log(`Generated screen: ${screen.id}`);
}
```

## Retrieving Screen Assets

```typescript
// Get screen HTML
const htmlResult = await screen.getHtml();
if (htmlResult.success) {
  console.log(htmlResult.data); // Raw HTML string
}

// Get screen image URL
const imageResult = await screen.getImage();
if (imageResult.success) {
  console.log(imageResult.data); // Image URL
}
```

## API Reference

### Stitch Class

| Method | Returns | Description |
|--------|---------|-------------|
| `connect()` | `Promise<Result<void>>` | Connect to the Stitch MCP server |
| `projects()` | `Promise<Result<Project[]>>` | List all projects |
| `project(id)` | `Result<Project>` | Get a project wrapper by ID |
| `createProject(title)` | `Promise<Result<Project>>` | Create a new project |

### Project Class

| Method | Returns | Description |
|--------|---------|-------------|
| `generate(prompt, deviceType?)` | `Promise<Result<Screen>>` | Generate a screen from a text prompt |
| `screens()` | `Promise<Result<Screen[]>>` | List all screens in the project |

### Screen Class

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Screen identifier |
| `projectId` | `string` | Parent project ID |

| Method | Returns | Description |
|--------|---------|-------------|
| `getHtml()` | `Promise<Result<string>>` | Fetch the screen's HTML code |
| `getImage()` | `Promise<Result<string>>` | Fetch the screen's image URL |

## Error Handling

```typescript
const result = await stitch.projects();
if (!result.success) {
  if (result.error.code === 'AUTH_ERROR') {
    console.error('Check your STITCH_API_KEY');
  } else if (result.error.recoverable) {
    // Retry logic
  } else {
    throw new Error(result.error.message);
  }
}
```

Error codes: `NETWORK_ERROR`, `AUTH_ERROR`, `NOT_FOUND`, `VALIDATION_ERROR`, `UNKNOWN_ERROR`
