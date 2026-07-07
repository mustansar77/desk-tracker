import * as fs from "node:fs";
import * as path from "node:path";
import { app } from "electron";

// The packaged app has no visible console, so failures (e.g. a screenshot
// capture throwing) would otherwise vanish silently. Writing to a plain file
// means an admin can actually diagnose a report like "no screenshots showing
// up" by asking the employee to open this file.
const logPath = path.join(app.getPath("userData"), "agent.log");

export function logError(context: string, err: unknown): void {
  const message = err instanceof Error ? (err.stack ?? err.message) : String(err);
  const line = `[${new Date().toISOString()}] ${context}: ${message}\n`;
  console.error(line);
  try {
    fs.appendFileSync(logPath, line);
  } catch {
    // If we can't even write the log file, there's nothing more we can do.
  }
}

export function getLogPath(): string {
  return logPath;
}
