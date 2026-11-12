# McMasterful Books — BVD 103 Assignment 6

Version 1.1.0
This is the initial download of Assignment 6 that was cloned to my new github repository at https://github.com/lpfader/assignment-6a/

Version 1.2.0
hardcoded 11 http://localhost:3000 URLs to become relative /api paths in the /adapter/ folder.

Added Docker-in-Docker to the devcontainer.json leading to a full container rebuild, lol. Now Docker Desktop runs the dev container — the inner daemon runs nginx, front-end, server and mongo.

Created docker-compose.yaml with four services: nginx, front-end, server, mongo.

Created nginx.conf: / proxies to the front-end, /api/ proxies to the server with the prefix stripped.

index.ts avoids a top-level await using async instead of await, so it starts on the node:20 image.