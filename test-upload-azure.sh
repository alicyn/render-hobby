#!/bin/bash
# Smoke test: write a small timestamped file to Azure Blob Storage from a Render cron.
# Proves the Service-Principal -> azcopy -> blob container path works before wiring pg_dump.
#
# Required env vars (set on the Render cron service or in your local shell):
#   AZURE_TENANT_ID            Entra tenant for the Service Principal
#   AZURE_CLIENT_ID            SP application (client) ID
#   AZURE_CLIENT_SECRET        SP client secret
#   AZURE_STORAGE_ACCOUNT      target storage account name (no fqdn)
#   AZURE_STORAGE_CONTAINER    target blob container name
#
# Local docker invocation (passes through the five vars from the host shell):
#   docker build -t pg-backup-smoke scripts/postgres-backup/
#   docker run --rm \
#     -e AZURE_TENANT_ID -e AZURE_CLIENT_ID -e AZURE_CLIENT_SECRET \
#     -e AZURE_STORAGE_ACCOUNT -e AZURE_STORAGE_CONTAINER \
#     pg-backup-smoke

set -o errexit -o nounset -o pipefail

# azcopy auto-login via service principal; no interactive 'azcopy login' needed.
export AZCOPY_AUTO_LOGIN_TYPE=SPN
export AZCOPY_SPA_APPLICATION_ID="$AZURE_CLIENT_ID"
export AZCOPY_SPA_CLIENT_SECRET="$AZURE_CLIENT_SECRET"
export AZCOPY_TENANT_ID="$AZURE_TENANT_ID"

timestamp=$(date -u +%Y-%m-%dT%H-%M-%SZ)
local_path=$(mktemp)
trap 'rm -f "$local_path"' EXIT

printf 'hello from render cron at %s\n' "$timestamp" > "$local_path"

remote_url="https://${AZURE_STORAGE_ACCOUNT}.blob.core.windows.net/${AZURE_STORAGE_CONTAINER}/smoke/test-${timestamp}.txt"

echo "Uploading smoke-test file to ${remote_url}..."
azcopy copy "$local_path" "$remote_url" --from-to=LocalBlob
echo "Done."
