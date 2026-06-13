/**
 * Clears Turbopack dev cache so App Router picks up moved/deleted pages.
 * Run automatically via `predev` — prevents stale 404s after route changes.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const devDir = path.join(webRoot, ".next", "dev");
const prerenderManifest = path.join(devDir, "prerender-manifest.json");

// Turbopack can occasionally leave a truncated prerender-manifest.json mid-write,
// which surfaces as: JSON.parse "Unexpected non-whitespace character after JSON".
if (fs.existsSync(prerenderManifest)) {
  try {
    JSON.parse(fs.readFileSync(prerenderManifest, "utf8"));
  } catch {
    fs.rmSync(devDir, { recursive: true, force: true });
    console.warn(
      "[web] removed corrupted .next/dev (invalid prerender-manifest.json)",
    );
  }
}

const targets = [
  devDir,
  path.join(webRoot, ".next", "cache"),
];

for (const target of targets) {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
    console.log(`[web] cleared ${path.relative(webRoot, target)}`);
  }
}
