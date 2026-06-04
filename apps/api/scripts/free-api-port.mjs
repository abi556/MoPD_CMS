/**
 * Frees the API dev port before `nest start --watch` (avoids EADDRINUSE on Windows).
 */
import { execSync } from "node:child_process";

const port = String(process.env.PORT ?? process.env.API_PORT ?? "3001");

function freePortWindows() {
  let out = "";
  try {
    out = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf8" });
  } catch {
    return;
  }

  const pids = new Set();
  for (const line of out.split(/\r?\n/)) {
    if (!line.includes("LISTENING")) continue;
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && pid !== "0") pids.add(pid);
  }

  for (const pid of pids) {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
      console.log(`[free-api-port] Stopped PID ${pid} on port ${port}`);
    } catch {
      // already gone
    }
  }
}

function freePortUnix() {
  try {
    const out = execSync(`lsof -ti tcp:${port}`, { encoding: "utf8" }).trim();
    if (!out) return;
    for (const pid of out.split(/\s+/)) {
      try {
        execSync(`kill -9 ${pid}`, { stdio: "ignore" });
        console.log(`[free-api-port] Stopped PID ${pid} on port ${port}`);
      } catch {
        // ignore
      }
    }
  } catch {
    // nothing listening
  }
}

if (process.platform === "win32") {
  freePortWindows();
} else {
  freePortUnix();
}
