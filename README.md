# McMasterful Books — BVD 103 Assignment 6

Version 1.1.0
This is the initial download of Assignment 6 that was cloned to my new github repository at https://github.com/lpfader/assignment-6a/

Version 1.2.0
hardcoded 11 http://localhost:3000 URLs to become relative /api paths in the /adapter/ folder.

Added Docker-in-Docker to the devcontainer.json leading to a full container rebuild, lol. Now Docker Desktop runs the dev container — the inner daemon runs nginx, front-end, server and mongo.

Created docker-compose.yaml with four services: nginx, front-end, server, mongo.

Created nginx.conf: / proxies to the front-end, /api/ proxies to the server with the prefix stripped.

index.ts avoids a top-level await using async instead of await, so it starts on the node:20 image.

Version 1.3.0
Added two more API replicas named yi, er and san in docker-compose.yaml, defined once with a YAML anchor, and set up round-robin load balancing between them with an nginx upstream block.

Added proxy caching to nginx.conf for the front-end, book details. Everything else under /api/ stays uncached. Nginx now keeps a local copy of the answer.

Added X-Cache-Status and X-Upstream response headers so the cache and load balancing can be seen while testing.

The adapter sends an X-Book-Filters header whenever filters are applied, and nginx bypasses and refuses to store those responses, so filtered results are never served from the cache.

Used eslint and then created .prettierignore and .prettiercc since running prettier would add unnecessary characters.

Ran ESLint and prettier. Prettier edited every single file. I'm hoping nothing broke.

Deepseek told me to test bypassing for filter requests:
curl -s -o /dev/null -D - -X POST http://localhost:8080/api/books/list \
  -H 'X-Book-Filters: 1' -H 'Content-Type: application/json' \
  -d '[{"name":"crichton"}]' | grep -i x-cache
