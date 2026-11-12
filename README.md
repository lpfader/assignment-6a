# McMasterful Books — BVD 103 Assignment 6

The McMasterful Books backend (Koa + tsoa + MongoDB), served behind an nginx reverse proxy alongside the storefront, so the whole thing runs as one origin on port 8080 — a stand-in for a real deployment rather than a dev server.

## What's in here

| Path | What it is |
|---|---|
| `src/` | API routes (books, warehouse, orders), database accessors |
| `adapter/` | Browser-side client the front-end image loads at `/source/adapter` |
| `server.ts`, `index.ts` | Koa app setup and entry point |
| `tsoa.json` | OpenAPI spec + route generation config (`basePath: /api`) |
| `nginx.conf` | Reverse proxy rules |
| `docker-compose.yaml` | nginx, front-end, server, mongo |
| `tests/` | API tests against the generated client |

## Running it

Prerequisites: Docker Desktop, and VS Code with the Dev Containers extension.

1. Open this folder in VS Code → **Dev Containers: Reopen in Container**
2. In the container terminal:

```bash
npm install
./generate-openapi.sh
docker compose up -d
```

3. Forward port `8080` (VS Code Ports tab) and open:

- **http://localhost:8080** — the storefront
- **http://localhost:8080/api/docs** — Swagger UI

## How requests are routed

nginx is the only thing exposed. Everything else talks to it over the internal Docker network:

| Request | Goes to |
|---|---|
| `/` | `front-end:9080` — the static storefront |
| `/api/...` | `server:3000/...` — the Koa API, prefix stripped |

Because the site and the API share one origin, the adapter calls `/api/...` with a relative URL instead of `http://localhost:3000`.

## Scripts

| Command | Does |
|---|---|
| `npm run start-server` | Generate spec + client, then run the API on port 3000 |
| `npm run lint` / `npm run fix-lint` | Generate, then ESLint |
| `npm run check-types` | Generate, then `tsc --noEmit` |
| `npm test` / `npm run test:ci` | Vitest (watch / single run) |

Every script regenerates the OpenAPI spec and client first, so they need Java available — it is in the dev container.

## Notes

- `build/` and `client/` are generated and gitignored. Regenerate with `./generate-openapi.sh`.
- `index.ts` deliberately avoids a top-level `await`: the server container runs `node:20`, which cannot `require()` an async module.
- The MongoDB in `docker-compose.yaml` starts empty — it is a separate container from the one in the dev container.
