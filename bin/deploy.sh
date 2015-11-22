#!/bin/bash
# Update code and restart server (run from app server)
trap 'exit' ERR

if [ -d "/home/feross/www/instant.io-build" ]; then
  echo "ERROR: Build folder already exists. Is another build in progress?"
  exit 1
fi

cp -R /home/feross/www/instant.io /home/feross/www/instant.io-build

cd /home/feross/www/instant.io-build && git pull
cd /home/feross/www/instant.io-build && rm -rf node_modules
cd /home/feross/www/instant.io-build && npm install --quiet
cd /home/feross/www/instant.io-build && npm run build

sudo supervisorctl stop instant

cd /home/feross/www && mv instant.io instant.io-old
cd /home/feross/www && mv instant.io-build instant.io

sudo supervisorctl start instant

cd /home/feross/www && rm -rf instant.io-old
