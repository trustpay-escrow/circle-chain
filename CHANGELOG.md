# Changelog 📜

All notable changes to the CircleChain open-source repository are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.3.0] - 2026-10-16

### Added
- **Prisma ORM & PostgreSQL Core Engine**:
  - Transitioned metadata and indexing architecture from temporary Supabase layer to production Prisma ORM (`prisma/schema.prisma`).
  - Added relational models for `CircleMetadata`, `UserProfile`, `CircleMember`, `Contribution`, `Notification`, and `ReputationLog`.
  - Added PostgreSQL 16 and Redis 7 multi-container orchestration in `docker-compose.yml`.
- **Drips Protocol Compliance**:
  - Added `FUNDING.json` at repository root defining project polygon payout address for protocol verification.
  - Added structured Drips engineering issues backlog in `docs/drips-wave-issues.json` (7,250 points allocated).
- **Automated Testing Suite**:
  - Configured Vitest test runner across both `backend` and `frontend`.
  - Added unit and integration tests covering StrKey CRC16 Stellar address validation, Circle REST API routing, user profiles, and notifications.
- **Reviewer Automated Verification**:
  - Added 1-command Friendbot Testnet verification script (`scripts/seed-and-verify.ts`) to fund keypairs and verify database ingestion.
- **Documentation Suite**:
  - Added `docs/COMPONENTS.md`, `docs/STATE_ARCHITECTURE.md`, `docs/CONTRACT_CALLS.md`, and `ENVIRONMENT.md`.

### Changed
- Refactored backend routes (`/api/circles`, `/api/profiles`, `/api/notifications`) to utilize high-performance Prisma client singleton.
- Hardened CI/CD pipeline (`.github/workflows/ci.yml`) to enforce Rust contract tests, TypeScript typechecks, and Vitest test suites.

---

## [0.2.0] - 2026-09-28

### Added
- Soroban smart contracts in Rust (`contracts/src/lib.rs`) implementing ROSCA core lifecycle:
  - `create_circle`: Deterministic payout order and cycle interval calculation.
  - `join_circle`: Non-custodial collateral deposit and state progression.
  - `contribute`: Cycle deposit tracking and pot accumulation.
  - `check_and_release_payout`: Automated pot release to scheduled beneficiary.
  - `handle_default`: Collateral slashing mechanism for defaulted savers.
- Unit and integration tests for Soroban contracts (`contracts/src/test.rs`).

---

## [0.1.0] - 2026-09-10

### Added
- Initial Next.js 14 App Router user interface with Tailwind CSS and glassmorphism design.
- Multi-wallet connector supporting Freighter, Albedo web popup, xBull, and LOBSTR.
- Interactive Contribution Grid component and circle creation wizard.
