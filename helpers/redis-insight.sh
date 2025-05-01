#!/usr/bin/env bash
# redis-insight.sh ─ start/refresh RedisInsight remotely and tunnel it to localhost
set -euo pipefail

REMOTE_HOST="bstats"           # SSH host (hostname or SSH config stanza)
CONTAINER_NAME="redisinsight"  # Docker container name
DOCKER_NETWORK="prod_default"  # Docker network on remote host
REDIS_HOST="redis-node-1m"     # Redis host that RedisInsight should talk to
LOCAL_PORT=4321                # Port on *your* computer
REMOTE_PORT=5540               # Port exposed by RedisInsight inside the container

cleanup() {
    trap - EXIT
    echo "🗑️  Stopping and removing '${CONTAINER_NAME}' on ${REMOTE_HOST} ..."
    ssh -o LogLevel=ERROR "${REMOTE_HOST}" \
        "docker rm -f ${CONTAINER_NAME} >/dev/null 2>&1 || true" || true
    echo "👋  Done."
}
trap cleanup EXIT

echo "🔄  Launching/refreshing RedisInsight container on ${REMOTE_HOST} …"

CONTAINER_IP=$(ssh -o LogLevel=ERROR "${REMOTE_HOST}" bash -s -- \
     "${CONTAINER_NAME}" "${DOCKER_NETWORK}" "${REDIS_HOST}" <<'REMOTE'
CN=$1 NET=$2 RH=$3
if ! docker ps --format '{{.Names}}' | grep -q "^${CN}$"; then
  echo "  🐳  Starting container '${CN}' on network '${NET}' …" >&2
  docker rm -f "${CN}" >/dev/null 2>&1 || true
  docker run -d --name "${CN}" --network "${NET}" \
         -e IS_CLUSTER=true -e RI_REDIS_HOST="${RH}" \
         redis/redisinsight:latest >/dev/null
else
  echo "  ⚙️  Container '${CN}' already running." >&2
fi
docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "${CN}"
REMOTE
)
CONTAINER_IP=${CONTAINER_IP//[[:space:]]/}

echo "✅  RedisInsight is running on ${CONTAINER_IP}"
echo -n "⏳  Waiting for RedisInsight to accept connections …"
until ssh -o LogLevel=ERROR "${REMOTE_HOST}" \
       "bash -c '</dev/tcp/${CONTAINER_IP}/${REMOTE_PORT}'" \
       >/dev/null 2>&1; do
  sleep 0.5
done
echo " done."

echo "⏩  Forwarding localhost:${LOCAL_PORT} → ${CONTAINER_IP}:${REMOTE_PORT} (Ctrl-C to stop)"
ssh -N \
    -o ExitOnForwardFailure=yes \
    -o LogLevel=ERROR \
    -L "${LOCAL_PORT}:${CONTAINER_IP}:${REMOTE_PORT}" \
    "${REMOTE_HOST}"
