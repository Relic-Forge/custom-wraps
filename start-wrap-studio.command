#!/bin/zsh

set -e

project_dir="${0:A:h}"
port="4173"
url="http://localhost:${port}/studio/"

cd "$project_dir"
if [[ ! -f studio/vendor/three.module.js ]]; then
  npm ci
  npm run prepare:studio
fi
if curl --silent --fail "$url" > /dev/null; then
  open "$url"
  exit 0
fi
open "$url"
echo "Relic Forge Family Wrap Studio is running at $url"
echo "Leave this window open while you design. Press Control-C to stop."
python3 -m http.server "$port" --bind 127.0.0.1
