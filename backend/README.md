# CircleChain Backend Engine ⚙️

Enterprise-grade, high-performance backend for the CircleChain Stellar Soroban ROSCA protocol built with **Fastify 5**, **TypeScript**, **Prisma ORM (PostgreSQL 16)**, **Pino**, and **Vitest**.

---

## 🏛 Architecture Overview

The backend strictly enforces clean layer boundaries and separation of concerns:

```
src/
├── index.ts                    # Entry point: bootstrap, signal listeners
├── server.ts                   # Fastify app factory (buildServer) exportable for testing
├── config.ts                   # Strict environment variable validation with Zod
├── db.ts                       # Database client singleton, pooling, health probes
├── logger.ts                   # Structured Pino logging with sensitive field redaction
├── shutdown.ts                 # Graceful termination (SIGINT/SIGTERM, closing DB & server)
├── error-handlers.ts           # Global error handler & standardized response envelopes
├── request-id.ts               # Request correlation ID generation and tracing (x-request-id)
├── metrics.ts                  # Application & system metrics collection
├── schema.ts                   # Shared request/response validation schemas & Swagger specs
├── repositories/               # Data Access Layer (DAO / Repository pattern over Prisma)
│   ├── circles.repository.ts
│   ├── profiles.repository.ts
│   ├── contributions.repository.ts
│   └── notifications.repository.ts
├── services/                   # Domain business logic & background helpers
│   ├── circles.service.ts
│   ├── contributions.service.ts
│   └── notifications.service.ts
├── routes/                     # HTTP Handlers / Controllers
│   ├── root.ts                 # Base routing & API index
│   ├── status.ts               # Liveness, readiness, health & metrics probes
│   ├── circles.ts              # Savings circles endpoints
│   ├── profiles.ts             # User profiles & reputation
│   ├── contributions.ts        # Contributions & payout records
│   └── notifications.ts        # Notifications & due reminders
└── lib/                        # Pure utility functions & shared helpers
    ├── stellar-validator.ts    # Ed25519 & CRC16-XMODEM key validator
    └── serialization.ts        # BigInt & Decimal JSON serialization
```

---

## ⚡ Core Principles

1. **App Factory Pattern**: `buildServer()` in `src/server.ts` returns an app instance without calling `.listen()`. Fast integration testing uses `app.inject()` with zero port conflicts.
2. **Layer Isolation**: Route controllers never query the database directly; they call domain services or repositories.
3. **Schema-First Validation**: All incoming payloads (params, query, body) and responses are strictly validated using Fastify schemas that automatically generate OpenAPI/Swagger documentation at `/docs`.
4. **Production Observability**: Structured JSON logging via Pino, correlation IDs (`x-request-id`), health/readiness probes (`/health`, `/healthz`, `/live`, `/ready`), and metrics (`/metrics`).
5. **Zero Leakage**: Automatic redaction of sensitive fields (tokens, passwords, secrets, private keys) in logs and error responses.

---

## 🛠 Available Scripts

```bash
# Start development watcher (tsx)
npm run dev

# Compile production bundle (tsc)
npm run build

# Start production server
npm start

# Run all test suites
npm test

# Run unit tests only (utilities & repositories)
npm run test:unit

# Run integration tests only (routes & server)
npm run test:integration

# Type check without emitting files
npm run typecheck

# Prisma ORM workflows
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
```

---

## 📚 API Endpoints & Probes

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | API index & service metadata |
| `GET` | `/docs` | Interactive Swagger / OpenAPI UI |
| `GET` | `/live` | Kubernetes Liveness Probe |
| `GET` | `/ready` | Kubernetes Readiness Probe (verifies DB) |
| `GET` | `/health` | Comprehensive Health Probe |
| `GET` | `/metrics` | Memory & request telemetry |
| `GET` | `/api/circles` | List all savings circles |
| `POST` | `/api/circles` | Create a new savings circle |
| `GET` | `/api/circles/:id` | Fetch circle details by ID |
| `POST` | `/api/circles/:id/join` | Join an active forming circle |
| `GET` | `/api/profiles/:wallet` | Fetch profile & reputation score |
| `POST` | `/api/profiles` | Upsert profile |
| `GET` | `/api/contributions/:circleId` | Fetch contribution matrix |
| `POST` | `/api/contributions` | Record cycle contribution |
| `POST` | `/api/contributions/payout` | Log pot payout release |
| `GET` | `/api/notifications/:wallet` | User notifications |
| `POST` | `/api/notifications/remind` | Dispatch off-chain reminders |
