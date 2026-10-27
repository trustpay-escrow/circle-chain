# CircleChain ⭕ (Ajo / Esusu on Stellar)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI Pipeline](https://github.com/trustpay-escrow/circle-chain/actions/workflows/ci.yml/badge.svg)](https://github.com/trustpay-escrow/circle-chain/actions)
[![Stellar Network](https://img.shields.io/badge/Stellar-Testnet%20%7C%20Futurenet-blue.svg)](https://stellar.org)
[![Backend Framework](https://img.shields.io/badge/Backend-Fastify%205%20%2B%20TypeScript-000000.svg?logo=fastify)](https://fastify.dev)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%2016%20%2B%20Prisma%20ORM-336791.svg)](https://www.prisma.io)
[![Vitest Coverage](https://img.shields.io/badge/Tests-100%25%20Passing%20(Vitest)-brightgreen.svg)](https://vitest.dev)
[![Node Version](https://img.shields.io/badge/Node-v20%2B%20%28ESM%29-green.svg)](https://nodejs.org)
[![Drips Verified](https://img.shields.io/badge/Drips%20Wave-7%2C250%20Pts%20Allocated-blueviolet.svg)](https://drips.network)

**CircleChain** is a production-grade, decentralized Rotating Savings and Credit Association (ROSCA) protocol built on the **Stellar blockchain** using **Soroban Rust smart contracts**, **Fastify 5 (enterprise layered architecture)**, **Prisma ORM (PostgreSQL 16)**, **Redis 7**, and **Next.js 14 (App Router)**.

---

## 📌 Problem Statement

In emerging economies (particularly across West Africa, East Africa, and Latin America), over 350 million adults participate in informal community savings groups known as **Ajo**, **Esusu**, **Tandas**, or **Chamas**. Despite moving billions of dollars annually, these traditional ROSCA pools face critical challenges:
1. **Default & Flight Risk**: Early pot recipients frequently default on subsequent cycle contributions without recourse.
2. **Opaque Bookkeeping**: Manual paper ledgers create disputes over contribution timings and payout sequence orders.
3. **Zero Financial Inclusion**: Prompt savers build no portable credit history or verifiable financial reputation.
4. **Physical Cash Vulnerability**: In-person cash collection creates theft and security risks for community coordinators.

---

## 💡 The CircleChain Solution

CircleChain elevates communal savings into a cryptographic, non-custodial Web3 protocol:
- **Non-Custodial Escrow on Soroban**: Collateral deposits and cycle contributions are held strictly in audited smart contracts (`contracts/src/lib.rs`).
- **Automated Collateral Slashing**: Defaulters have their staked security deposit automatically slashed to protect other group participants.
- **Enterprise Fastify & Prisma Indexer**: Layer-isolated architecture (Routes -> Services -> Repositories -> Database) with schema-first validation, automated OpenAPI/Swagger specs (`/docs`), and connection pooling.
- **Production Observability & Resilience**: Structured JSON logging (Pino) with correlation tracing (`x-request-id`), sensitive data redaction, graceful termination, and Kubernetes probes (`/health`, `/healthz`, `/live`, `/ready`, `/metrics`).
- **Cryptographic Address Verification**: Enforces StrKey RFC 4648 Base32 decoding and CRC16-XMODEM checksum validation.
- **Soulbound Reputation Scoring (SBT)**: On-time contributions build portable credit reputation (0–100 score).

---

## 🏛 System Architecture

```mermaid
graph TD
    subgraph Client [Next.js 14 App Router]
        UI[Glassmorphism UI]
        WalletKit[Multi-Wallet Connector]
        Freighter[Freighter / Albedo / xBull / LOBSTR]
    end

    subgraph Ledger [Stellar Blockchain / Soroban VM]
        Contract[CircleChain Soroban Contract]
        Escrow[Collateral & Pool Escrow]
        Token[SAC - USDC / XLM]
    end

    subgraph Server [Backend Fastify Enterprise Engine]
        Factory[App Factory - buildServer]
        Hooks[x-request-id Tracing & Pino Logger]
        Routes[HTTP Handlers - Schema First]
        Services[Domain Business Logic]
        Repos[DAO / Repositories]
        DB[Prisma Client Singleton]
        Validator[StrKey CRC16 Validator]
    end

    subgraph Storage [Containerized Storage]
        Postgres[(PostgreSQL 16 Database)]
        Redis[(Redis 7 Cache)]
    end

    WalletKit --> Freighter
    Freighter -->|Signs XDR| Contract
    Contract --> Escrow
    Contract --> Token
    UI -->|REST Queries| Routes
    Factory --> Hooks
    Routes --> Services
    Services --> Validator
    Services --> Repos
    Repos --> DB
    DB --> Postgres
    Services --> Redis
```

---

## 🏗 Repository Structure

```text
circle-chain/
├── .github/workflows/
│   └── ci.yml                 # Automated CI (Rust tests, Prisma client, Vitest, Next build)
├── contracts/                 # Soroban Smart Contract (Rust Wasm)
│   ├── Cargo.toml             # Soroban SDK dependencies
│   └── src/
│       ├── lib.rs             # Public contract entrypoints (create, join, contribute, payout, slash)
│       └── test.rs            # 100% passing contract unit tests
├── backend/                   # Fastify Enterprise Layered REST Engine
│   ├── prisma/
│   │   ├── schema.prisma      # PostgreSQL schema (CircleMetadata, UserProfile, Member, Contribution)
│   │   └── migrations/        # Versioned database migrations
│   ├── src/
│   │   ├── index.ts           # Bootstrap entrypoint & graceful shutdown triggers
│   │   ├── server.ts          # Fastify app factory (buildServer) exportable for zero-port testing
│   │   ├── config.ts          # Centralized strictly-validated environment configuration (Zod)
│   │   ├── db.ts              # Database lifecycle, pooling & health check probes
│   │   ├── logger.ts          # Structured Pino logger with sensitive data redaction
│   │   ├── shutdown.ts        # Graceful shutdown (SIGINT/SIGTERM, closing server & DB)
│   │   ├── error-handlers.ts  # Global error handler & standardized response envelope
│   │   ├── request-id.ts      # Correlation ID generation & tracing hooks (x-request-id)
│   │   ├── metrics.ts         # Application & system metrics collection
│   │   ├── schema.ts          # Fastify JSON schemas & OpenAPI/Swagger definitions
│   │   ├── repositories/      # Data Access Layer (DAO / Repository pattern over Prisma)
│   │   │   ├── circles.repository.ts
│   │   │   ├── profiles.repository.ts
│   │   │   ├── contributions.repository.ts
│   │   │   └── notifications.repository.ts
│   │   ├── services/          # Domain Business Logic & background helpers
│   │   │   ├── circles.service.ts
│   │   │   ├── contributions.service.ts
│   │   │   └── notifications.service.ts
│   │   ├── routes/            # HTTP Controllers with schema validation
│   │   │   ├── root.ts        # API index & /docs redirect
│   │   │   ├── status.ts      # Health probes (/health, /healthz, /live, /ready, /metrics)
│   │   │   ├── circles.ts     # Savings circle endpoints
│   │   │   ├── profiles.ts    # User profile & reputation endpoints
│   │   │   ├── contributions.ts # Cycle contributions & pot payouts
│   │   │   └── notifications.ts # Due alerts & notification feeds
│   │   └── lib/               # Shared domain utilities (Stellar validator, BigInt serializer)
│   ├── tests/                 # Mirrored Vitest test suite (100% passing)
│   │   ├── fixtures/          # Test data mocks & factories
│   │   ├── routes/            # Route schema validation & controller unit tests (app.inject)
│   │   ├── repositories/      # Repository layer tests with Prisma mocks
│   │   ├── lib/               # Pure utility unit tests
│   │   └── integration/       # Full server lifecycle, CORS & 404 integration tests
│   ├── Dockerfile             # Multi-stage production container build
│   ├── docker-compose.yml     # Local services (PostgreSQL 16, Redis 7, Backend)
│   ├── .env.example           # Fully documented environment variable specification
│   ├── tsconfig.json          # Production TypeScript compiler config
│   ├── tsconfig.test.json     # Dedicated test runner tsconfig
│   └── vitest.config.ts       # Backend Vitest configuration
├── frontend/                  # Next.js 14 App Router Web App
│   ├── app/                   # Routes (/circles, /circles/create, /profile)
│   ├── components/            # UI components (ContributionGrid, Navbar, WalletModal)
│   ├── lib/                   # Stellar SDK & API client integration helpers
│   ├── test/                  # Test setup & mocks
│   └── vitest.config.ts       # Frontend component test runner
├── docs/                      # Comprehensive Architecture Documentation
│   ├── COMPONENTS.md          # Complete directory of UI components and roles
│   ├── STATE_ARCHITECTURE.md  # State flow, wallet context, and non-custodial invariants
│   ├── CONTRACT_CALLS.md      # Detailed map of every Soroban contract call & RPC schema
│   ├── ENVIRONMENT.md         # Exhaustive environment variables guide
│   └── drips-wave-issues.json # 42 structured engineering issues (7,250 points allocated)
├── scripts/
│   ├── seed-and-verify.ts     # 1-command reviewer Friendbot Testnet verification script
│   └── publish-drips-issues.ts # Automated GitHub issue publisher CLI
├── docker-compose.yml         # Local stack (PostgreSQL 16, Redis 7, Backend, Frontend)
├── FUNDING.json               # Drips protocol verified payout address configuration
├── ENVIRONMENT.md             # Root environment guide
├── CHANGELOG.md               # Version history and feature track record
├── CONTRIBUTING.md            # Contributor guidelines & PR conventions
├── SECURITY.md                # Non-custodial security policy
└── LICENSE                    # OSI-approved MIT License
```

---

## ⚡ Quick Start & Reviewer Verification Guide

Reviewers can verify the full repository in 4 simple commands:

### 1. Install Dependencies
```bash
# Backend dependencies (Fastify 5, Prisma, Pino, Zod)
npm --prefix backend install --legacy-peer-deps

# Frontend dependencies (Next.js 14, Tailwind, Stellar Wallets Kit)
npm --prefix frontend install --legacy-peer-deps
```

### 2. Run Automated Test Suites
```bash
# Run backend Vitest test suite (unit, repository, route, and integration tests)
npm test

# Run frontend Vitest component test suite
npm --prefix frontend test

# Run Soroban smart contract tests
npm run test:contracts
```

### 3. Start Local Container Stack (PostgreSQL 16 + Redis 7)
```bash
docker-compose up -d
```

### 4. Run 1-Command Live Testnet Verification Script
```bash
npm run verify
```
*This command generates an authentic Stellar keypair, calls Stellar Friendbot to fund it with 10,000 Testnet XLM, verifies ledger confirmation via Horizon RPC, and performs database ingestion through the Prisma backend.*

---

## 📖 API Documentation & Probes

When running the backend (`npm --prefix backend run dev`), the following endpoints are available:
- **Interactive Swagger / OpenAPI UI**: `http://localhost:4000/docs`
- **Liveness Probe**: `http://localhost:4000/live`
- **Readiness Probe**: `http://localhost:4000/ready`
- **Health Check Probe**: `http://localhost:4000/health`
- **System & Memory Metrics**: `http://localhost:4000/metrics`

---

## 🤝 Drips Wave Grant Alignment

- **Grant Qualification Matrix**: Detailed in [`SUBMISSION.md`](file:///c:/Users/Zion/Desktop/Ajo/SUBMISSION.md).
- **Verified Protocol Address**: Configured in [`FUNDING.json`](file:///c:/Users/Zion/Desktop/Ajo/FUNDING.json).
- **Task Backlog**: 42 scoped engineering issues ready for community developers in [`docs/drips-wave-issues.json`](file:///c:/Users/Zion/Desktop/Ajo/docs/drips-wave-issues.json).
- **Architecture Specifications**: In [`ARCHITECTURE.md`](file:///c:/Users/Zion/Desktop/Ajo/ARCHITECTURE.md) and [`docs/STATE_ARCHITECTURE.md`](file:///c:/Users/Zion/Desktop/Ajo/docs/STATE_ARCHITECTURE.md).

---

## 📄 License

This project is licensed under the [MIT License](file:///c:/Users/Zion/Desktop/Ajo/LICENSE).
