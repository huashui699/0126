import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";

const baseURL = "http://127.0.0.1:3000";

await new Promise((resolve, reject) => {
  const probe = createServer();
  probe.once("error", (error) => reject(new Error(`Port 3000 must be free before E2E starts: ${error.message}`)));
  probe.listen(3000, "127.0.0.1", () => probe.close(resolve));
});

const server = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1"],
  {
    cwd: process.cwd(),
    env: { ...process.env, E2E_USE_CALENDAR_FIXTURES: "true" },
    stdio: "inherit",
    windowsHide: true,
    detached: process.platform !== "win32",
  },
);
server.unref();

let stopping = false;

function windowsListenerPid() {
  const result = spawnSync("netstat", ["-ano", "-p", "tcp"], {
    encoding: "utf8",
    windowsHide: true,
  });
  const line = result.stdout.split(/\r?\n/u).find((entry) =>
    /127\.0\.0\.1:3000\s+.*LISTENING\s+\d+\s*$/iu.test(entry),
  );
  return line?.match(/(\d+)\s*$/u)?.[1] ?? null;
}

async function stopServer() {
  if (stopping) return;
  stopping = true;

  if (process.platform === "win32") {
    const targets = new Set([windowsListenerPid(), server.pid ? String(server.pid) : null]);
    for (const pid of targets) {
      if (!pid) continue;
      spawnSync("taskkill", ["/pid", pid, "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true,
      });
    }
  } else if (server.pid) {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch (error) {
      if (error.code !== "ESRCH") throw error;
    }
  }
}

async function waitForServer() {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Next.js dev server exited with code ${server.exitCode}.`);
    try {
      const response = await fetch(baseURL, { signal: AbortSignal.timeout(2_000) });
      if (response.ok) return;
    } catch {
      // The server may still be compiling. Retry until the deadline.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Timed out waiting for the Next.js dev server.");
}

process.once("SIGINT", () => {
  void stopServer().finally(() => process.exit(130));
});
process.once("SIGTERM", () => {
  void stopServer().finally(() => process.exit(143));
});

let exitCode = 1;
try {
  await waitForServer();
  const tests = spawn(
    process.execPath,
    ["node_modules/@playwright/test/cli.js", "test", ...process.argv.slice(2)],
    {
      cwd: process.cwd(),
      env: { ...process.env, E2E_BASE_URL: baseURL },
      stdio: "inherit",
      windowsHide: true,
    },
  );
  exitCode = await new Promise((resolve) => tests.once("exit", (code) => resolve(code ?? 1)));
} finally {
  await stopServer();
}

process.exitCode = exitCode;
