use soroban_sdk::{contracttype, Address, Vec};

/// Represents the status of an Ajo/Esusu circle throughout its lifecycle
#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum CircleStatus {
    Forming,   // Created, waiting for member collateral & full capacity
    Active,    // All members joined, cycle contributions underway
    Completed, // All cycles finished and all payouts distributed
    Defaulted, // A member defaulted post-payout, triggering slashing
}

/// Defines the recipient selection mechanism per cycle
#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum PayoutOrderMode {
    Fixed,      // Pre-determined order fixed at circle creation (MVP)
    Randomized, // Contract-generated pseudo-random order upon activation
    BidBased,   // Auction mechanism for priority queueing
}

/// Primary data structure representing a rotating savings circle
#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Circle {
    pub id: u64,
    pub creator: Address,
    pub token_address: Address,        // Stablecoin asset (e.g. USDC contract address)
    pub contribution_amount: i128,     // Fixed contribution per member per cycle
    pub interval: u64,                 // Cycle duration in seconds (ledger time)
    pub member_count: u32,             // Fixed total capacity
    pub payout_order_mode: PayoutOrderMode,
    pub collateral_required: i128,     // Required collateral per member
    pub current_cycle: u32,            // 0-indexed current cycle
    pub cycle_start_time: u64,         // Ledger timestamp when current cycle began
    pub status: CircleStatus,
    pub payout_schedule: Vec<Address>, // Ordered list of payout recipients
}

/// Member state within a specific circle
#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Member {
    pub address: Address,
    pub join_timestamp: u64,
    pub collateral_deposited: i128,
    pub has_received_payout: bool,
    pub reputation_score: u32,
}

/// Storage keys for contract persistent & instance data
#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum DataKey {
    CircleCount,
    Circle(u64),
    Member(u64, Address),
    CircleMembers(u64),
    CycleContributions(u64, u32), // (circle_id, cycle_index) -> Vec<Address> paid members
}

// TODO: DESIGN DECISION FOR USER
// 1. Grace period: Default 86400 seconds (24 hours). Adjust based on network/wallet friction requirements.
pub const DEFAULT_GRACE_PERIOD_SECONDS: u64 = 86_400;

// TODO: DESIGN DECISION FOR USER
// 2. Slashing penalty percentage: 100% of collateral is currently slashed to cover missing pot.
pub const DEFAULT_SLASHING_PERCENTAGE: u32 = 100;
