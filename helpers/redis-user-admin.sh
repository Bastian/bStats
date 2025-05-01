#!/usr/bin/env bash
# redis-user-admin.sh ─ user maintenance for the bStats Redis cluster.
#
#   ./redis-user-admin.sh update-password
#   ./redis-user-admin.sh delete-user

set -euo pipefail

# Colors
RESET="\033[0m"
RED="\033[31m"
GREEN="\033[32m"
YELLOW="\033[33m"
BLUE="\033[34m"
CYAN="\033[36m"

# Config
REMOTE_HOST="bstats"                   # SSH host (hostname or SSH config stanza)
REDIS_CONTAINER="prod-redis-node-1m-1" # Docker container name
SSH="ssh -o LogLevel=ERROR"

info() { printf "${BLUE}ℹ️  %s${RESET}\n" "$*"; }
good() { printf "${GREEN}✅ %s${RESET}\n" "$*"; }
die()  { printf "${RED}❌ %s${RESET}\n" "$*"; exit 1; }

# quote each word like the shell’s %q so that $, \, … survive the SSH hop
quote_each() {
    local out="" w
    for w in "$@"; do out+=" $(printf '%q' "$w")"; done
    printf '%s' "${out# }"
}

# run redis-cli inside the container, show the command first
redis() {
    [[ $# -gt 0 ]] || die "redis(): missing arguments"

    # pretty print the command only
    local cmd_pretty
    cmd_pretty=$(printf '%s ' "$@"); cmd_pretty=${cmd_pretty% }
    printf "${CYAN}→ Executing '%s'${RESET}\n" "${cmd_pretty}"

    # build remote command with safe quoting
    local remote_cmd
    remote_cmd="docker exec -i ${REDIS_CONTAINER} redis-cli -c $(quote_each "$@")"
    ${SSH} "${REMOTE_HOST}" "${remote_cmd}"
}

update_password() {
    [[ $# -eq 0 ]] || die "update-password takes no arguments – it is interactive."

    local user new_hash
    read -r -p "Username: " user
    user=${user,,}

    info "Current password hash for ${user}:"
    redis HMGET "users:${user}" password || true

    read -r -p "New bcrypt / argon2 hash: " new_hash
    read -r -p "Really store the new hash? [y/N] " ans
    [[ $ans =~ ^[Yy]$ ]] || die "Aborted."

    redis HMSET "users:${user}" password "${new_hash}"
    good "Password updated for ${user}."
}

delete_user() {
    [[ $# -eq 0 ]] || die "delete-user takes no arguments – it is interactive."

    local user
    read -r -p "Username to delete: " user
    user=${user,,}

    info "Data that will be removed for ${user}:"
    redis HGETALL   "users:${user}"                        || true
    redis SISMEMBER "users.usernames" "${user}"            || true
    redis SMEMBERS  "users.index.plugins.username:${user}" || true

    printf "${YELLOW}⚠️  This action is irreversible!${RESET}\n"
    read -r -p "Delete ALL of the above? [y/N] " ans
    [[ $ans =~ ^[Yy]$ ]] || die "Aborted."

    redis DEL  "users:${user}"
    redis SREM "users.usernames" "${user}"
    redis DEL  "users.index.plugins.username:${user}"

    good "User ${user} removed completely."
}

#  Dispatcher
[[ $# -ge 1 ]] || die "Commands: update-password, delete-user"
case $1 in
    update-password) shift; update_password "$@";;
    delete-user)     shift; delete_user     "$@";;
    *) die "Unknown command: $1";;
esac
