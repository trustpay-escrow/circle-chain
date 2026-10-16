# CircleChain Environment Variables Specification 🌐

This document provides a comprehensive reference for all environment configuration parameters used across the CircleChain monorepo services (`backend/` and `frontend/`).

---

## 1. Backend Service Configuration (`backend/.env`)

| Variable | Type | Default | Description |
|---|---|---|---|
| `PORT` | `number` | `4000` | Port on which the Express REST API server listens |
| `DATABASE_URL` | `string` | `postgresql://postgres:postgres@localhost:5432/circlechain?schema=public` | Relational PostgreSQL connection string for Prisma ORM |
| `REDIS_URL` | `string` | `redis://127.0.0.1:6379` | Redis connection URL for caching, queues, and rate-limiting |
| `STELLAR_NETWORK` | `string` | `TESTNET` | Target Stellar network (`TESTNET` or `FUTURENET`) |
| `STELLAR_RPC_URL` | `string` | `https://soroban-testnet.stellar.org` | Soroban RPC endpoint for simulating and verifying on-chain events |
| `STELLAR_HORIZON_URL` | `string` | `https://horizon-testnet.stellar.org` | Stellar Horizon REST endpoint for account balances & payments |
| `CONTRACT_ID` | `string` | `CA...` | Address of deployed CircleChain Soroban smart contract |
| `TESTNET_SECRET_KEY` | `string` | Optional | Ephemeral Testnet key used by automated reviewer verification scripts |

---

## 2. Frontend Web Application (`frontend/.env.local`)

| Variable | Type | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | `string` | `http://localhost:4000` | Base URL of the backend indexer API service |
| `NEXT_PUBLIC_STELLAR_NETWORK` | `string` | `TESTNET` | Network mode badge displayed in the navigation bar |
| `NEXT_PUBLIC_SOROBAN_RPC_URL` | `string` | `https://soroban-testnet.stellar.org` | Direct RPC connection for client wallet simulations |
| `NEXT_PUBLIC_CONTRACT_ID` | `string` | `CA...` | Soroban contract identifier used by client wallets for invocation |

---

## 3. Production Docker Environment (`docker-compose.yml`)

When running in containerized mode via `docker-compose up -d`:
- PostgreSQL credentials are provided via `POSTGRES_USER` (`postgres`), `POSTGRES_PASSWORD` (`postgres`), and `POSTGRES_DB` (`circlechain`).
- The backend connects internally using the container network alias: `DATABASE_URL=postgresql://postgres:postgres@postgres:5432/circlechain?schema=public`.
- The frontend connects to the backend container over port `4000`.
