# CircleChain State & Protocol Architecture 🏛️

This document details the state lifecycle, non-custodial cryptographic guarantees, and data synchronization flow between the Stellar ledger, backend Prisma ORM (PostgreSQL), and the client application.

---

## 1. Architectural Principles

CircleChain enforces **strict separation** between immutable financial state and mutable descriptive state:

1. **On-Chain Soroban Smart Contracts**:
   - Sole authority for fund custody, collateral lockups, cycle progression, payout execution, and slashing.
   - Non-custodial: only the user's private key via their wallet can sign transactions.
2. **Off-Chain Prisma ORM (PostgreSQL)**:
   - Indexes circle human-readable metadata (names, descriptions, avatars, categories).
   - Tracks off-chain notifications, cycle reminders, and portable reputation telemetry.
   - **Guaranteed invariant**: Database never stores private keys, seeds, or authorization signatures.
3. **Client-Side State**:
   - Reactive wallet provider context tracking public key, network identifier, and active connection status.

---

## 2. Multi-Layer State Topology

```mermaid
graph TD
    subgraph Client [Next.js App Router Client]
        WalletCtx[Wallet State Context]
        Freighter[Freighter / Albedo / xBull / LOBSTR]
        UIState[UI React State]
    end

    subgraph Ledger [Stellar Ledger / Soroban VM]
        Contract[CircleChain Soroban Contract]
        Escrow[Collateral & Pool Escrow]
        SAC[Stellar Asset Contract - USDC]
    end

    subgraph Server [Backend Node.js API Service]
        Express[Express REST API]
        Prisma[Prisma ORM Client]
        Worker[Indexer & Notification Sync]
    end

    subgraph Storage [Persistent Storage]
        Postgres[(PostgreSQL 16 Relational DB)]
        Redis[(Redis 7 Cache & Queue)]
    end

    WalletCtx -->|Signs Transaction| Freighter
    Freighter -->|Submits RPC Call| Ledger
    Contract -->|Emits Events| Ledger
    Worker -->|Polls Horizon & Soroban RPC| Ledger
    Worker -->|Writes Metadata & Index| Prisma
    Express -->|Queries / Mutations| Prisma
    Prisma --> Postgres
    Worker --> Redis
    UIState -->|Fetches REST Data| Express
```

---

## 3. State Invariants & Non-Custodial Guarantees

| Concern | On-Chain (Soroban) | Off-Chain (Prisma + PostgreSQL) |
|---|---|---|
| **Funds & Escrow** | `i128` balance locked in Soroban contract address | Never holds balances. Only logs amounts for UX |
| **Collateral Slashing** | Executed in Rust contract (`handle_default`) | Receives audit log event post-execution |
| **Identity & Keys** | Verified via `Address::require_auth()` | Stores public key (`G...`) with StrKey CRC16 validation |
| **Cycle Transitions** | Enforced strictly by timestamp comparison (`env.ledger().timestamp()`) | Indexed for UI countdowns & notifications |

---

## 4. Wallet Connection Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Web as Web App (Next.js)
    participant Extension as Freighter / Albedo
    participant API as Backend API (Express)
    participant DB as PostgreSQL (Prisma)

    User->>Web: Click "Connect Wallet"
    Web->>Extension: Request Public Key (`requestAccess`)
    Extension-->>User: Prompt Approval Dialog
    User-->>Extension: Approve Connection
    Extension-->>Web: Return Public Key (e.g. GABC...1234)
    Web->>API: GET /api/profiles/:walletAddress
    API->>DB: prisma.userProfile.upsert()
    DB-->>API: User Profile & Reputation Record
    API-->>Web: 200 OK (Profile Data)
    Web-->>User: UI Updated: Active Wallet & Score
```

---

## 5. Offline & High-Availability Resilience

- **Prisma Connection Pooling**: Configured with automated retry handlers and graceful health probe reporting (`/health`).
- **Client Cache**: Next.js App Router leverages server caching with stale-while-revalidate for read performance.
- **Failover Safe**: If the backend database is unreachable during maintenance, the client falls back to read-only direct Soroban contract RPC queries.
