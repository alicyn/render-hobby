FROM debian:bookworm-slim

# azcopy v10 is dynamically linked against glibc, so Alpine would need the gcompat shim.
# debian-slim avoids that without much size cost for a once-a-day cron.
# TARGETARCH is populated by buildx (amd64 on Render, arm64 on Apple Silicon) so the
# image matches the host without needing --platform flags.
ARG TARGETARCH
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl \
 && case "$TARGETARCH" in \
      amd64) AZCOPY_URL=https://aka.ms/downloadazcopy-v10-linux ;; \
      arm64) AZCOPY_URL=https://aka.ms/downloadazcopy-v10-linux-arm64 ;; \
      *) echo "unsupported TARGETARCH: $TARGETARCH" >&2; exit 1 ;; \
    esac \
 && curl -sfL "$AZCOPY_URL" -o /tmp/azcopy.tgz \
 && tar xzf /tmp/azcopy.tgz -C /tmp \
 && mv /tmp/azcopy_linux_*/azcopy /usr/local/bin/azcopy \
 && chmod +x /usr/local/bin/azcopy \
 && rm -rf /tmp/azcopy* \
 && apt-get purge -y curl && apt-get autoremove -y \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /scripts
COPY test-upload-azure.sh .
ENTRYPOINT ["bash", "test-upload-azure.sh"]
