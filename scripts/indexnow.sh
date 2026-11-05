#!/bin/zsh
# Tell Bing, Yandex and the other IndexNow engines that pages changed, so they recrawl now instead of eventually.
# usage: scripts/indexnow.sh            (every page in the sitemap)
#        scripts/indexnow.sh now/      (just these paths)
cd "$(dirname "$0")/.."
KEY=$(ls [0-9a-f]*.txt | head -1 | sed 's/\.txt$//')
HOST=harshitashyale.com
if [ $# -gt 0 ]; then urls=("${@/#/https://$HOST/}"); else urls=(${(f)"$(grep -o '<loc>[^<]*' sitemap.xml | sed 's/<loc>//')"}); fi
json=$(printf '"%s",' "${urls[@]}"); json="[${json%,}]"
curl -s -o /dev/null -w "IndexNow: %{http_code} for ${#urls} url(s)\n" -X POST https://api.indexnow.org/indexnow \
  -H 'Content-Type: application/json; charset=utf-8' \
  -d "{\"host\":\"$HOST\",\"key\":\"$KEY\",\"keyLocation\":\"https://$HOST/$KEY.txt\",\"urlList\":$json}"
