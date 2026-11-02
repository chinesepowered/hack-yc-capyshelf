import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/** Loads .env.local into process.env for scripts. Never prints values. */
export function loadEnv() {
  const file = path.join(process.cwd(), ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}
