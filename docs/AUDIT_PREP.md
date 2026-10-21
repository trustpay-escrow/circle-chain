# CircleChain Smart Contract Audit Preparation Brief 🔍

This document prepares independent third-party security auditors for reviewing the CircleChain Soroban smart contracts.

---

## 1. Scope of Audit

| Target Source File | Lines of Code | Core Responsibility | Criticality |
|---|---|---|---|
| [`contracts/src/lib.rs`](file:///c:/Users/Zion/Desktop/Ajo/contracts/src/lib.rs) | ~73 | Public Soroban contract entrypoint & dispatch router | HIGH |
| [`contracts/src/types.rs`](file:///c:/Users/Zion/Desktop/Ajo/contracts/src/types.rs) | ~90 | Data structures, storage DataKey mappings, status enums | CRITICAL |
| [`contracts/src/circle.rs`](file:///c:/Users/Zion/Desktop/Ajo/contracts/src/circle.rs) | ~50 | Circle initialization, ID sequencing, parameter checks | HIGH |
| [`contracts/src/member.rs`](file:///c:/Users/Zion/Desktop/Ajo/contracts/src/member.rs) | ~65 | Member registration, collateral atomic transfer, status shift | HIGH |
| [`contracts/src/payout.rs`](file:///c:/Users/Zion/Desktop/Ajo/contracts/src/payout.rs) | ~95 | Contribution verification, pot accumulation, disbursement | CRITICAL |
| [`contracts/src/default_logic.rs`](file:///c:/Users/Zion/Desktop/Ajo/contracts/src/default_logic.rs) | ~90 | Slashing logic, grace period enforcement, withdrawal | CRITICAL |

---

## 2. Storage Slot Mapping (`contracts/src/types.rs`)

Soroban stores state in typed persistent storage buckets using the `DataKey` enum:

| DataKey Variant | Storage Type | Key Definition | Payload Type |
|---|---|---|---|
| `DataKey::Circle(circle_id)` | Persistent | `(Symbol("Circle"), u64)` | `Circle` struct |
| `DataKey::Member(circle_id, address)` | Persistent | `(Symbol("Member"), u64, Address)` | `Member` struct |
| `DataKey::CycleContributions(circle_id, cycle)` | Persistent | `(Symbol("Cycle"), u64, u32)` | `Vec<Address>` |
| `DataKey::TotalCircles` | Persistent | `Symbol("TotalCircles")` | `u64` |

---

## 3. Mathematical Models & Invariant Proofs

### 3.1 Total Pot Conservation Invariant
For any active cycle $c$, the total pot disbursed to recipient $R_c$ strictly equals:
$$P = \text{contribution\_amount} \times \text{member\_count}$$
- **Proof**: `check_and_release_payout` requires `paid_members.len() == circle.member_count`. Duplicate contributions from the same address are rejected by the duplicate check guard.
- **Arithmetic Safety**: Soroban `i128` operations are checked against overflow. In a pool of 20 members contributing 10,000 USDC (`10^11` stroops), $P = 2 \times 10^{12}$ stroops, which is well within $i128::MAX \approx 1.7 \times 10^{38}$.

### 3.2 Collateral Conservation Invariant
For any completed circle:
$$\sum_{m \in M} \text{withdrawn\_collateral}(m) + \sum_{d \in D} \text{slashed\_collateral}(d) = |M| \times \text{collateral\_required}$$
- Collateral cannot be withdrawn until `circle.status == CircleStatus::Completed`.
- Defaulted members have `member.collateral_deposited` set to `0` upon slashing, preventing double-withdrawals.

---

## 4. Reentrancy & Front-Running Guards

1. **State Updates Before External Calls (Checks-Effects-Interactions)**:
   In `check_and_release_payout`, recipient status and cycle progression (`circle.current_cycle += 1`) are calculated before the SAC token transfer is executed.
2. **Deterministic Payout Schedule**:
   The payout order is fixed at circle creation (`payout_schedule: Vec<Address>`), eliminating miner or validator front-running of turn assignment.
