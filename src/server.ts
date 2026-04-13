/**
 * Test server: fetches env vars from Infisical, validates them, serves status.
 */

import { loadSecrets } from "./load-secrets"
import { checkRuntimeEnv } from "./env-check"
import { ENV_REGISTRY } from "./env-registry"

const PORT = Number(process.env.PORT ?? "3000")

let startup: {
  loaded: string[]
  skipped: string[]
  missing: string[]
  warnings: string[]
  error?: string
  runtime: string
}

async function init() {
  const runtime =
    typeof globalThis.Bun !== "undefined"
      ? `Bun ${Bun.version}`
      : `Node ${process.version}`

  console.log(`[startup] Runtime: ${runtime}`)

  let loaded: string[] = []
  let skipped: string[] = []
  let error: string | undefined

  const projectId = process.env.INFISICAL_PROJECT_ID
  if (!projectId) {
    error = "INFISICAL_PROJECT_ID not set"
    console.error(`[startup] ${error}`)
  } else {
    try {
      const result = await loadSecrets({
        projectId,
        environment: process.env.INFISICAL_ENVIRONMENT ?? "prod",
        secretPath: process.env.INFISICAL_SECRET_PATH ?? "/",
        siteUrl: process.env.INFISICAL_SITE_URL,
      })
      loaded = result.loaded
      skipped = result.skipped
    } catch (err) {
      error = (err as Error).message
      console.error(`[startup] Infisical fetch failed: ${error}`)
    }
  }

  const { missing, warnings } = checkRuntimeEnv()
  startup = { loaded, skipped, missing, warnings, error, runtime }
  console.log(
    `[startup] Validation: ${missing.length} missing, ${warnings.length} warnings`,
  )
}

function handle(req: Request): Response {
  const url = new URL(req.url)

  if (url.pathname === "/health") {
    return Response.json({ status: "ok", runtime: startup?.runtime })
  }

  if (url.pathname === "/status") {
    const vars = ENV_REGISTRY.map((e) => {
      const val = process.env[e.key]
      const isSet = val != null && val.trim().length > 0
      let source = "unset"
      if (startup?.loaded.includes(e.key)) source = "infisical"
      else if (startup?.skipped.includes(e.key)) source = "render-ui"
      else if (isSet) source = "pre-existing"
      return { key: e.key, set: isSet, required: e.required, source }
    })
    return Response.json({ ...startup, vars })
  }

  return Response.json({
    app: "infisical-render-test",
    endpoints: ["/health", "/status"],
    runtime: startup?.runtime,
  })
}

await init()

if (typeof globalThis.Bun !== "undefined") {
  Bun.serve({ port: PORT, fetch: handle })
} else {
  const { createServer } = await import("node:http")
  createServer(async (req, res) => {
    const host = req.headers.host ?? `localhost:${PORT}`
    const request = new Request(`http://${host}${req.url}`, {
      method: req.method,
    })
    const response = handle(request)
    const body = await response.text()
    res.writeHead(response.status, {
      "Content-Type":
        response.headers.get("Content-Type") ?? "application/json",
    })
    res.end(body)
  }).listen(PORT)
}

console.log(`[startup] Listening on port ${PORT}`)
