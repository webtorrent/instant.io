#!/bin/sh
# Trigger a deploy on server
set -e

figlet "Deploying..."
git push
ssh webtorrent -t zsh -ci "/home/feross/www/instant.io/tools/deploy.sh"
curl https://api.rollbar.com/api/1/deploy/ -F access_token=$(node -p 'require("./secret").rollbar.accessToken') -F environment=production -F revision=$(git log -n 1 --pretty=format:"%H") -F local_username=$(whoami)
figlet "Deployed"
