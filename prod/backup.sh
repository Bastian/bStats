#!/usr/bin/env bash

# Check if at least two arguments are provided: destination and backup source
if [ $# -lt 2 ]; then 
    echo "Usage: $0 <destination> <backup_source> [port]"
    echo "ERROR: Missing required parameters. Destination and backup source are mandatory."
    exit 1
fi

DESTINATION="$1"
BACKUP_SRC="$2"
PORT="${3:-22}"  # Default to port 22 if not provided

BACKUP_TMP=$(mktemp -d /tmp/backup-copy-XXXXXX)

if [ ! -d "${BACKUP_TMP}" ]; then
    echo "ERROR: Failed to create temporary directory in /tmp."
    exit 1
fi

# Ensure the temporary directory is removed on script exit
trap 'rm -rf "${BACKUP_TMP}"' EXIT

# Create a subdirectory inside the temporary directory for archives
mkdir -p "${BACKUP_TMP}/archives"

# Create a copy of the source directory for backup
cp -R "${BACKUP_SRC}" "${BACKUP_TMP}"
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to copy backup source from ${BACKUP_SRC} to ${BACKUP_TMP}."
    exit 1
fi

# Get the base name of the backup source
BACKUP_SRC_BASENAME=$(basename "${BACKUP_SRC}")

# Create a compressed archive of the backup inside the archives subdirectory
FILE_NAME="archives/backup-$(date +"%Y-%m-%d_%H-%M-%S").tar.gz"
tar -czf "${BACKUP_TMP}/${FILE_NAME}" -C "${BACKUP_TMP}" "${BACKUP_SRC_BASENAME}"
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to create archive ${FILE_NAME}."
    exit 1
fi

# Extract remote host and path
REMOTE="${DESTINATION%:*}"
REMOTE_PATH="${DESTINATION#*:}"

# Create remote directory if it doesn't exist
ssh -p "${PORT}" "${REMOTE}" "mkdir -p ${REMOTE_PATH}" || {
    echo "ERROR: Failed to create directory ${REMOTE_PATH} on ${REMOTE}."
    exit 1
}

# Transfer the backup archive to the remote destination using SCP with the specified port
scp -P "${PORT}" "${BACKUP_TMP}/${FILE_NAME}" "${DESTINATION}"
if [ $? -eq 0 ]; then
    echo "INFO: Backup ${FILE_NAME} successfully uploaded to ${DESTINATION} on port ${PORT}."
    # Remove the local backup archive after successful transfer
    rm "${BACKUP_TMP}/${FILE_NAME}"
else
    echo "ERROR: Failed to upload backup ${FILE_NAME} to ${DESTINATION} on port ${PORT}."
    exit 1
fi