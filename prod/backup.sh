#!/bin/sh

# Create s3cmd config file with access and secret keys
echo "[default]" >> "/root/.s3cfg"
echo "access_key=${AWS_ACCESS_KEY}" >> "/root/.s3cfg"
echo "secret_key=${AWS_SECRET_KEY}" >> "/root/.s3cfg"

BUCKET="$1"
if [ ! $# -ge 1 ]; then 
  echo "Missing bucket"
  exit 1
fi

# Delete possible older copies
rm -rf backup-copy

# Make a copy of the files before zipping them
cp -R backup-src backup-copy

# Zip the files
FILE_NAME="backup-$(date +"%Y-%m-%d_%H-%M-%S").tar.gz"
tar -czf ${FILE_NAME} backup-copy

# Delete the copy
rm -rf backup-copy

# Upload backup to remote server
s3cmd put ${FILE_NAME} ${BUCKET}

rm ${FILE_NAME}