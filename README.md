# McMasterful Books — BVD 103 Assignment 6

## What this is

The McMasterful Books backend — a Koa + tsoa API on MongoDB — plus the deployment
around it: nginx in front, the storefront and a pool of API servers behind it,
all on one origin.

## Setup

You need Docker Desktop, and VS Code with the Dev Containers extension.

1. Open this folder in VS Code.
2. `Ctrl+Shift+P` → **Dev Containers: Reopen in Container**.
3. In the container terminal: `npm install`

The dev container has Node, Java (needed by the OpenAPI generator), and its own
Docker daemon, so `docker compose` works inside it.

## Running it

```bash
./generate-openapi.sh      # builds build/swagger.json and the client/ SDK
docker compose up -d       # nginx, front-end, three API servers, mongo
```

Forward port 8080 (VS Code **Ports** tab), then open:

- http://localhost:8080 — the storefront
- http://localhost:8080/api/docs — Swagger UI

Everything is served from port 8080. nginx sends `/` to the front-end and `/api/`
to one of the three API servers, in turn.

## Testing

```bash
npm run test:ci
```

Ten test files, twenty-nine tests. Each test file starts its own in-memory MongoDB, so the tests don't need `docker compose` running and never touch your real data. The first run also regenerates the OpenAPI client, which takes a few minutes.

## Warehouse API examples

Put five copies of a book on a shelf:

```
PUT /api/warehouse/65f1c0ffee1234567890abcd/shelf_1/5
```

Response: `201 Created`, empty body.

Read back which shelves hold a book:

```
GET /api/warehouse/65f1c0ffee1234567890abcd
```

```json
{ "shelf_1": 5 }
```

Fulfil an order, taking one copy off `shelf_1`:

```
PUT /api/fulfil/65f1c0ffee1234567890abce
{ "booksFulfilled": [ { "book": "65f1c0ffee1234567890abcd", "shelf": "shelf_1", "numberOfBooks": 1 } ] }
```

Response: `201 Created`. A follow-up `GET /api/warehouse/...` now reports `4`.

## Two compose files, on purpose

- `.devcontainer/docker-compose.yml` defines the **dev container** itself.
- `docker-compose.yaml` in the root defines the **deployed stack**.

They do different jobs. Only the root file is what the site runs from.

## Known limitations

- The catalogue starts **empty**. There is no seed data, so a fresh clone shows an
  empty storefront until books are added through the UI or `POST /api/books`.
- Book search is a `$regex` scan rather than an indexed search. Correct, but it
  gets slower as the catalogue grows.
- The cache is stored inside the nginx container, so it is empty after a rebuild.
  Requests then start at `MISS` until it warms up again.


## Version 1.1.0

This is the initial download of Assignment 6 that was cloned to my new github repository at https://github.com/lpfader/assignment-6a/

## Version 1.2.0

hardcoded 11 http://localhost:3000 URLs to become relative /api paths in the /adapter/ folder.

Added Docker-in-Docker to the devcontainer.json leading to a full container rebuild, lol. Now Docker Desktop runs the dev container — the inner daemon runs nginx, front-end, server and mongo.

Created docker-compose.yaml with four services: nginx, front-end, server, mongo.

Created nginx.conf: / proxies to the front-end, /api/ proxies to the server with the prefix stripped.

index.ts avoids a top-level await using async instead of await, so it starts on the node:20 image.

## Version 1.3.0

Added two more API replicas named yi, er and san in docker-compose.yaml, defined once with a YAML anchor, and set up round-robin load balancing between them with an nginx upstream block.

Added proxy caching to nginx.conf for the front-end, book details. Everything else under /api/ stays uncached. Nginx now keeps a local copy of the answer.

Added X-Cache-Status and X-Upstream response headers so the cache and load balancing can be seen while testing.

The adapter sends an X-Book-Filters header whenever filters are applied, and nginx bypasses and refuses to store those responses, so filtered results are never served from the cache.

Used eslint and then created .prettierignore and .prettiercc since running prettier would add unnecessary characters.

Ran ESLint and prettier. Prettier edited every single file. I'm hoping nothing broke.

Deepseek told me to test bypassing for filter requests:

```bash
curl -s -o /dev/null -D - -X POST http://localhost:8080/api/books/list \
  -H 'X-Book-Filters: 1' -H 'Content-Type: application/json' \
  -d '[{"name":"crichton"}]' | grep -i x-cache
```

## V1.4.0

I have decided to no longer use prettier for this assignment since Lint is all I need if functionality is assured. Goodbye .prettierignore and .prettiercc!

## V2

I'm calling this V2 because it is complete. Client-side filtering and order placement functions because I have tested it using my own book database.

## V2.0.1

The final not complete because invisible characters were messing with the exact text bash passed to the programs and git doesn't like tha.

## V2.0.2

Edited the readme formatting.

## V2.0.3

Search — The name and author filters in the search were using the regex option "ix". The "x" flag ignores whitespace inside the pattern, so "Sole Survivor" was searched as "solesurvivor". Switched "ix" to "i".

Search — text from the filter boxes went into $regex unescaped, so typing "(" returned a 500. Added an escapeRegex helper that escapes regex metacharacters before the query.

Errors: the adapter threw fixed strings, so the page only ever showed "Response returned an error code". Added adapter/errors.ts with errorFromResponse, which reads the response body and includes the HTTP status. Failures now read e.g. Could not fulfil order (HTTP 500): not enough copies.

Added tests/api.spec.ts with five HTTP-level tests: deleting a book returns 200 and removes it from mongo, deleting it again returns 404, placing copies on a shelf shows up in the warehouse book info, placing and then fulfilling an order takes the copies off the shelf and removes the order, fulfilling an order that doesn't exist returns an error, and posting a book with an unexpected extra field is rejected.

## V2.0.4

Removed hello.route.ts and tests/hello.spec.ts placeholder from the template, and regenerated the spec so /hello no longer appears in Swagger.

