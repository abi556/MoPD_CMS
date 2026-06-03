/**
 * Clears Turbopack dev cache so App Router picks up moved/deleted pages.
 * Run automatically via `predev` — prevents stale 404s after route changes.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const targets = [
  path.join(webRoot, ".next", "dev"),
  path.join(webRoot, ".next", "cache"),
];

for (const target of targets) {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
    console.log(`[web] cleared ${path.relative(webRoot, target)}`);
  }
}
