#!/bin/zsh

set -e

project_dir="/Users/jeffdarcy/Projects/custom-wraps"
port="4173"
url="http://localhost:${port}/studio/"

cd "$project_dir"
open "$url"
echo "Relic Forge Family Wrap Studio is running at $url"
echo "Leave this window open while you design. Press Control-C to stop."
python3 -m http.server "$port"
