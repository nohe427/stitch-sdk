/**
 * Smoke test for @google/stitch-sdk packaging.
 * 
 * Verifies:
 * 1. dist/ output exists after build
 * 2. Entry point (dist/index.js) is importable
 * 3. All key exports are present and correctly typed
 * 4. Type declarations (dist/index.d.ts) are emitted
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";

const CORE_DIR = resolve(process.cwd(), "core");
const DIST_DIR = resolve(CORE_DIR, "dist");

let failures = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ✗ ${message}`);
    failures++;
  } else {
    console.log(`  ✓ ${message}`);
  }
}

async function main() {
  // ── 1. Verify dist output exists ──────────────────────────────
  console.log("\n📦 Checking build output...");
  assert(existsSync(resolve(DIST_DIR, "index.js")), "dist/index.js exists");
  assert(existsSync(resolve(DIST_DIR, "index.d.ts")), "dist/index.d.ts exists");
  assert(existsSync(resolve(DIST_DIR, "client.js")), "dist/client.js exists");
  assert(existsSync(resolve(DIST_DIR, "sdk.js")), "dist/sdk.js exists");
  assert(existsSync(resolve(DIST_DIR, "screen.js")), "dist/screen.js exists");
  assert(existsSync(resolve(DIST_DIR, "project.js")), "dist/project.js exists");
  assert(existsSync(resolve(DIST_DIR, "result.js")), "dist/result.js exists");
  assert(existsSync(resolve(DIST_DIR, "proxy")), "dist/proxy/ directory exists");

  // ── 2. Dynamic import of the built package ────────────────────
  console.log("\n🔌 Importing package...");
  const sdk = await import(resolve(DIST_DIR, "index.js"));

  // ── 3. Verify key exports ─────────────────────────────────────
  console.log("\n🔍 Checking exports...");

  // Classes
  assert(typeof sdk.Stitch === "function", "Stitch class exported");
  assert(typeof sdk.StitchMCPClient === "function", "StitchMCPClient class exported");
  assert(typeof sdk.Screen === "function", "Screen class exported");
  assert(typeof sdk.Project === "function", "Project class exported");
  assert(typeof sdk.StitchProxy === "function", "StitchProxy class exported");

  // Singleton
  assert(typeof sdk.stitch === "object", "stitch singleton exported");

  // Result helpers
  assert(typeof sdk.ok === "function", "ok() result helper exported");
  assert(typeof sdk.fail === "function", "fail() result helper exported");
  assert(typeof sdk.failFromError === "function", "failFromError() result helper exported");

  // Zod schemas
  assert(typeof sdk.StitchConfigSchema === "object", "StitchConfigSchema exported");
  assert(typeof sdk.StitchErrorCode === "object", "StitchErrorCode exported");
  assert(typeof sdk.StitchError === "object", "StitchError (schema) exported");

  // Proxy utilities
  assert(typeof sdk.forwardToStitch === "function", "forwardToStitch() exported");
  assert(typeof sdk.initializeStitchConnection === "function", "initializeStitchConnection() exported");
  assert(typeof sdk.refreshTools === "function", "refreshTools() exported");

  // ── Summary ───────────────────────────────────────────────────
  console.log("");
  if (failures > 0) {
    console.error(`💥 ${failures} check(s) failed.`);
    process.exit(1);
  } else {
    console.log("✅ All smoke checks passed.\n");
  }
}

main();
