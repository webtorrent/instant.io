#!/bin/bash
# Update code and restart server (run on server)
set -e

if [ -d "/home/feross/www/build-instant.io" ]; then
  echo "ERROR: Build folder exists. Is another build in progress?"
  exit 1
fi

if [ -d "/home/feross/www/old-instant.io" ]; then
  echo "ERROR: Old folder exists. Did a previous build crash?"
  exit 1
fi

cp -R /home/feross/www/instant.io /home/feross/www/build-instant.io

cd /home/feross/www/build-instant.io && git pull
cd /home/feross/www/build-instant.io && rm -rf node_modules
cd /home/feross/www/build-instant.io && npm ci --no-progress
cd /home/feross/www/build-instant.io && npm run build --if-present
cd /home/feross/www/build-instant.io && npm prune --production --no-progress

sudo supervisorctl stop instant

cd /home/feross/www && mv instant.io old-instant.io
cd /home/feross/www && mv build-instant.io instant.io

sudo supervisorctl start instant

cd /home/feross/www && rm -rf old-instant.io
