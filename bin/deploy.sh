#!/bin/sh
# Update code and restart server (run from app server)
trap 'exit' ERR

sudo supervisorctl reload
sleep 3
sudo supervisorctl stop instant
cd /home/feross/www/instant.io && git pull
cd /home/feross/www/instant.io && rm -rf node_modules
cd /home/feross/www/instant.io && npm install --quiet
cd /home/feross/www/instant.io && npm run build
sudo supervisorctl start instant
