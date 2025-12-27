# Async AI Feature (Hono + Redis + QStash)

## Overview

This monorepo implements an async AI analysis flow:

1. The user submits a form with name, age, and a short description.
2. The backend returns a `requestId` and queues processing via QStash.
3. QStash calls a webhook later, which triggers the OpenAI request.
4. The result is stored in Redis and can be fetched by `requestId`.

## Repo structure

- `apps/web`: Next.js frontend (form + result page)
- `apps/api`: Hono backend (API, webhook, Redis, QStash, OpenAI)
- `packages/shared`: shared Zod schemas and TypeScript types

## Requirements

- Node.js >= 20.9
- pnpm 10+
- Upstash Redis + QStash credentials
- OpenAI API key

## Environment variables

### Backend (`apps/api/.env.example`)

```
PORT=3001
ANALYSIS_TTL_SECONDS=3600

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

QSTASH_TOKEN=
QSTASH_WEBHOOK_URL=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=
QSTASH_DELAY=60s

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

### Frontend (`apps/web/.env.example`)

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

## Running locally

```
pnpm -w install
pnpm dev
```

Or run separately:

```
pnpm --filter api dev
pnpm --filter web dev
```

Open:

- Frontend: http://localhost:3000
- Backend: http://localhost:3001/health

## API endpoints

- `POST /analyze` — validate input, create `requestId`, store state, enqueue QStash
- `GET /analyze/:requestId` — return status and result if ready
- `POST /webhook` — QStash callback, runs OpenAI and updates Redis

## Notes / Simplifications

- Business logic is kept inside controllers because the flow is small; in production this would move to dedicated services/use-cases.
- The webhook only does signature verification and simple state transitions to keep the flow readable and focused on the main async logic.
- The frontend polls the API every 3 seconds instead of using push/streaming to avoid adding WebSocket/SSE complexity.
- Minimal error modeling: errors are saved as plain strings.

## What I would improve in production

- Add auth + rate limiting for `/analyze` and strict verification for `/webhook` (replay protection, tighter signature checks).
- Make async jobs idempotent and add retries/backoff with a dead-letter queue.
- Store results in a durable database, keep Redis only as a cache.
- Add structured logs, tracing, and metrics for the async pipeline.
- Centralize secrets/config management and rotate keys safely.
- Add load testing and autoscaling policies for spikes.
