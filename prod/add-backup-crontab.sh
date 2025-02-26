#!/usr/bin/env bash

if crontab -l &> /dev/null; then
  echo "Existing crontab found. Appending to existing one."
  CRONTAB=$(crontab -l)
  CRONTAB="${CRONTAB}
"
else
  echo "No existing crontab found. Creating a new one."
  CRONTAB=""
fi

echo "What SCP destination do you want to backup to? (Format: \"user@host:/path/\")"
read -r SCP_DEST

# Validate SCP_DEST format
if [[ ! "$SCP_DEST" =~ ^[^@]+@[^:]+:/.*$ ]]; then
    echo "ERROR: SCP_DEST must be in the format user@host:/path/"
    exit 0
fi

echo "Enter the SCP port you want to use (default: 22):"
read -r SCP_PORT

# Use default port 22 if no port is specified
SCP_PORT="${SCP_PORT:-22}"

OLD_CRONTAB="$CRONTAB"

CRONTAB="${CRONTAB}5 * * * * cd $PWD && ./backup.sh ${SCP_DEST}hourly ${PWD}/volumes/redis ${SCP_PORT}
10 0 * * * cd $PWD && ./backup.sh ${SCP_DEST}daily ${PWD}/volumes/redis ${SCP_PORT}
15 0 * * 1 cd $PWD && ./backup.sh ${SCP_DEST}weekly ${PWD}/volumes/redis ${SCP_PORT}
20 0 1 * * cd $PWD && ./backup.sh ${SCP_DEST}monthly ${PWD}/volumes/redis ${SCP_PORT}
25 0 * * * cd $PWD && rm -rf ./volumes/postgres/database-dump/* && docker compose exec postgres bash -c \"pg_dump -U bstats -Z5 -j 10 -Fd bstats -f /database-dump\" && ./backup.sh ${SCP_DEST}postgres ${PWD}/volumes/postgres/database-dump ${SCP_PORT}
0 * * * * cd $PWD && ./cleanup-backups.sh ${SCP_DEST} ${SCP_PORT}
"

diff --color -u <(echo "$OLD_CRONTAB") <(echo "$CRONTAB")

if echo "$OLD_CRONTAB" | grep './backup.sh' &> /dev/null; then
  echo -e "\033[0;33mWARNING\033[0m Found existing backup job in crontab. Please double-check the results before saving"
fi

echo "Do you want to save this crontab? (y/N)"
read -r ANSWER

if [[ "$ANSWER" =~ ^([yY][eE][sS]|[yY])$ ]]; then
  echo "Crontab saved."
  echo "$CRONTAB" > crontab_bstats_backup.tmp
  crontab crontab_bstats_backup.tmp
  rm crontab_bstats_backup.tmp
else
  echo "Crontab not saved."
fi