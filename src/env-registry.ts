/**
 * Registry of env vars this test app expects to be present at runtime.
 * Used to validate that Infisical secrets were loaded correctly.
 */

export type EnvVar = {
  key: string
  description: string
  required: boolean
  warnIfMissing?: boolean
}

export const ENV_REGISTRY: EnvVar[] = [
  // Bootstrap — set in Render UI, not fetched from Infisical
  {
    key: "INFISICAL_CLIENT_ID",
    description: "Universal Auth machine identity client ID",
    required: true,
  },
  {
    key: "INFISICAL_CLIENT_SECRET",
    description: "Universal Auth machine identity client secret",
    required: true,
  },

  // Fetched from Infisical — fake vars for testing the pipeline
  {
    key: "TEST_DATABASE_URL",
    description: "Fake database connection string",
    required: true,
  },
  {
    key: "TEST_API_KEY",
    description: "Fake third-party API key",
    required: true,
  },
  {
    key: "TEST_SIGNING_SECRET",
    description: "Fake webhook signing secret",
    required: true,
  },
  {
    key: "TEST_OPTIONAL_FLAG",
    description: "Optional feature flag for testing",
    required: false,
    warnIfMissing: true,
  },
  {
    key: "PORT",
    description: "Server listen port (defaults to 3000)",
    required: false,
  },
]
