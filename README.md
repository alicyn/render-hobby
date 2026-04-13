# infisical-render-test

Test app for validating the Infisical → `process.env` pipeline on Render.

## How it works

1. Bootstrap secrets (`INFISICAL_CLIENT_ID`, `INFISICAL_CLIENT_SECRET`, `INFISICAL_PROJECT_ID`) are set in Render's env vars UI
2. On startup, the app authenticates with Infisical using Universal Auth (machine identity)
3. All project secrets are fetched and loaded into `process.env`
4. The env registry is validated — any missing required vars are logged
5. HTTP server starts with `/health` and `/status` endpoints

## Endpoints

| Path | Description |
|------|-------------|
| `/` | App info |
| `/health` | Health check |
| `/status` | Which vars are set, their source (infisical/render-ui/unset), validation results |

## Deploy to Render

1. Push to GitHub
2. In Render: **New → Blueprint** → point to this repo
3. Set env vars in the dashboard:
   - `INFISICAL_CLIENT_ID`
   - `INFISICAL_CLIENT_SECRET`
   - `INFISICAL_PROJECT_ID`
4. Optionally set `INFISICAL_ENVIRONMENT` (defaults to `prod`)

## Test secrets to create in Infisical

Create these in your Infisical project to exercise the pipeline:

- `TEST_DATABASE_URL` — any fake connection string
- `TEST_API_KEY` — any fake API key
- `TEST_SIGNING_SECRET` — any fake secret
- `TEST_OPTIONAL_FLAG` — optional, triggers a warning if missing

## Bun / NAPI-RS compatibility

`@infisical/sdk` uses NAPI-RS (Rust → native Node-API bindings). Bun's JavaScriptCore runtime can have edge cases vs Node's V8. The `render.yaml` defaults to Node.js to avoid this. Change the start command to `bun src/server.ts` to test with Bun.

## Local dev

```bash
export INFISICAL_CLIENT_ID=...
export INFISICAL_CLIENT_SECRET=...
export INFISICAL_PROJECT_ID=...

# Bun
bun src/server.ts

# Node fallback
node --experimental-strip-types src/server.ts
```
