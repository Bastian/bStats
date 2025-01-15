#!/bin/bash

if crontab -l &> /dev/null; then 
  echo "Existing crontab found. Appending to existing one."
  CRONTAB=`crontab -l`
  CRONTAB="${CRONTAB}
"
else
  echo "No existing crontab found. Creating a new one."
  CRONTAB=""
fi

echo "What bucket do you want to backup to? (Format: \"s3://BUCKET[/PREFIX]\", Default: \"s3://bstats-backup\")"

read -r BUCKET

if [ -z "${BUCKET}" ]; then
  echo "No bucket specified. Using default bucket \"s3://bstats-backup\"."
  BUCKET="s3://bstats-backup"
fi


OLD_CRONTAB="$CRONTAB"
CRONTAB="${CRONTAB}5 * * * * cd $PWD && docker compose run redis-backup ./backup.sh ${BUCKET}/hourly/
10 0 * * * cd $PWD && docker compose run --rm redis-backup ./backup.sh ${BUCKET}/daily/
15 0 * * 1 cd $PWD && docker compose run --rm redis-backup ./backup.sh ${BUCKET}/weekly/
20 0 1 * * cd $PWD && docker compose run --rm redis-backup ./backup.sh ${BUCKET}/monthly/
25 0 * * * cd $PWD && rm -rf ./volumes/postgres/database-dump/* && docker compose exec postgres bash -c \"pg_dump -U bstats -Z5 -j 10 -Fd bstats -f /database-dump\" && docker compose run --rm postgres-backup ./backup.sh ${BUCKET}/postgres/
"

diff --color -u <(echo "$OLD_CRONTAB") <(echo "$CRONTAB")

if echo "$OLD_CRONTAB" | grep 'redis-backup' &> /dev/null; then
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