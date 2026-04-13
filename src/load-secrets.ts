/**
 * Fetch secrets from Infisical using @infisical/sdk with Universal Auth.
 *
 * Only two bootstrap secrets need to be set in Render's UI:
 *   - INFISICAL_CLIENT_ID
 *   - INFISICAL_CLIENT_SECRET
 *
 * Everything else is fetched programmatically and written to process.env.
 *
 * Bun/NAPI-RS note:
 * @infisical/sdk uses NAPI-RS (Rust compiled to native Node-API bindings).
 * Bun's JavaScriptCore runtime can have edge cases vs Node's V8 when loading
 * native modules. If Bun fails to load the SDK, use `npm run start:node`
 * (requires Node 20+).
 */

import { InfisicalSDK } from "@infisical/sdk"

export async function loadSecrets(opts: {
  projectId: string
  environment: string
  secretPath?: string
  siteUrl?: string
}): Promise<{ loaded: string[]; skipped: string[] }> {
  const clientId = process.env.INFISICAL_CLIENT_ID
  const clientSecret = process.env.INFISICAL_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error(
      "INFISICAL_CLIENT_ID and INFISICAL_CLIENT_SECRET must be set in Render env vars.",
    )
  }

  const client = new InfisicalSDK({
    siteUrl: opts.siteUrl,
  })

  await client.auth().universalAuth.login({ clientId, clientSecret })

  const response = await client.secrets().listSecrets({
    projectId: opts.projectId,
    environment: opts.environment,
    secretPath: opts.secretPath ?? "/",
    expandSecretReferences: true,
    includeImports: true,
    viewSecretValue: true,
  })

  const loaded: string[] = []
  const skipped: string[] = []

  for (const secret of response.secrets) {
    if (process.env[secret.secretKey] != null) {
      skipped.push(secret.secretKey)
    } else {
      process.env[secret.secretKey] = secret.secretValue
      loaded.push(secret.secretKey)
    }
  }

  console.log(
    `[infisical] Loaded ${loaded.length} secret(s), skipped ${skipped.length} already-set`,
  )

  return { loaded, skipped }
}
