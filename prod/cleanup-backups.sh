#!/usr/bin/env bash

# cleanup_backups.sh
# This script cleans up old backup files on a remote SCP destination.
# It connects via SSH, lists files, determines which are older than the retention period,
# and deletes them individually.

# Exit immediately if a command exits with a non-zero status
set -e

# Function to display usage information
usage() {
    echo "Usage: $0 <SCP_DEST> [SCP_PORT]"
    echo "  SCP_DEST: Remote destination in the format user@host:/path/"
    echo "  SCP_PORT: (Optional) SSH port number, default is 22"
    echo ""
    echo "Example:"
    echo "  $0 user@remotehost:/path/to/backups/ 2222"
    exit 1
}

# Check if at least one argument (SCP_DEST) is provided
if [ $# -lt 1 ]; then
    echo "ERROR: Missing required SCP_DEST argument."
    usage
fi

SCP_DEST="$1"
SCP_PORT="${2:-22}"  # Default to port 22 if not provided

# Validate SCP_DEST format
if [[ ! "$SCP_DEST" =~ ^[^@]+@[^:]+:/.*$ ]]; then
    echo "ERROR: SCP_DEST must be in the format user@host:/path/"
    usage
fi

# Extract remote user, host, and base path
REMOTE_USER=$(echo "$SCP_DEST" | cut -d '@' -f 1)
REMOTE_HOST=$(echo "$SCP_DEST" | cut -d '@' -f 2 | cut -d ':' -f 1)
REMOTE_BASE_PATH=$(echo "$SCP_DEST" | cut -d ':' -f 2)

# Ensure REMOTE_BASE_PATH ends with a slash
[[ "$REMOTE_BASE_PATH" != */ ]] && REMOTE_BASE_PATH="${REMOTE_BASE_PATH}/"

# Define backup types and their retention periods in days
declare -A BACKUP_RETENTION=(
    # Redis
    ["hourly"]=2
    ["daily"]=7
    ["weekly"]=28
    ["monthly"]=365

    # Postgres (all tables except historic_line_chart_data)
    ["postgres_rest_hourly"]=2
    ["postgres_rest_daily"]=7
    ["postgres_rest_weekly"]=28
    ["postgres_rest_monthly"]=365

    # Postgres (only historic_line_chart_data)
    ["postgres_hlcd_daily"]=7
)

# Function to clean up backups for a specific type
cleanup_backup_type() {
    local type="$1"
    local retention_days="$2"
    local remote_dir="${REMOTE_BASE_PATH}${type}"

    echo "Cleaning up '${type}' backups in '${remote_dir}' older than ${retention_days} days..."

    # Get current epoch time
    current_time=$(date +%s)

    # List files in the remote directory
    files=$(ssh -p "${SCP_PORT}" "${REMOTE_USER}@${REMOTE_HOST}" "ls '${remote_dir}' || echo ''")

    if [ -z "$files" ]; then
        echo "No files found in '${remote_dir}'. Skipping."
        echo "------------------------------------------------------------"
        return
    fi

    # Process each file
    while IFS= read -r file; do
        # Skip empty lines
        [ -z "$file" ] && continue

        # Extract date from filename, assuming format: backup-YYYY-MM-DD_HH-MM-SS.tar.gz
        if [[ "$file" =~ backup-([0-9]{4})-([0-9]{2})-([0-9]{2})_([0-9]{2})-([0-9]{2})-([0-9]{2})\.tar\.gz ]]; then
            year="${BASH_REMATCH[1]}"
            month="${BASH_REMATCH[2]}"
            day="${BASH_REMATCH[3]}"
            hour="${BASH_REMATCH[4]}"
            minute="${BASH_REMATCH[5]}"
            second="${BASH_REMATCH[6]}"

            # Convert file date to epoch
            file_time=$(date -d "${year}-${month}-${day} ${hour}:${minute}:${second}" +%s 2>/dev/null)
            if [ -z "$file_time" ]; then
                echo "Failed to parse date for file '${file}'. Skipping."
                continue
            fi

            # Calculate age in days
            age_seconds=$((current_time - file_time))
            age_days=$(( age_seconds / 86400 ))

            if [ "$age_days" -gt "$retention_days" ]; then
                echo "Deleting '${file}' (Age: ${age_days} days)..."
                # Delete the file via SSH
                ssh -p "${SCP_PORT}" "${REMOTE_USER}@${REMOTE_HOST}" "rm '${remote_dir}/${file}'" && \
                echo "Deleted '${file}' successfully." || \
                echo "Failed to delete '${file}'."
            else
                echo "Keeping '${file}' (Age: ${age_days} days)."
            fi
        else
            echo "Filename '${file}' does not match expected pattern. Skipping."
        fi
    done <<< "$files"

    echo "------------------------------------------------------------"
}

# Main cleanup process
echo "Starting backup cleanup process..."
echo "Remote Host: ${REMOTE_USER}@${REMOTE_HOST}"
echo "Remote Base Path: ${REMOTE_BASE_PATH}"
echo "SSH Port: ${SCP_PORT}"
echo "------------------------------------------------------------"

for type in "${!BACKUP_RETENTION[@]}"; do
    cleanup_backup_type "$type" "${BACKUP_RETENTION[$type]}"
done

echo "Backup cleanup process completed successfully."