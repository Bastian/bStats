#!/usr/bin/env bash
# redis-user-admin.sh ─ user maintenance for the bStats Redis cluster.
#
#   ./redis-user-admin.sh update-password
#   ./redis-user-admin.sh delete-user
#   ./redis-user-admin.sh rename-plugin

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
    printf "${CYAN}→ Executing '%s'${RESET}\n" "${cmd_pretty}" >&2

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

    read -r -p "New bcrypt hash: " new_hash
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

rename_plugin() {
    [[ $# -eq 0 ]] || die "rename-plugin takes no arguments – it is interactive."

    local plugin_id old_name software_id software new_name old_name_lc software_lc new_name_lc
    read -r -p "Plugin ID to rename: " plugin_id

    info "Current info for plugin ${plugin_id}:"
    redis HGETALL "plugins:${plugin_id}" || true

    old_name=$(redis HGET "plugins:${plugin_id}" name)
    software_id=$(redis HGET "plugins:${plugin_id}" software)
    software=$(redis HGET "software:${software_id}" url)

    read -r -p "New plugin name: " new_name
    printf "${YELLOW}⚠️  This action updates the plugin name and reindexes it!${RESET}\n"
    read -r -p "Proceed? [y/N] " ans
    [[ $ans =~ ^[Yy]$ ]] || die "Aborted."

    old_name_lc=${old_name,,}
    software_lc=${software,,}
    new_name_lc=${new_name,,}

    redis DEL "plugins.index.id.url+name:${software_lc}.${old_name_lc}"
    redis SET "plugins.index.id.url+name:${software_lc}.${new_name_lc}" "${plugin_id}"

    redis HMSET "plugins:${plugin_id}" name "${new_name}"

    # Update charts that might contain the old name
    local charts_json charts_array chart_uid chart_title new_chart_title
    charts_json=$(redis HGET "plugins:${plugin_id}" charts)
    # Strip leading/trailing brackets and quotes for naive array parsing
    charts_json=${charts_json#\[}
    charts_json=${charts_json%\]}
    charts_json=${charts_json//\"/}
    IFS=',' read -r -a charts_array <<< "$charts_json"

    for chart_uid in "${charts_array[@]}"; do
        chart_title=$(redis HGET "charts:${chart_uid}" title || true)
        new_chart_title="${chart_title//$old_name/$new_name}"
        if [[ "$chart_title" != "$new_chart_title" ]]; then
            redis HMSET "charts:${chart_uid}" title "$new_chart_title"
            info "Renamed chart ${chart_uid}; old title: '${chart_title}', new title: '${new_chart_title}'."
        fi
    done

    good "Plugin ${plugin_id} renamed from '${old_name}' to '${new_name}'."
}

#  Dispatcher
[[ $# -ge 1 ]] || die "Commands: update-password, delete-user, rename-plugin"
case $1 in
    update-password) shift; update_password "$@";;
    delete-user)     shift; delete_user     "$@";;
    rename-plugin)   shift; rename_plugin   "$@";;
    *) die "Unknown command: $1";;
esac