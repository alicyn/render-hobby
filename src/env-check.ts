/**
 * Validate that expected env vars are present after loading secrets.
 */

import { ENV_REGISTRY } from "./env-registry.ts"

export function checkRuntimeEnv(): { missing: string[]; warnings: string[] } {
  const missing: string[] = []
  const warnings: string[] = []

  for (const entry of ENV_REGISTRY) {
    const value = process.env[entry.key]
    const isSet = value != null && value.trim().length > 0

    if (isSet) continue

    if (entry.required) {
      missing.push(`${entry.key} — ${entry.description}`)
    } else if (entry.warnIfMissing) {
      warnings.push(`${entry.key} — ${entry.description}`)
    }
  }

  if (missing.length > 0) {
    console.error(
      `[env] ${missing.length} required env var(s) missing:\n${missing.map((m) => `  ✗ ${m}`).join("\n")}`,
    )
  }
  if (warnings.length > 0) {
    console.warn(
      `[env] ${warnings.length} optional env var(s) not set:\n${warnings.map((w) => `  • ${w}`).join("\n")}`,
    )
  }

  return { missing, warnings }
}
